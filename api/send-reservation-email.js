// /api/send-reservation-email.js
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import { getVocative } from "../utils/vocative.js";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, eventTitle, eventDate, eventPlace, peopleCount } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const oslovení = getVocative(name || "host");

    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;">
        <img src="https://poznej-a-hraj.vercel.app/rebuss.png" 
             alt="Rebuss" 
             style="height:70px;margin-bottom:20px;" />

        <p>Ahoj <strong>${oslovení}</strong>,</p>

        <p>děkujeme za vytvoření rezervace na akci:</p>
        <h2 style="color:#ec4899;">${eventTitle}</h2>

        <p>
          📅 Datum: <strong>${eventDate || "nezadáno"}</strong><br/>
          📍 Místo: <strong>${eventPlace || "bude upřesněno"}</strong><br/>
          👥 Počet osob: <strong>${peopleCount}</strong>
        </p>

        <p>
          Tvoje místo je aktuálně <strong>rezervované na 30 minut</strong>.
          Pokud dokončíš platbu online, rezervace se automaticky potvrdí.
        </p>

        <p style="margin-top:20px;color:#666;">
          Těšíme se na setkání!<br/>
          <strong>tým Poznej & Hraj</strong>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Poznej & Hraj" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `🔔 Potvrzení rezervace – ${eventTitle}`,
      html,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Email error:", err);
    return res.status(500).json({ error: "Email failed", details: err });
  }
}
