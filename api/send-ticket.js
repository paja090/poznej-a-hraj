import nodemailer from "nodemailer";
import QRCode from "qrcode";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name, eventTitle, reservationId, peopleCount } = req.body;

  try {
    // 🔵 QR CODE generation (text encoded = reservation ID)
    const qrData = await QRCode.toDataURL(
      `reservation:${reservationId};name:${name};event:${eventTitle}`
    );

    // 🔵 Nodemailer setup (Gmail + App Password)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🔵 HTML email with QR code embedded
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color:#9333ea;">🎟️ Tvoje vstupenka – ${eventTitle}</h2>
        
        <p>Ahoj <strong>${name}</strong>!</p>
        <p>Děkujeme za rezervaci. Tady máš svou vstupenku:</p>

        <div style="margin: 20px 0; padding: 20px; border:1px solid #eee; border-radius:10px;">
          <p><strong>Událost:</strong> ${eventTitle}</p>
          <p><strong>Jméno:</strong> ${name}</p>
          <p><strong>Počet osob:</strong> ${peopleCount}</p>
          <p><strong>ID rezervace:</strong> ${reservationId}</p>

          <h3 style="margin-top:25px;">QR vstupenka:</h3>
          <img src="${qrData}" alt="QR code" style="width:200px; height:200px;" />
        </div>

        <p>Těšíme se na tebe! ❤️</p>
        <p style="font-size:12px; color:#999;">Poznej & Hraj – zážitkové večery a hry</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `🎟️ Vstupenka – ${eventTitle}`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
