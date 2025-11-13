import Stripe from "stripe";
import { db } from "../../firebaseConfig.js";
import { doc, updateDoc } from "firebase/firestore";

// Disable body parsing so we can read raw body for signature check
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Métoda není povolena");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🟢 Úspěšná platba – označit rezervaci jako "paid"
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const reservationId = session.metadata.reservationId;

    if (reservationId) {
      try {
        await updateDoc(doc(db, "reservations", reservationId), {
          paymentStatus: "paid",
        });
        console.log("🔥 Rezervace označena jako paid:", reservationId);
      } catch (error) {
        console.error("❌ Firestore update error:", error);
      }
    }
  }

  res.status(200).send("OK");
}

// Helper – načte raw body
function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
