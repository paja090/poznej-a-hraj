// src/components/AdminDashboard.jsx
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
import AdminPolls from "./AdminPolls.jsx"; // ✅ OPRAVENO – správná cesta

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    place: "",
    description: "",
    capacity: "",
    price: "",
  });

  // 🔹 Načti akce
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 🔹 Načti rezervace
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), (snapshot) => {
      setReservations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 🔹 Přidej novou akci
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.place) return;

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
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Opravdu smazat akci?")) await deleteDoc(doc(db, "events", id));
  };

  const handleDeleteReservation = async (id) => {
    if (window.confirm("Opravdu smazat rezervaci?"))
      await deleteDoc(doc(db, "reservations", id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* === HLAVIČKA === */}
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

      {/* === NAVIGACE === */}
      <nav className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "events"
              ? "bg-violet-600"
              : "bg-slate-800 hover:bg-slate-700 text-white/80"
          }`}
        >
          📅 Akce
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "reservations"
              ? "bg-violet-600"
              : "bg-slate-800 hover:bg-slate-700 text-white/80"
          }`}
        >
          🧾 Rezervace
        </button>
        <button
          onClick={() => setActiveTab("polls")}
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "polls"
              ? "bg-violet-600"
              : "bg-slate-800 hover:bg-slate-700 text-white/80"
          }`}
        >
          🗳️ Ankety
        </button>
      </nav>

      {/* === SEKCE OBSAHU === */}
      {activeTab === "events" && (
        <>
          {/* 🗓️ Přidat akci */}
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
                onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
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

          {/* 📋 Seznam akcí */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Seznam akcí</h2>
            {events.length === 0 ? (
              <p className="text-gray-400">Zatím nejsou žádné akce.</p>
            ) : (
              <ul className="space-y-4">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="bg-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-lg">{ev.title}</p>
                      <p className="text-sm text-gray-400">
                        📅 {ev.date} | 📍 {ev.place}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">{ev.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md mt-3 md:mt-0"
                    >
                      🗑️ Smazat
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* === SEKCE REZERVACE === */}
      {activeTab === "reservations" && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Rezervace</h2>
          {reservations.length === 0 ? (
            <p className="text-gray-400">Zatím žádné rezervace.</p>
          ) : (
            <ul className="space-y-3">
              {reservations.map((r) => (
                <li
                  key={r.id}
                  className="bg-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-gray-400">
                      📅 {r.eventTitle} | {r.ageRange} | {r.gender} | {r.relationship}
                    </p>
                    <p className="text-sm text-gray-400">
                      👥 {r.peopleCount} os. · 📧 {r.email}
                    </p>
                    {r.message && (
                      <p className="text-xs text-gray-500 mt-1">💬 {r.message}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteReservation(r.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md mt-3 md:mt-0"
                  >
                    🗑️ Smazat
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* === SEKCE ANKETY === */}
      {activeTab === "polls" && <AdminPolls />}
    </div>
  );
}



