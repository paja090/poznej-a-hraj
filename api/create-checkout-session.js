// /api/create-checkout-session.js
import Stripe from "stripe";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import { getVocative } from "../utils/vocative.js";

// ==========================
//  STRIPE
// ==========================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// ==========================
//  FIREBASE ADMIN
// ==========================
if (!admin.apps.length) {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!sa) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(sa)),
    });
    console.log("✅ Firebase Admin inicializován (checkout)");
  } catch (err) {
    console.error("❌ Firebase Admin init error (checkout):", err);
  }
}

const db = admin.firestore ? admin.firestore() : null;

// ==========================
//  NODEMAILER (GMAIL SMTP)
// ==========================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || "poznejahraj@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Helper na base URL (kam se vrací Stripe)
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || "https://poznej-a-hraj.vercel.app";

// ==========================
//  API HANDLER
// ==========================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!db) {
    return res.status(500).json({ error: "Firestore není inicializovaný" });
  }

  try {
    const {
      reservationId,
      eventTitle,
      eventDate,
      eventPlace,
      price,
      email,
      name,
      peopleCount,
    } = req.body;

    if (!reservationId || !eventTitle || !email || !price) {
      return res.status(400).json({ error: "Chybí povinná data pro platbu." });
    }

    const quantity = Number(peopleCount || 1);
    const unitAmount = Math.round(Number(price) * 100); // CZK -> haléře

    // 1) Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity,
          price_data: {
            currency: "czk",
            unit_amount: unitAmount,
            product_data: {
              name: eventTitle,
              description: eventDate
                ? `Akce ${eventTitle} – ${eventDate}`
                : eventTitle,
            },
          },
        },
      ],
      metadata: {
        reservationId,
        eventTitle,
      },
      success_url: `${PUBLIC_BASE_URL}/?payment=success`,
      cancel_url: `${PUBLIC_BASE_URL}/?payment=cancel`,
    });

    // 2) Uložíme URL + sessionId do rezervace
    await db.collection("reservations").doc(reservationId).update({
      stripeCheckoutUrl: session.url,
      stripeSessionId: session.id,
      paymentStatus: "pending",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3) Pošleme potvrzovací e-mail s tlačítkem „Dokončit platbu“
    try {
      const vocativeName =
        getVocative(name || "") || name || "hoste";

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0b1020;padding:20px;color:#e5e7eb;max-width:640px;margin:auto;border-radius:16px;">
          <h2 style="margin-bottom:10px;color:#f472b6;">
            🎫 Rezervace byla vytvořena
          </h2>

          <p style="font-size:15px;line-height:1.6;">
            Ahoj <strong>${vocativeName}</strong>,<br/>
            tvoje rezervace na akci <strong>${eventTitle}</strong> byla úspěšně vytvořena.
          </p>

          <div style="background:#111827;border-radius:12px;padding:14px 16px;margin:22px 0;">
            ${
              eventDate
                ? `<p style="margin:4px 0;">📅 <strong>Datum:</strong> ${eventDate}</p>`
                : ""
            }
            ${
              eventPlace
                ? `<p style="margin:4px 0;">📍 <strong>Místo:</strong> ${eventPlace}</p>`
                : ""
            }
            <p style="margin:4px 0;">👥 <strong>Počet osob:</strong> ${quantity}</p>
            <p style="margin:4px 0;">💰 <strong>Cena:</strong> ${price} Kč</p>
          </div>

          <p style="font-size:15px;line-height:1.6;">
            Aby byla rezervace platná, je potřeba dokončit platbu
            do <strong>30 minut</strong>. Poté se místo automaticky uvolní pro další zájemce.
          </p>

          <div style="text-align:center;margin:26px 0;">
            <a href="${session.url}"
               style="background:#ec4899;color:white;padding:14px 26px;border-radius:999px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">
              💳 Dokončit platbu online
            </a>
          </div>

          <p style="font-size:13px;color:#9ca3af;">
            Pokud už máš zaplaceno, tento e-mail můžeš ignorovat – stav rezervace se brzy zaktualizuje
            a vstupenka dorazí zvlášť.
          </p>

          <hr style="border-color:#1f2937;margin:26px 0;" />

          <p style="font-size:12px;color:#6b7280;">
            Tým Poznej &amp; Hraj<br/>
            📧 poznejahraj@gmail.com
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Poznej & Hraj" <${
          process.env.GMAIL_USER || "poznejahraj@gmail.com"
        }>`,
        to: email,
        subject: `🎟 Rezervace vytvořena – ${eventTitle}`,
        html,
      });
    } catch (mailErr) {
      // když selže e-mail, nechceme blokovat platbu
      console.error("❌ Chyba při odesílání potvrzovacího e-mailu:", mailErr);
    }

    // 4) Vrátíme URL Stripe checkoutu klientovi
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ create-checkout-session error:", err);
    return res.status(500).json({ error: "Chyba při vytváření platby." });
  }
}

