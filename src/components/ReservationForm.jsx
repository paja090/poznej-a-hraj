import { useState } from "react";
import { db } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function ReservationForm({ event, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    ageRange: "",
    relationship: "",
    peopleCount: 1,
    message: "",
  });

  const [status, setStatus] = useState("idle");
  const [reservationData, setReservationData] = useState(null);

  // 🧩 univerzální změna formuláře
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🧾 odeslání dat do Formspree + Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      // 1️⃣ Odeslat do Formspree
      const formspreeResponse = await fetch("https://formspree.io/f/xovyawqv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventTitle: event.title,
        }),
      });

      if (!formspreeResponse.ok) throw new Error("Formspree error");

      // 2️⃣ Uložit do Firestore a získat ID rezervace
      const docRef = await addDoc(collection(db, "reservations"), {
        ...formData,
        eventTitle: event.title,
        peopleCount: Number(formData.peopleCount),
        price: event.price ?? null,
        paymentStatus: "pending", // výchozí stav
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Uložit rezervaci do stavu pro Stripe
      setReservationData({
        id: docRef.id,
        event,
        ...formData,
      });

      // 4️⃣ Úspěch
      setStatus("success");
    } catch (error) {
      console.error("❌ Chyba při odesílání rezervace:", error);
      setStatus("error");
    }
  };

  // 🔧 Stripe platba
  const handleStripePayment = async () => {
    if (!reservationData) return;

    try {
      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservationData.id,
          eventTitle: event.title,
          price: event.price,
          peopleCount: reservationData.peopleCount || 1,
          email: reservationData.email,
        }),
      });

      const data = await resp.json();
      if (data.url) window.location.href = data.url;
      else alert("Nepodařilo se otevřít platební bránu.");
    } catch (err) {
      console.error(err);
      alert("Chyba při přípravě platby.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white text-lg"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">
          Rezervace: {event.title}
        </h2>

        {/* 🟢 Úspěch – zobrazíme volitelné tlačítko Stripe */}
        {status === "success" && reservationData ? (
          <div className="text-center space-y-4">
            <p className="text-green-400 font-medium">
              ✅ Tvoje rezervace byla úspěšně odeslána!
            </p>

            {event.price ? (
              <button
                onClick={handleStripePayment}
                className="w-full bg-gradient-to-r from-fuchsia-400 to-pink-500 text-[#071022] py-2 rounded-lg font-semibold shadow-md hover:opacity-90 transition"
              >
                💳 Zaplatit online
              </button>
            ) : (
              <p className="text-white/70 text-sm">
                Tato akce nemá cenu – platba není potřeba.
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full bg-white/10 border border-white/30 py-2 rounded-lg font-medium text-white hover:bg-white/20 transition"
            >
              Zavřít
            </button>
          </div>
        ) : (
          /* 🔄 Formulář */
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="name"
              placeholder="Jméno a příjmení"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/50 focus:border-a2 focus:ring-1 focus:ring-a2 outline-none"
            />

            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/50 focus:border-a2 focus:ring-1 focus:ring-a2 outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="p-2 rounded-lg bg-white/10 border border-white/20"
              >
                <option value="">Pohlaví</option>
                <option value="Muž">Muž</option>
                <option value="Žena">Žena</option>
                <option value="Jiné">Jiné</option>
              </select>

              <select
                name="ageRange"
                value={formData.ageRange}
                onChange={handleChange}
                required
                className="p-2 rounded-lg bg-white/10 border border-white/20"
              >
                <option value="">Věk</option>
                <option value="18–25">18–25</option>
                <option value="26–35">26–35</option>
                <option value="36–45">36–45</option>
                <option value="46+">46+</option>
              </select>
            </div>

            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              required
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20"
            >
              <option value="">Vztahový stav</option>
              <option value="Single">Single</option>
              <option value="Zadaný/á">Zadaný/á</option>
              <option value="Jiné">Jiné</option>
            </select>

            <input
              type="number"
              name="peopleCount"
              min="1"
              value={formData.peopleCount}
              onChange={handleChange}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20"
              placeholder="Počet osob"
            />

            <textarea
              name="message"
              placeholder="Poznámka (volitelné)"
              value={formData.message}
              onChange={handleChange}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20"
              rows="3"
            />

            <button
              type="submit"
              disabled={status === "sending"}
              className={`w-full bg-gradient-to-r from-a1 to-a2 text-[#071022] py-2 rounded-lg font-semibold shadow-md hover:opacity-90 transition ${
                status === "sending" ? "opacity-60 cursor-wait" : ""
              }`}
            >
              {status === "sending" ? "Odesílám..." : "Odeslat rezervaci"}
            </button>

            {status === "error" && (
              <p className="text-red-400 text-sm text-center mt-2">
                ❌ Nastala chyba při odesílání. Zkus to prosím znovu.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

