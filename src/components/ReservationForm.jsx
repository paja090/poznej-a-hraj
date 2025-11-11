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

  // 🧩 univerzální změna formuláře
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🧾 odeslání dat do Formspree + Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      // 1️⃣ Odeslat do Formspree (asynchronně)
      const formspreeResponse = await fetch("https://formspree.io/f/xovyawqv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventTitle: event.title,
        }),
      });

      if (!formspreeResponse.ok) throw new Error("Formspree error");

      // 2️⃣ Uložit do Firestore
      await addDoc(collection(db, "reservations"), {
        ...formData,
        eventTitle: event.title,
        createdAt: serverTimestamp(),
      });

      // ✅ Hotovo
      setStatus("success");

      // Vyčištění formuláře po odeslání
      setFormData({
        name: "",
        email: "",
        gender: "",
        ageRange: "",
        relationship: "",
        peopleCount: 1,
        message: "",
      });

      // Automatické zavření formuláře po pár sekundách
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      console.error("❌ Chyba při odesílání rezervace:", error);
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white text-lg"
          title="Zavřít"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">
          Rezervace: {event.title}
        </h2>

        {status === "success" ? (
          <p className="text-green-400 text-center font-medium">
            ✅ Díky! Tvoje rezervace byla úspěšně odeslána.
            <br />
            Těšíme se na tebe!
          </p>
        ) : (
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
                className="p-2 rounded-lg bg-white/10 border border-white/20 focus:border-a2 focus:ring-1 focus:ring-a2 outline-none"
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
                className="p-2 rounded-lg bg-white/10 border border-white/20 focus:border-a2 focus:ring-1 focus:ring-a2 outline-none"
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
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 focus:border-a2 focus:ring-1 focus:ring-a2 outline-none"
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
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 focus:border-a2 focus:ring-1 focus:ring-a2 outline-none"
              placeholder="Počet osob"
            />

            <textarea
              name="message"
              placeholder="Poznámka (volitelné)"
              value={formData.message}
              onChange={handleChange}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/50 focus:border-a2 focus:ring-1 focus:ring-a2 outline-none"
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

