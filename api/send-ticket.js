// /api/send-ticket.js
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import admin from "firebase-admin";

// === Firebase Admin inicializace (server) ===
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn("⚠️ Chybí FIREBASE_SERVICE_ACCOUNT – načtení rezervace z Firestore nebude fungovat.");
  } else {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
const db = admin.apps.length ? admin.firestore() : null;

// === Nodemailer SMTP ===
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || "poznejahraj@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// === Načtení rezervace ===
async function loadReservation(reservationId) {
  if (!db) return null;
  const snap = await db.collection("reservations").doc(reservationId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// === HTML vstupenky ===
function generateTicketHtml({
  name,
  eventTitle,
  eventDate,
  eventPlace,
  peopleCount,
  reservationId,
  price,
  paymentStatus,
  qrDataUrl,
  ticketUrl,
}) {
  const isPaid = ["paid", "succeeded", "zaplaceno", "paid_out"].includes(
    String(paymentStatus || "").toLowerCase()
  );

  const safePeople = peopleCount || 1;

  return `
<!doctype html>
<html lang="cs">
<head>
<meta charset="UTF-8"/>
<title>Vstupenka – Poznej & Hraj</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>

<body style="margin:0;padding:0;background:#050816;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:24px 0;background:radial-gradient(circle at top left,#8b5cf6 0,#050816 60%);">
<tr><td align="center">

<table width="600" style="max-width:600px;width:100%;background:#0b1020;border-radius:24px;border:1px solid rgba(255,255,255,0.12);overflow:hidden;">

<!-- HEADER -->
<tr><td style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">

  <table width="100%">
    <tr>

      <!-- Logo -->
      <td style="vertical-align:middle;">
        <img src="cid:rebuslogo" alt="Rebus Logo" 
          style="height:48px;object-fit:contain;display:block;margin-bottom:8px;">
        <div style="font-size:18px;font-weight:600;color:#fafafa;margin-top:6px;">
          Tvoje digitální vstupenka je připravena ✨
        </div>
        <div style="font-size:13px;color:rgba(249,250,251,0.65);">
          Stačí ukázat QR kód u vstupu na akci.
        </div>
      </td>

      <td align="right" style="vertical-align:middle;">
        <div style="
          width:50px;height:50px;border-radius:14px;
          background:radial-gradient(circle at 30% 0%,#ec4899,transparent 60%),
                      radial-gradient(circle at 70% 120%,#8b5cf6,transparent 60%);
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:18px;color:#050816;">
          PH
        </div>
      </td>

    </tr>
  </table>

</td></tr>

<!-- QR + INFO -->
<tr><td style="padding:24px">

  <table width="100%">
    <tr>

      <!-- QR KÓD -->
      <td width="45%" align="center">
        <div style="padding:16px;border:1px solid rgba(255,255,255,0.12);border-radius:22px;">
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:8px;">
            QR vstupenka
          </div>
          <div style="background:#fff;border-radius:12px;padding:10px;">
            <img src="cid:qrimage" width="210" height="210" style="display:block;">
          </div>
        </div>
      </td>

      <!-- TEXTY -->
      <td width="55%" style="padding-left:20px;">
        <div style="background:#101827;border-radius:20px;padding:18px;border:1px solid rgba(148,163,184,0.35);">

          <div style="font-size:13px;color:#9ca3af;">Jméno účastníka</div>
          <div style="font-size:16px;font-weight:600;color:#f9fafb;margin-bottom:10px;">
            ${name || "Host Poznej & Hraj"}
          </div>

          <div style="font-size:13px;color:#9ca3af;">Název akce</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:10px;">
            ${eventTitle}
          </div>

          <div style="font-size:13px;color:#9ca3af;">Datum & místo</div>
          <div style="font-size:13px;margin-bottom:12px;">
            📅 ${eventDate}<br>
            📍 ${eventPlace}
          </div>

          <!-- Ikonky -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <span style="padding:6px 12px;border-radius:40px;background:#1e293b;color:#e5e7eb;">
              👥 ${safePeople} osob
            </span>

            <span style="padding:6px 12px;border-radius:40px;
              background:${isPaid ? "#064e3b" : "#7c2d12"};
              color:${isPaid ? "#bbf7d0" : "#fdba74"};">
              ${isPaid ? "✔️ Zaplaceno" : "🟡 Nezaplaceno"}
            </span>

            ${
              price
                ? `<span style="padding:6px 12px;border-radius:40px;background:#1e3a8a;color:#bfdbfe;">
                    💳 ${price} Kč
                   </span>`
                : ""
            }
          </div>

          <div style="font-size:11px;color:#9ca3af;">ID rezervace: ${reservationId}</div>

          <!-- Odkaz na tiskovou verzi -->
          <a href="${ticketUrl}&print=1"
            style="margin-top:14px;display:inline-block;color:#22c55e;text-decoration:none;font-size:13px;">
            📄 Otevřít vstupenku (verze pro tisk)
          </a>

        </div>
      </td>

    </tr>
  </table>

</td></tr>

<!-- PODMÍNKY -->
<tr><td style="padding:24px">

  <div style="background:#101827;padding:16px;border-radius:18px;border:1px solid rgba(148,163,184,0.4);">
    <div style="font-size:13px;font-weight:600;">🛡️ Bezpečnostní & organizační podmínky</div>
    <ul style="font-size:12px;line-height:1.6;margin:10px 0 0 18px;color:#d1d5db;">
      <li>Vstupenka může být <strong>předána jiné osobě</strong>, pokud nebyla naskenována.</li>
      <li>QR kód je <strong>jednorázový</strong>; jakákoli kopie nebo duplikát bude označen jako NEPLATNÝ.</li>
      <li>Organizátor nenese odpovědnost za ztrátu nebo zneužití QR kódu.</li>
      <li>Řiďte se pokyny organizátorů a personálu.</li>
    </ul>

    <p style="margin-top:10px;font-size:11px;color:#9ca3af;">
      <strong>GDPR:</strong> Zpracováváme pouze nezbytné údaje pro vystavení vstupenky.
      Platební údaje neukládáme.
    </p>

    <p style="margin-top:10px;font-size:11px;color:#9ca3af;text-align:center;">
      Máš otázky? Napiš nám: 
      <a href="mailto:poznejahraj@gmail.com" style="color:#a855f7;text-decoration:none;">
        poznejahraj@gmail.com
      </a>
    </p>
  </div>

  <p style="text-align:center;font-size:11px;color:#6b7280;margin-top:10px;">
    © ${new Date().getFullYear()} Poznej & Hraj
  </p>

</td></tr>

</table>

</td></tr>
</table>

</body>
</html>
`;
}

// === API handler ===
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      reservationId,
      eventDate,
      eventPlace,
      price,
      paymentStatus,
      override,
    } = req.body || {};

    if (!reservationId) {
      return res.status(400).json({ error: "Missing reservationId" });
    }

    let reservation = override || (await loadReservation(reservationId));
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const { name, email, peopleCount, eventTitle } = reservation;

    if (!email) {
      return res.status(400).json({ error: "Reservation has no email" });
    }

    // === URL vstupenky ===
    const BASE =
      process.env.PUBLIC_TICKET_BASE_URL ||
      process.env.DOMAIN ||
      "https://poznej-a-hraj.vercel.app";

    const base = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;

    const ticketUrl = `${base}/#/ticket?id=${encodeURIComponent(
      r




