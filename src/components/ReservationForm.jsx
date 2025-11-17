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
    gdpr: false,
    safety: false,
    age18plus: false,
  });

  const [status, setStatus] = useState("idle");
  const [reservationData, setReservationData] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // 🧾 Odeslání rezervace + uložením do Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    if (!formData.gdpr || !formData.safety || !formData.age18plus) {
      alert("Pro pokračování musíš potvrdit všechny tři souhlasy.");
      setStatus("idle");
      return;
    }

    try {
      // 🔥 Uložit přímo do Firestore
      const docRef = await addDoc(collection(db, "reservations"), {
        ...formData,
        peopleCount: Number(formData.peopleCount),
        eventTitle: event.title,
        eventId: event.id,
        price: event.price ?? null,
        paymentStatus: "pending",
        gdprConsent: formData.gdpr,
        safetyConsent: formData.safety,
        age18plus: formData.age18plus,
        createdAt: serverTimestamp(),
      });

      setReservationData({
        id: docRef.id,
        event,
        ...formData,
      });

      setStatus("success");
    } catch (error) {
      console.error("❌ Chyba:", error);
      setStatus("error");
    }
  };

  // 💳 Stripe session – vytvoření checkoutu
  const handleStripePayment = async () => {
    if (!reservationData) return;

    try {
      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservationData.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventPlace: event.place,
          price: event.price,
          peopleCount: reservationData.peopleCount || 1,
          email: reservationData.email,
          name: reservationData.name, // ⭐ KLÍČOVÉ
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.url) {
        alert("Nepodařilo se připravit platební bránu.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Stripe error:", err);
      alert("Chyba při přípravě platby.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">
          Rezervace: {event.title}
        </h2>

        {/* 🟢 ÚSPĚCH */}
        {status === "success" && reservationData ? (
          <div className="text-center space-y-4">
            <p className="text-green-400 font-medium">
              ✅ Rezervace byla úspěšně odeslána!
            </p>
            <p className="text-white/70 text-sm">
              Místo je pro tebe <strong>rezervované 30 minut</strong>.
              Pokud do té doby nedokončíš platbu, rezervace se automaticky 
              uvolní pro další zájemce.
            </p>

            {event.price ? (
              <button
                onClick={handleStripePayment}
                className="w-full bg-gradient-to-r from-fuchsia-400 to-pink-500 text-[#071022] py-2 rounded-lg font-semibold shadow-md transition"
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
              className="w-full bg-white/10 border border-white/30 py-2 rounded-lg"
            >
              Zavřít
            </button>
          </div>
        ) : (
          // 📝 FORMULÁŘ
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="name"
              placeholder="Jméno a příjmení"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20"
            />

            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20"
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
              placeholder="Co očekáváš od Rébus akce?"
              value={formData.message}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20"
            />

            {/* 🟡 POVINNÉ SOUHLASY */}
            <div className="space-y-2 text-sm text-white/80">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="gdpr"
                  checked={formData.gdpr}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
                <span>Souhlasím se zpracováním osobních údajů (GDPR).</span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="safety"
                  checked={formData.safety}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
                <span>
                  Účastním se akce na vlastní odpovědnost. 
                  Organizátor nenese odpovědnost za úrazy.
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="age18plus"
                  checked={formData.age18plus}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
                <span>Potvrzuji, že mi je 18 let nebo více.</span>
              </label>

              <p className="text-xs text-white/40">
                <a
                  href="/podminky-ucasti.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Podmínky účasti
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-gradient-to-r from-a1 to-a2 text-[#071022] py-2 rounded-lg font-semibold shadow-md"
            >
              {status === "sending" ? "Odesílám…" : "Odeslat rezervaci"}
            </button>

            {status === "error" && (
              <p className="text-red-400 text-center">
                ❌ Chyba při odesílání.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}



