import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { reservationId, eventTitle, price, peopleCount, email } = req.body;

  if (!eventTitle || !price || !peopleCount || !email) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "czk",
            product_data: { name: eventTitle },
            unit_amount: Number(price) * 100,
          },
          quantity: Number(peopleCount),
        },
      ],
      metadata: {
        reservationId,
        eventTitle,
      },
      success_url: `${process.env.DOMAIN}/?stripe_success=1`,
      cancel_url: `${process.env.DOMAIN}/?stripe_cancel=1`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Stripe error" });
  }
}
