import admin from "firebase-admin";
import nodemailer from "nodemailer";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Gmail SMTP
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
  try {
    const now = Date.now();

    const q = await db
      .collection("reservations")
      .where("paymentStatus", "==", "unpaid")
      .where("blocked", "==", true)
      .get();

    let cleaned = 0;

    for (const doc of q.docs) {
      const data = doc.data();

      if (!data.reservationExpiresAt) continue;

      if (data.reservationExpiresAt < now) {
        // Změna stavu rezervace
        await doc.ref.update({
          paymentStatus: "expired",
          blocked: false,
        });

        // Vrácení místa do eventu
        if (data.eventId) {
          const evRef = db.collection("events").doc(data.eventId);
          await evRef.update({
            available: admin.firestore.FieldValue.increment(1),
          });
        }

        // E-mail uživateli
        if (data.email) {
          await transporter.sendMail({
            from: `"Poznej & Hraj" <${process.env.GMAIL_USER}>`,
            to: data.email,
            subject: "Tvoje rezervace vypršela",
            text: `Ahoj ${data.name}, tvoje rezervace na akci "${data.eventTitle}" vypršela, protože nebyla dokončena platba v časovém limitu.

Tvé místo bylo uvolněno pro další zájemce.

Pokud chceš stále přijít, udělej prosím novou rezervaci.`,
          });
        }

        cleaned++;
      }
    }

    return res.status(200).json({ cleaned });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Cleanup error" });
  }
}
