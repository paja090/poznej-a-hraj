import nodemailer from "nodemailer";
import QRCode from "qrcode";
import admin from "firebase-admin";
import fs from "fs";

// === Firebase Admin ===
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT není definováno.");
  } else {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
const db = admin.apps.length ? admin.firestore() : null;

// === Gmail SMTP ===
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || "poznejahraj@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// === Načtení rezervace z Firestore ===
async function loadReservation(reservationId) {
  if (!db) return null;
  const snap = await db.collection("reservations").doc(reservationId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// === HTML EMAIL ===
function generateHtml({
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
  const paid = ["paid", "succeeded", "zaplaceno"].includes(
    String(paymentStatus || "").toLowerCase()
  );

  const count = peopleCount || 1;

  return `
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <title>Digitální vstupenka – Poznej & Hraj</title>
  </head>

  <body style="margin:0;padding:0;background:#050816;font-family:-apple-system,Roboto,sans-serif;color:#fff;">
    <table width="100%" style="padding:24px 0;background:radial-gradient(circle at top left,#8b5cf6 0,#050816 55%);">

      <tr><td align="center">

        <table width="600" style="background:#0b1020;border-radius:24px;border:1px solid rgba(255,255,255,0.12);overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="padding:22px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">

              <table width="100%">
                <tr>
                  <td>
                    <img src="cid:rebuslogo" alt="Reboos Logo" style="height:48px;margin-bottom:12px" />
                    <div style="font-size:18px;font-weight:600;color:#f9fafb;">
                      Tvůj QR kód je připraven ✨
                    </div>
                    <div style="font-size:13px;color:#cbd5e1;margin-top:4px;">
                      Stačí ukázat u vstupu.
                    </div>
                  </td>
                  <td align="right">
                    <div style="width:48px;height:48px;border-radius:14px;background:radial-gradient(circle at 30% 0%,#ec4899,transparent 60%),radial-gradient(circle at 70% 120%,#8b5cf6,transparent 60%);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:#050816;">
                      PH
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- QR KÓD -->
          <tr><td style="padding:24px 24px 0 24px;">
            <table width="100%">
              <tr>

                <!-- QR -->
                <td width="46%" align="center">
                  <div style="background:rgba(255,255,255,0.08);padding:16px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);">
                    <div style="font-size:12px;color:#cbd5e1;text-transform:uppercase;margin-bottom:8px;">QR kód</div>

                    <div style="background:#fff;border-radius:16px;padding:10px;">
                      <img src="cid:qrimage" width="210" height="210" style="display:block;border-radius:12px;" />
                    </div>

                    <div style="margin-top:8px;font-size:11px;color:#94a3b8;">
                      Ukaž u vstupu, mobil stačí.
                    </div>
                  </div>
                </td>

                <!-- INFO -->
                <td width="54%" style="padding-left:12px;">
                  
                  <div style="background:#111827;border-radius:20px;padding:18px;border:1px solid rgba(148,163,184,0.35);">

                    <div style="font-size:13px;color:#cbd5e1;">Jméno</div>
                    <div style="font-size:16px;font-weight:600;margin-bottom:12px;">${name}</div>

                    <div style="font-size:13px;color:#cbd5e1;">Akce</div>
                    <div style="font-size:15px;font-weight:600;margin-bottom:12px;">${eventTitle}</div>

                    <div style="font-size:13px;color:#cbd5e1;">Datum & místo</div>
                    <div style="font-size:13px;color:#e5e7eb;line-height:1.5;margin-bottom:12px;">
                      📅 ${eventDate}<br/>
                      📍 ${eventPlace}
                    </div>

                    <div style="margin:12px 0;display:flex;gap:10px;flex-wrap:wrap;">

                      <span style="padding:6px 14px;border-radius:50px;background:#111827;border:1px solid #475569;color:#e2e8f0;font-size:13px;">
                        👥 ${count} osob
                      </span>

                      <span style="padding:6px 14px;border-radius:50px;background:${paid ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.2)"};border:1px solid ${
    paid ? "rgba(34,197,94,0.5)" : "rgba(234,179,8,0.5)"
  };font-size:13px;color:${paid ? "#bbf7d0" : "#fef3c7"};">
                        ${paid ? "✔️ Zaplaceno" : "🟡 Nezaplaceno"}
                      </span>

                      ${
                        price
                          ? `<span style="padding:6px 14px;border-radius:50px;background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.5);font-size:13px;color:#dbeafe;">
                              💳 ${price} Kč
                             </span>`
                          : ""
                      }

                    </div>

                    <div style="font-size:11px;color:#94a3b8;margin-bottom:12px;">
                      ID rezervace: <span style="color:#e5e7eb;font-family:monospace">${reservationId}</span>
                    </div>

                    <a href="${ticketUrl}" style="font-size:13px;color:#22c55e;text-decoration:none;">
                      📄 Otevřít tisknutelnou verzi vstupenky
                    </a>

                  </div>
                </td>

              </tr>
            </table>
          </td></tr>

          <!-- PODMÍNKY -->
          <tr><td style="padding:24px;">
            <div style="background:#111827;border-radius:20px;padding:16px;border:1px solid rgba(148,163,184,0.4);">
              <div style="font-size:13px;font-weight:600;margin-bottom:6px;">🛡️ Bezpečnostní a organizační podmínky</div>
              
              <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.6;color:#d1d5db;">
                <li>Vstupenka může být přenosná, ale <strong>nesmí být duplicitně použitá</strong>.</li>
                <li>QR kód je jednorázový – opakované použití způsobí jeho zneplatnění.</li>
                <li>Na místě se řiď pokyny organizátorů.</li>
                <li>Za osobní věci mimo vyhrazené prostory neručíme.</li>
                <li>Účast je na vlastní odpovědnost.</li>
              </ul>

              <div style="margin-top:10px;font-size:11px;color:#94a3b8;">
                GDPR: Vaše údaje používáme pouze pro vystavení vstupenky a správu rezervace.
              </div>
            </div>

            <div style="text-align:center;margin-top:12px;font-size:11px;color:#94a3b8;">
              Pokud něco nesedí, napište nám na 
              <a href="mailto:poznejahraj@gmail.com" style="color:#a855f7;">poznejahraj@gmail.com</a>.
            </div>

          </td></tr>

          <!-- FOOTER -->
          <tr><td style="padding:16px;text-align:center;font-size:11px;color:#94a3b8;">
            © ${new Date().getFullYear()} Poznej & Hraj
          </td></tr>

        </table>

      </td></tr>
    </table>
  </body>
</html>
`;
}

//
// === API HANDLER ===
//
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      reservationId,
      eventDate,
      eventPlace,
      eventTitle,
      override,
      price,
      paymentStatus,
    } = req.body;

    if (!reservationId) {
      return res.status(400).json({ error: "Missing reservationId" });
    }

    let reservation = override || (await loadReservation(reservationId));

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const { name, email, peopleCount } = reservation;
    if (!email) {
      return res.status(400).json({ error: "Email missing" });
    }

    // URL vstupenky
    const base =
      process.env.PUBLIC_TICKET_BASE_URL ||
      process.env.DOMAIN ||
      "https://poznej-a-hraj.vercel.app";

    const ticketUrl = `${base.replace(/\/$/, "")}/#/ticket?id=${reservationId}`;

    // QR kód dataURL
    const qrDataUrl = await QRCode.toDataURL(ticketUrl, { width: 400 });

    // HTML
    const html = generateHtml({
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
    });

    // Cesty
    const logoPath = `${process.cwd()}/public/rebuss.png`;

    // Odeslání emailu
    await transporter.sendMail({
      from: `"Poznej & Hraj" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Tvoje vstupenka – ${eventTitle}`,
      html,
      attachments: [
        {
          filename: "rebuss.png",
          path: logoPath,
          cid: "rebuslogo",
        },
        {
          filename: "qr.png",
          content: qrDataUrl.split("base64,")[1],
          encoding: "base64",
          cid: "qrimage",
        },
      ],
    });

    return res.status(200).json({ ok: true, sentTo: email, ticketUrl });
  } catch (err) {
    console.error("send-ticket ERROR:", err);
    return res.status(500).json({ error: "Chyba při odesílání vstupenky." });
  }
}






