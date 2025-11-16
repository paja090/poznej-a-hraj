// /api/cleanup-reservations.js
import nodemailer from "nodemailer";
import admin from "firebase-admin";

// === Firebase Admin inicializace (server) ===
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn(
      "⚠️ Chybí FIREBASE_SERVICE_ACCOUNT – cleanup rezervací nepůjde připojit k Firestore."
    );
  } else {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

// === Nodemailer – Gmail SMTP (stejně jako u send-ticket) ===
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || "poznejahraj@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// === Pomocné konstanty (v minutách) ===
const WARNING_MINUTES = 25; // po 25 min pošleme varování
const EXPIRE_MINUTES = 30;  // po 30 min rezervaci zrušíme

// Pomocná funkce – rozhodne, jestli je rezervace zaplacená
function isReservationPaid(data) {
  const paidStates = ["paid", "succeeded", "zaplaceno", "paid_out"];
  const status = String(data.paymentStatus || "").toLowerCase();
  return data.paid === true || paidStates.includes(status);
}

// Varovný e-mail
async function sendWarningEmail(reservation) {
  const { email, name, eventTitle } = reservation;

  if (!email) return;

  const safeName = name || "hoste";
  const safeTitle = eventTitle || "Rébus / Poznej & Hraj";

  const subject = `⚠️ Rezervace čeká na platbu – ${safeTitle}`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:#0f172a;">
      <p>Ahoj ${safeName},</p>
      <p>
        máš vytvořenou rezervaci na akci <strong>${safeTitle}</strong>, ale zatím k ní neproběhla platba.
      </p>
      <p>
        Abychom drželi místa férově pro všechny, je rezervace platná ještě přibližně
        <strong>5 minut</strong>. Pokud platbu nedokončíš, místo se automaticky uvolní pro další zájemce.
      </p>
      <p>
        Pokud už máš zaplaceno, tento e-mail můžeš ignorovat – stav se brzy zaktualizuje.
      </p>
      <p style="margin-top:20px;font-size:13px;color:#6b7280;">
        Díky a těšíme se na setkání,<br/>
        tým Poznej &amp; Hraj
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Poznej & Hraj" <${
      process.env.GMAIL_USER || "poznejahraj@gmail.com"
    }>`,
    to: email,
    subject,
    html,
  });
}

// Hlavní cleanup logika
async function runCleanup() {
  if (!db) {
    console.warn("❌ Firebase Admin není inicializovaný – cleanup se nespustil.");
    return { ok: false, reason: "no-db" };
  }

  const nowTs = admin.firestore.Timestamp.now();
  const nowMs = nowTs.toMillis();

  const warningLimitDate = new Date(
    nowMs - WARNING_MINUTES * 60 * 1000
  );
  const expireLimitDate = new Date(
    nowMs - EXPIRE_MINUTES * 60 * 1000
  );

  const reservationsRef = db.collection("reservations");

  const result = {
    warned: 0,
    expired: 0,
  };

  // 1) Najdeme pending rezervace pro varování (>= 25 min, ale ještě ne expirované)
  const warnSnap = await reservationsRef
    .where("paymentStatus", "==", "pending")
    .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(warningLimitDate))
    .get();

  for (const docSnap of warnSnap.docs) {
    const data = docSnap.data();

    if (!data.createdAt) continue;
    if (isReservationPaid(data)) continue;

    const createdAtDate = data.createdAt.toDate();

    // už je po 30 minutách? → to už bude řešit expirační část
    if (createdAtDate <= expireLimitDate) continue;

    // už jsme poslali varování?
    if (data.warningSent === true) continue;

    try {
      await sendWarningEmail({ id: docSnap.id, ...data });
      await docSnap.ref.update({
        warningSent: true,
        warningSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      result.warned += 1;
    } catch (err) {
      console.error("❌ Chyba při posílání warning e-mailu:", err);
    }
  }

  // 2) Najdeme pending rezervace starší než 30 minut → expirujeme
  const expireSnap = await reservationsRef
    .where("paymentStatus", "==", "pending")
    .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(expireLimitDate))
    .get();

  for (const docSnap of expireSnap.docs) {
    const data = docSnap.data();

    if (!data.createdAt) continue;
    if (isReservationPaid(data)) continue; // když mezitím někdo zaplatil, nesahej

    // Archivujeme do "reservationsArchive"
    const archiveRef = db.collection("reservationsArchive").doc(docSnap.id);

    try {
      await archiveRef.set({
        ...data,
        originalReservationId: docSnap.id,
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        expiredReason: "unpaid_timeout",
      });

      // smažeme původní rezervaci
      await docSnap.ref.delete();

      // Kapacitu eventu NEPŘEPOČÍTÁVÁME tady,
      // protože ji máš dopočítávanou z počtu aktivních rezervací.
      // Tím, že rezervaci smažeme, místo se automaticky uvolní.
      result.expired += 1;
    } catch (err) {
      console.error("❌ Chyba při archivaci/smazání rezervace:", err);
    }
  }

  return { ok: true, ...result };
}

// === API handler ===
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const outcome = await runCleanup();
    return res.status(200).json(outcome);
  } catch (err) {
    console.error("❌ Cleanup endpoint error:", err);
    return res
      .status(500)
      .json({ error: "Cleanup selhal na serveru." });
  }
}
