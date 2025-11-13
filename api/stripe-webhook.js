import Stripe from "stripe";
import { adminDb } from "./firebaseAdmin.js";


// Vypneme defaultní body parsing – Stripe potřebuje raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Pomocná funkce na získání raw body
function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // <- ZDE MUSÍ BÝT SECRET Z STRIPE
    );

  } catch (err) {
    console.error("❌ Invalid signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🟢 Úspěšná platba — označíme rezervaci jako "paid"
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const reservationId = session.metadata.reservationId;

    if (reservationId) {
      try {
        await adminDb.collection("reservations").doc(reservationId).update({
          paymentStatus: "paid",
        });

        console.log("🔥 Rezervace označena jako paid:", reservationId);

      } catch (error) {
        console.error("❌ Firestore update failed:", error);
      }
    }
  }

  res.status(200).send("OK");
}

