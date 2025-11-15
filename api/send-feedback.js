import nodemailer from "nodemailer";
import admin from "firebase-admin";

// === Inicializace Firebase Admin ===
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

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

// =====================================================
//  ČESKÝ VOKATIV – PROFI VERZE
// =====================================================
function getVocative(nameRaw) {
  if (!nameRaw) return "";
  let name = nameRaw.trim();

  // První písmeno velké
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const lower = name.toLowerCase();

  // === Výjimky ===
  const exceptions = {
    "pavel": "Pavle",
    "marek": "Marku",
    "honza": "Honzo",
    "jan": "Jane",
    "dan": "Dane",
    "roman": "Romane",
    "lukáš": "Lukáši",
    "michal": "Michale",
    "ondřej": "Ondřeji",
    "bořek": "Bořku",
    "václav": "Václave",
    "radek": "Radku",
    "vojtěch": "Vojtěchu",
    "matěj": "Matěji",
    "adam": "Adame",

    // ženy
    "lucie": "Lucie",
    "marie": "Marie",
    "tereza": "Terezo",
    "sofia": "Sofio",
    "soňa": "Soňo",
    "nikola": "Nikolo",
    "dominika": "Dominiko",
    "veronika": "Veroniko",
    "jana": "Jano",
    "hana": "Hano",
  };

  if (exceptions[lower]) return exceptions[lower];

  // ženská jména končící na -a
  if (lower.endsWith("a")) return name.slice(0, -1) + "o";

  // měkké zakončení -š → Tomáš → Tomáši
  if (lower.endsWith("š")) return name + "i";

  // -ek → Marek → Marku
  if (lower.endsWith("ek")) return name.slice(0, -2) + "ku";

  // -el → Daniel → Daniele
  if (lower.endsWith("el")) return name.slice(0, -2) + "le";

  // tvrdé souhlásky → Martin → Martine
  const hard = ["r", "n", "m", "s", "t", "d", "k", "h"];
  if (hard.some((c) => lower.endsWith(c))) return name + "e";

  return name;
}

// =====================================================
//  HANDLER – hlavní API endpoint
// =====================================================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "Chybí e-mail nebo zpráva." });
    }

    // === 1) Uložit do Firestore ===
    await db.collection("feedback").add({
      name: name || "",
      email,
      message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // === 2) Poslat e-mail tobě ===
    await transporter.sendMail({
      from: `"Poznej & Hraj" <${process.env.GMAIL_USER}>`,
      to: "poznejahraj@gmail.com",
      subject: "Nová zpráva z webu Poznej & Hraj",
      html: `
        <h2>Nová zpráva z kontaktního formuláře</h2>
        <p><strong>Jméno:</strong> ${name || "Neuvedeno"}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Zpráva:</strong><br/>${message}</p>
      `,
    });

    // === 3) Auto-reply zákazníkovi ===
    await transporter.sendMail({
      from: `"Poznej & Hraj" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "✨ Děkujeme za zprávu – ozveme se co nejdřív!",
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; padding: 24px; color: #fff;">
        <div style="max-width: 600px; margin: auto; background: #111827; border-radius: 20px; padding: 0; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
          
          <div style="background: #0d1220; padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <img src="https://poznej-a-hraj.vercel.app/rebuss.png" alt="Poznej & Hraj Logo" style="height: 70px; margin-bottom: 10px;" />
            <div style="font-size: 16px; color: #cbd5e1;">Děkujeme za tvoji zprávu ❤️</div>
          </div>

          <div style="padding: 28px;">
            <h2 style="font-size: 22px; font-weight: 700; color: #8b5cf6;">Ozveme se co nejdřív!</h2>

            <p style="font-size: 16px; line-height: 1.6; margin-top: 12px;">
              Ahoj ${getVocative(name)},<br/>
              děkujeme, že ses nám ozval(a). Tvoji zprávu jsme úspěšně přijali.
            </p>

            <p style="margin-top: 16px; font-size: 15px; color: #cbd5e1;">
              🎮 Jsme rádi, že jsi součástí komunity <strong>Poznej & Hraj</strong>.<br/>
              Těšíme se, až se společně uvidíme na některém z našich herních večerů.
            </p>

            <div style="margin-top: 20px; padding: 16px; border-radius: 14px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3);">
              Pokud budeš mít další otázky nebo doplnění, klidně nám napiš znovu. Jsme tu pro tebe. 💬
            </div>

            <p style="margin-top: 26px; opacity: 0.7; font-size: 14px;">
              S přátelským pozdravem,<br/><strong>Tým Poznej & Hraj</strong>
            </p>
          </div>

        </div>
      </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ send-feedback error:", err);
    return res.status(500).json({ error: "Odeslání se nezdařilo." });
  }
}

