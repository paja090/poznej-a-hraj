import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export default function AdminDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    place: "",
    description: "",
    capacity: "",
    price: "",
  });

  // 🔹 Načtení všech akcí v reálném čase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 🔹 Přidání nové akce
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.place) return;

    try {
      await addDoc(collection(db, "events"), {
        ...newEvent,
        capacity: Number(newEvent.capacity) || 0,
        price: Number(newEvent.price) || 0,
        createdAt: serverTimestamp(),
      });
      setNewEvent({
        title: "",
        date: "",
        place: "",
        description: "",
        capacity: "",
        price: "",
      });
    } catch (err) {
      console.error("Chyba při přidávání akce:", err);
      alert("Nepodařilo se přidat akci.");
    }
  };

  // 🔹 Smazání akce
  const handleDelete = async (id) => {
    if (window.confirm("Opravdu chceš smazat tuto akci?")) {
      await deleteDoc(doc(db, "events", id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Panel – Poznej & Hraj</h1>
        <div className="flex items-center gap-4">
          <img
            src={user.photoURL}
            alt="user"
            className="w-10 h-10 rounded-full border border-white/20"
          />
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      {/* 🗓️ Formulář pro přidání nové akce */}
      <section className="bg-slate-800 p-6 rounded-xl mb-10 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Přidat novou akci</h2>
        <form onSubmit={handleAddEvent} className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Název akce"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            className="bg-slate-700 p-2 rounded-md text-white"
            required
          />
          <input
            type="text"
            placeholder="Místo konání"
            value={newEvent.place}
            onChange={(e) => setNewEvent({ ...newEvent, place: e.target.value })}
            className="bg-slate-700 p-2 rounded-md text-white"
            required
          />
          <input
            type="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            className="bg-slate-700 p-2 rounded-md text-white"
            required
          />
          <input
            type="number"
            placeholder="Kapacita"
            value={newEvent.capacity}
            onChange={(e) =>
              setNewEvent({ ...newEvent, capacity: e.target.value })
            }
            className="bg-slate-700 p-2 rounded-md text-white"
          />
          <input
            type="number"
            placeholder="Cena vstupenky (Kč)"
            value={newEvent.price}
            onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
            className="bg-slate-700 p-2 rounded-md text-white"
          />
          <textarea
            placeholder="Popis akce"
            value={newEvent.description}
            onChange={(e) =>
              setNewEvent({ ...newEvent, description: e.target.value })
            }
            className="bg-slate-700 p-2 rounded-md text-white md:col-span-2"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md md:col-span-2"
          >
            ➕ Přidat akci
          </button>
        </form>
      </section>

      {/* 📋 Výpis všech akcí */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Seznam akcí</h2>
        {events.length === 0 ? (
          <p className="text-gray-400">Zatím nejsou přidané žádné akce.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="bg-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between shadow-md"
              >
                <div>
                  <p className="font-semibold text-lg">{ev.title}</p>
                  <p className="text-sm text-gray-400">
                    📅 {ev.date} | 📍 {ev.place}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{ev.description}</p>
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md mt-3 md:mt-0"
                >
                  🗑️ Smazat
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
