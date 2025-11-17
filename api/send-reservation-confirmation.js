import nodemailer from "nodemailer";
import { getVocative } from "../utils/vocative.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name, email, eventTitle, peopleCount, reservationId } = req.body;

    if (!email || !name || !eventTitle) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Vocativ jména
    const nameVocative = getVocative(name);

    // SMTP odesílač
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:#0f172a;">
        <p>Ahoj ${nameVocative},</p>
        
        <p>tvoje rezervace na akci <strong>${eventTitle}</strong> byla úspěšně vytvořena.</p>

        <p>Kapacitu držíme <strong>30 minut</strong>. Pokud ji nezaplatíš včas, uvolní se pro další zájemce.</p>

        <p>Počet osob: <strong>${peopleCount}</strong></p>

        <p>ID rezervace: <strong>${reservationId}</strong></p>

        <p style="margin-top:20px;">Těšíme se na společný večer! 🌟</p>

        <p style="margin-top:10px;font-size:12px;color:#6b7280;">
          Poznej & Hraj
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Poznej & Hraj" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Potvrzení rezervace – ${eventTitle}`,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Send reservation email error:", err);
    return res.status(500).json({ error: "Email sending failed" });
  }
}
