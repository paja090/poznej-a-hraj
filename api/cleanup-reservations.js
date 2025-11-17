// /api/cleanup-reservations.js
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import { getVocative } from "../utils/vocative.js";

// =========================================
//  1) FIREBASE ADMIN INITIALIZACE
// =========================================
if (!admin.apps.length) {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!sa) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(sa)),
    });
    console.log("✅ Firebase Admin inicializován");
  } catch (err) {
    console.error("❌ Firebase Admin init error:", err);
  }
}

const db = admin.firestore ? admin.firestore() : null;

// =========================================
//  2) NODEMAILER (GMAIL SMTP)
// =========================================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || "poznejahraj@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// =========================================
//  3) ČASY
// =========================================
const WARNING_MINUTES = 25;
const EXPIRE_MINUTES = 30;

// =========================================
//  pomocné funkce
// =========================================
function isReservationPaid(data) {
  if (!data) return false;
  const s = (data.paymentStatus || "").toLowerCase();
  return ["paid", "succeeded", "zaplaceno", "paid_out"].includes(s);
}

// ---------- EMAIL S VAROVÁNÍM ----------
async function sendWarningEmail(data) {
  if (!data.email) return;

  const baseName = data.name?.trim() || "host";
  const vocative = getVocative(baseName);

  const subject = `⚠️ Rezervace čeká na platbu – ${data.eventTitle}`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:#0f172a;">
      <p>Ahoj ${vocative},</p>
      <p>
        máš vytvořenou rezervaci na akci <strong>${data.eventTitle}</strong>, 
        ale zatím k ní neproběhla platba.
      </p>
      <p>
        Rezervace je platná ještě přibližně <strong>5 minut</strong>. 
        Pokud platbu neodešleš, místo se automaticky uvolní pro další zájemce.
      </p>
      <p style="margin-top:20px;font-size:13px;color:#6b7280;">
        Díky a těšíme se na setkání,<br/>
        tým Poznej &amp; Hraj
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Poznej & Hraj" <${process.env.GMAIL_USER}>`,
    to: data.email,
    subject,
    html,
  });
}

// =========================================
//  4) HLAVNÍ CLEANUP LOGIKA
// =========================================
async function runCleanup() {
  if (!db) {
    return { ok: false, error: "Firestore není inicializovaný" };
  }

  const nowMs = Date.now();
  const warnLimit = nowMs - WARNING_MINUTES * 60 * 1000;
  const expireLimit = nowMs - EXPIRE_MINUTES * 60 * 1000;

  const reservationsRef = db.collection("reservations");

  const result = { warned: 0, expired: 0 };

  // ---------- 4A — varování ----------
  const warnSnap = await reservationsRef
    .where("paymentStatus", "==", "pending")
    .get();

  for (const docSnap of warnSnap.docs) {
    const d = docSnap.data();
    if (!d.createdAt) continue;

    const createdMs = d.createdAt.toMillis
      ? d.createdAt.toMillis()
      : new Date(d.createdAt).getTime();

    if (isReservationPaid(d)) continue;
    if (d.warningSent) continue;

    if (createdMs <= expireLimit) continue; // už je to po 30 minutách
    if (createdMs <= warnLimit) {
      try {
        await sendWarningEmail(d);
        await docSnap.ref.update({
          warningSent: true,
          warningSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        result.warned++;
      } catch (err) {
        console.error("Warning email error:", err);
      }
    }
  }

  // ---------- 4B — expirování ----------
  const expSnap = await reservationsRef
    .where("paymentStatus", "==", "pending")
    .get();

  for (const docSnap of expSnap.docs) {
    const d = docSnap.data();
    if (!d.createdAt) continue;

    const createdMs = d.createdAt.toMillis
      ? d.createdAt.toMillis()
      : new Date(d.createdAt).getTime();

    if (isReservationPaid(d)) continue;

    if (createdMs <= expireLimit) {
      try {
        await db.collection("reservationsArchive").doc(docSnap.id).set({
          ...d,
          originalReservationId: docSnap.id,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiredReason: "unpaid_timeout",
        });

        await docSnap.ref.delete();
        result.expired++;
      } catch (err) {
        console.error("Expire error:", err);
      }
    }
  }

  return { ok: true, ...result };
}

// =========================================
//  5) API HANDLER
// =========================================
export default async function handler(req, res) {
  try {
    const outcome = await runCleanup();
    return res.status(200).json(outcome);
  } catch (err) {
    console.error("❌ Cleanup endpoint crash:", err);
    return res.status(500).json({ error: "Cleanup selhal" });
  }
}


