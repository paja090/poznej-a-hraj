// /api/send-ticket.js
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import admin from 'firebase-admin';

// === Firebase Admin inicializace (server) ===
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('⚠️ Chybí FIREBASE_SERVICE_ACCOUNT – načtení rezervace z Firestore nebude fungovat.');
  } else {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
const db = admin.apps.length ? admin.firestore() : null;

// === Nodemailer – Gmail SMTP ===
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,         // můžeš změnit na 587 + secure: false
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || 'poznejahraj@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// === Helper: načtení rezervace z Firestore, pokud je potřeba ===
async function loadReservationFromFirestore(reservationId) {
  if (!db) return null;
  const snap = await db.collection('reservations').doc(reservationId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// === Helper: generování HTML e-mailu ===
function generateTicketEmailHtml({
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
  const isPaid =
    ['paid', 'succeeded', 'zaplaceno', 'paid_out'].includes(
      String(paymentStatus || '').toLowerCase(),
    );

  const safePeople = peopleCount || 1;

  return `<!doctype html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <title>Vstupenka – Poznej &amp; Hraj</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#050816;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:radial-gradient(circle at top left,#8b5cf6 0,#050816 55%);padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(145deg,#050816,#0b1020);border-radius:24px;border:1px solid rgba(255,255,255,0.12);overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,0.65);">
            <!-- Header -->
            <tr>
              <td style="padding:24px 28px 16px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="display:inline-block;padding:10px 16px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);font-size:14px;font-weight:800;color:#050816;text-transform:uppercase;letter-spacing:0.12em;">
                        Poznej &amp; Hraj
                      </div>
                      <div style="margin-top:10px;font-size:18px;font-weight:600;color:#f9fafb;">
                        Tvoje digitální vstupenka je připravena ✨
                      </div>
                      <div style="margin-top:4px;font-size:13px;color:rgba(249,250,251,0.7);">
                        Stačí ukázat QR kód u vstupu na akci.
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <div style="width:40px;height:40px;border-radius:14px;background:radial-gradient(circle at 30% 0%,#ec4899,transparent 60%),radial-gradient(circle at 70% 120%,#8b5cf6,transparent 60%);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:#050816;">
                        PH
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- QR + info -->
            <tr>
              <td style="padding:24px 20px 8px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <!-- QR -->
                    <td width="46%" align="center" style="padding:12px;">
                      <div style="background:radial-gradient(circle at top,#8b5cf6 0,transparent 60%);border-radius:24px;padding:16px;border:1px solid rgba(255,255,255,0.12);">
                        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(249,250,251,0.65);margin-bottom:8px;">
                          QR vstupenka
                        </div>
                        <div style="background:#fff;border-radius:18px;padding:10px;display:inline-block;">
                          <img src="${qrDataUrl}" alt="QR kód vstupenky" width="210" height="210" style="display:block;border-radius:12px;" />
                        </div>
                        <div style="margin-top:10px;font-size:11px;color:rgba(249,250,251,0.7);">
                          U vstupu prosím ukaž tento QR kód na mobilu nebo vytištěný.
                        </div>
                      </div>
                    </td>

                    <!-- Textové info -->
                    <td width="54%" style="padding:12px;">
                      <div style="background:rgba(15,23,42,0.9);border-radius:24px;padding:18px 18px;border:1px solid rgba(148,163,184,0.35);">
                        <div style="font-size:13px;color:rgba(148,163,184,0.9);margin-bottom:4px;">
                          Jméno účastníka
                        </div>
                        <div style="font-size:16px;font-weight:600;color:#f9fafb;margin-bottom:12px;">
                          ${name || 'Host Poznej & Hraj'}
                        </div>

                        <div style="font-size:13px;color:rgba(148,163,184,0.9);margin-bottom:4px;">
                          Název akce
                        </div>
                        <div style="font-size:15px;font-weight:600;color:#e5e7eb;margin-bottom:12px;">
                          ${eventTitle || 'Poznej & Hraj večer'}
                        </div>

                        <div style="font-size:13px;color:rgba(148,163,184,0.9);margin-bottom:4px;">
                          Datum &amp; místo
                        </div>
                        <div style="font-size:13px;color:#e5e7eb;margin-bottom:12px;line-height:1.5;">
                          📅 ${eventDate || 'bude upřesněno'}<br/>
                          📍 ${eventPlace || 'bude upřesněno'}
                        </div>

                        <div style="display:flex;flex-wrap:wrap;gap:8px 12px;margin-bottom:10px;">
                          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.55);color:#e5e7eb;">
                            👥 <strong style="font-weight:600;">${safePeople} os.</strong>
                          </span>
                          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:6px 10px;border-radius:999px;background:rgba(22,163,74,0.08);border:1px solid rgba(34,197,94,0.45);color:#bbf7d0;">
                            ${isPaid ? '✅ Zaplaceno' : '🟡 Čeká na platbu'}
                          </span>
                          ${
                            price
                              ? `<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:6px 10px;border-radius:999px;background:rgba(37,99,235,0.1);border:1px solid rgba(59,130,246,0.55);color:#bfdbfe;">
                            💳 ${price} Kč
                          </span>`
                              : ''
                          }
                        </div>

                        <div style="margin-top:6px;font-size:11px;color:rgba(148,163,184,0.9);">
                          ID rezervace: <span style="font-family:SFMono-Regular,Menlo,monospace;color:#e5e7eb;">${reservationId}</span>
                        </div>

                        <a href="${ticketUrl}" style="margin-top:14px;display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#22c55e;text-decoration:none;">
                          📲 Otevřít vstupenku v prohlížeči
                        </a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Podmínky -->
            <tr>
              <td style="padding:8px 24px 24px 24px;">
                <div style="border-radius:20px;background:rgba(15,23,42,0.9);padding:16px 18px;border:1px solid rgba(148,163,184,0.4);">
                  <div style="font-size:13px;font-weight:600;color:#f9fafb;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                    🛡️ Bezpečnostní a organizační podmínky
                  </div>
                  <ul style="padding-left:18px;margin:0;font-size:12px;color:rgba(209,213,219,0.9);line-height:1.6;">
                    <li>Vstupenka je <strong>nepřenosná</strong> a je vázaná na jméno účastníka.</li>
                    <li>QR kód je <strong>jednorázový</strong> a platný pouze pro tuto akci a termín.</li>
                    <li>Pokus o kopírování nebo opakované použití QR kódu může vést ke <strong>zneplatnění vstupenky</strong>.</li>
                    <li>Na místě se prosím řiďte <strong>pokyny organizátorů</strong> a personálu.</li>
                    <li>Organizátor nenese odpovědnost za věci odložené mimo vyhrazené prostory a akce se účastníte na vlastní odpovědnost.</li>
                    <li>Vstupenku ani přístupový odkaz <strong>nesdílejte třetím osobám</strong>, které nejsou účastníky akce.</li>
                  </ul>
                  <div style="margin-top:10px;font-size:11px;color:rgba(148,163,184,0.9);line-height:1.5;">
                    <strong>GDPR:</strong> Pro vystavení vstupenky zpracováváme pouze nezbytné kontaktní údaje (jméno, e-mail, údaje o rezervaci).
                    Platební údaje <strong>nezpracováváme ani neukládáme</strong> – platba probíhá bezpečně přes Stripe.
                  </div>
                </div>
                <div style="font-size:11px;color:rgba(148,163,184,0.7);margin-top:10px;text-align:center;">
                  Pokud něco nesedí, napiš nám prosím na
                  <a href="mailto:poznejahraj@seznam.cz" style="color:#a855f7;text-decoration:none;"> poznejahraj@seznam.cz</a>.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:10px 24px 18px 24px;text-align:center;font-size:11px;color:rgba(148,163,184,0.7);">
                © ${new Date().getFullYear()} Poznej &amp; Hraj – těšíme se na tebe!
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// === Helper: HTML šablona samostatné stránky vstupenky ===
// Tu můžeš použít v route /ticket (SSR) nebo ji vyexportovat jako .html soubor.
export function generateTicketPageHtml({
  name,
  eventTitle,
  eventDate,
  eventTime,
  eventPlace,
  peopleCount,
  reservationId,
  qrDataUrl,
}) {
  const safePeople = peopleCount || 1;
  return `<!doctype html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <title>Vstupenka – ${eventTitle || 'Poznej &amp; Hraj'}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        background:
          radial-gradient(circle at 0% 0%, rgba(139,92,246,0.45), transparent 55%),
          radial-gradient(circle at 100% 0%, rgba(236,72,153,0.35), transparent 55%),
          #050816;
        color: #f9fafb;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        max-width: 420px;
        width: 100%;
        background: linear-gradient(145deg,#020617,#020617,#0b1220);
        border-radius: 28px;
        border: 1px solid rgba(148,163,184,0.35);
        box-shadow: 0 24px 80px rgba(15,23,42,0.85);
        padding: 22px 22px 18px;
      }
      .header-chip {
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:6px 12px;
        border-radius:999px;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.16em;
        background:rgba(15,23,42,0.9);
        border:1px solid rgba(148,163,184,0.6);
        color:rgba(209,213,219,0.9);
      }
      .logo {
        width:40px;
        height:40px;
        border-radius:16px;
        background:
          radial-gradient(circle at 20% 0%, #ec4899, transparent 55%),
          radial-gradient(circle at 80% 130%, #8b5cf6, transparent 55%);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:18px;
        font-weight:800;
        color:#020617;
      }
      .title {
        font-size:22px;
        font-weight:700;
        margin:10px 0 2px;
      }
      .subtitle {
        font-size:13px;
        color:rgba(148,163,184,0.9);
      }
      .qr-wrap {
        margin-top:18px;
        padding:16px;
        border-radius:22px;
        border:1px dashed rgba(148,163,184,0.4);
        background:radial-gradient(circle at top,#4c1d95 0,transparent 60%);
        text-align:center;
      }
      .qr-inner {
        display:inline-block;
        background:#fff;
        padding:10px;
        border-radius:20px;
      }
      .info {
        margin-top:18px;
        padding:14px 14px 10px;
        border-radius:20px;
        background:rgba(15,23,42,0.95);
        border:1px solid rgba(148,163,184,0.5);
        font-size:13px;
      }
      .info-row + .info-row { margin-top:8px; }
      .label { font-size:12px; color:rgba(148,163,184,0.9); }
      .value { font-size:14px; color:#e5e7eb; font-weight:500; }
      .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .chip {
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:5px 10px;
        border-radius:999px;
        font-size:11px;
        background:rgba(15,23,42,0.9);
        border:1px solid rgba(148,163,184,0.55);
        color:#e5e7eb;
      }
      .chip.main {
        background:rgba(22,163,74,0.16);
        border-color:rgba(34,197,94,0.7);
        color:#bbf7d0;
      }
      .ticket-id {
        margin-top:8px;
        font-size:11px;
        color:rgba(148,163,184,0.9);
        font-family:SFMono-Regular,Menlo,monospace;
      }
      .actions {
        margin-top:18px;
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }
      .btn {
        flex:1 1 auto;
        padding:10px 12px;
        border-radius:999px;
        border:none;
        font-size:13px;
        font-weight:600;
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:6px;
      }
      .btn-primary {
        background:linear-gradient(to right,#8b5cf6,#ec4899);
        color:#020617;
      }
      .btn-ghost {
        background:rgba(15,23,42,0.9);
        color:#e5e7eb;
        border:1px solid rgba(148,163,184,0.6);
      }
      .terms {
        margin-top:14px;
        padding-top:10px;
        border-top:1px solid rgba(31,41,55,0.9);
        font-size:11px;
        color:rgba(156,163,175,0.9);
      }
      .terms ul {
        padding-left:18px;
        margin:6px 0 0;
      }
      .terms li {
        margin-bottom:4px;
      }
      @media print {
        body { background:#fff; padding:0; }
        .card { box-shadow:none; border-radius:0; max-width:none; }
        .actions { display:none; }
      }
    </style>
  </head>
  <body>
    <main class="card">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div class="header-chip">Poznej &amp; Hraj · vstupenka</div>
          <h1 class="title">${eventTitle || 'Poznej &amp; Hraj'}</h1>
          <p class="subtitle">Digitální vstupenka – stačí ukázat QR kód u vstupu.</p>
        </div>
        <div class="logo">PH</div>
      </header>

      <section class="qr-wrap">
        <div class="qr-inner">
          <img src="${qrDataUrl}" alt="QR kód vstupenky" width="220" height="220" />
        </div>
        <div style="margin-top:8px;font-size:11px;color:rgba(209,213,219,0.9);">
          Pokud se QR kód špatně načítá, zkus zvýšit jas displeje nebo si vstupenku vytiskni.
        </div>
      </section>

      <section class="info">
        <div class="info-row">
          <div class="label">Jméno účastníka</div>
          <div class="value">${name || 'Host Poznej & Hraj'}</div>
        </div>
        <div class="info-row">
          <div class="label">Datum &amp; čas</div>
          <div class="value">📅 ${eventDate || 'bude upřesněno'}${eventTime ? ' · ⏰ ' + eventTime : ''}</div>
        </div>
        <div class="info-row">
          <div class="label">Místo konání</div>
          <div class="value">📍 ${eventPlace || 'bude upřesněno'}</div>
        </div>
        <div class="chips">
          <span class="chip">👥 ${safePeople} osob</span>
          <span class="chip main">✅ Zaplaceno</span>
        </div>
        <div class="ticket-id">ID rezervace: ${reservationId}</div>
      </section>

      <section class="actions">
        <button class="btn btn-primary" onclick="window.print()">
          📄 Uložit jako PDF / vytisknout
        </button>
        <button class="btn btn-ghost" onclick="navigator.share ? navigator.share({ title: 'Poznej & Hraj – vstupenka', url: window.location.href }) : alert('Adresu stránky můžeš zkopírovat z adresního řádku.')">
          📲 Otevřít / sdílet v telefonu
        </button>
      </section>

      <section class="terms">
        <strong>Bezpečnostní a organizační podmínky:</strong>
        <ul>
          <li>Vstupenka je <strong>nepřenosná</strong> a je vázaná na konkrétního účastníka.</li>
          <li>QR kód je <strong>jednorázový</strong> a platný pouze pro tuto akci a termín.</li>
          <li>Pokus o kopírování nebo vícenásobné použití může vést ke <strong>zneplatnění vstupenky</strong>.</li>
          <li>Na místě se prosím řiď pokyny organizátorů a personálu. Účast na akci je na vlastní odpovědnost.</li>
          <li>Nepředávej vstupenku ani odkaz na tuto stránku třetím osobám, které nejsou účastníky akce.</li>
          <li><strong>GDPR:</strong> zpracováváme pouze nezbytné kontaktní údaje pro rezervaci. Platební údaje nezpracováváme – platbu zajišťuje Stripe.</li>
        </ul>
      </section>
    </main>

    <script>
      // Pokud bys chtěl později doplnit dynamické načítání údajů podle ?id=...
      // můžeš tady doplnit fetch na API /ticket-data?id=XYZ a přepsat obsah.
    </script>
  </body>
</html>`;
}

// === Hlavní handler: POST /api/send-ticket ===
// Body: { reservationId, eventDate, eventTime, eventPlace, price, paymentStatus, overrideData? }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      reservationId,
      eventDate,
      eventTime,
      eventPlace,
      price,
      paymentStatus,
      override, // volitelné: { name, email, peopleCount, eventTitle, ... } z webhooks
    } = req.body || {};

    if (!reservationId) {
      return res.status(400).json({ error: 'Chybí reservationId.' });
    }

    // 1) Zkus načíst z Firestore (pokud není override)
    let reservation = null;
    if (!override) {
      reservation = await loadReservationFromFirestore(reservationId);
    } else {
      reservation = { ...override, id: reservationId };
    }

    if (!reservation) {
      return res
        .status(404)
        .json({ error: 'Rezervace nenalezena ve Firestore, zkontroluj reservationId.' });
    }

    const {
      name,
      email,
      peopleCount,
      eventTitle,
    } = reservation;

    if (!email) {
      return res.status(400).json({ error: 'Rezervace nemá e-mail účastníka.' });
    }

    const rawBase =
  process.env.PUBLIC_TICKET_BASE_URL || 'https://poznejahraj.cz';
const normalizedBase = rawBase.endsWith('/')
  ? rawBase.slice(0, -1)
  : rawBase;

const ticketUrl = `${normalizedBase}/ticket?id=${encodeURIComponent(reservationId)}`;

    // 2) Vygeneruj QR kód (data URL, base64)
    const qrDataUrl = await QRCode.toDataURL(ticketUrl, {
      margin: 1,
      width: 400,
    });

    // 3) HTML mail + (volitelně) HTML vstupenky
    const html = generateTicketEmailHtml({
      name,
      eventTitle,
      eventDate: eventDate || reservation.eventDate,
      eventPlace: eventPlace || reservation.eventPlace,
      peopleCount,
      reservationId,
      price: price || reservation.price,
      paymentStatus: paymentStatus || reservation.paymentStatus,
      qrDataUrl,
      ticketUrl,
    });

   // 4) Odeslání e-mailu
await transporter.sendMail({
  from: `"Poznej & Hraj" <${process.env.GMAIL_USER || 'poznejahraj@gmail.com'}>`,
  to: email,
  subject: `Tvá vstupenka – ${eventTitle || 'Poznej & Hraj'}`,

  html: html.replace(
    // nahradí inline QR tag v HTML za CID verzi
    /<img src="[^"]*" alt="QR kód vstupenky"/,
    '<img src="cid:qrimage" alt="QR kód vstupenky"'
  ),

  attachments: [
    {
      filename: "qr.png",
      content: qrDataUrl.split("base64,")[1],
      encoding: "base64",
      cid: "qrimage", // stejné CID jako v HTML
    },
  ],
});

    return res.status(200).json({ ok: true, sentTo: email, ticketUrl });
  } catch (err) {
    console.error('❌ send-ticket error:', err);
    return res.status(500).json({ error: 'Nepodařilo se odeslat vstupenku.' });
  }
}

