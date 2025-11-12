// src/PublicApp.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";

import FeedbackForm from "./components/FeedbackForm.jsx";
import ReservationForm from "./components/ReservationForm.jsx";
import PollSection from "./components/PollSection.jsx";

// === MINI-KOMPONENTY ===
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-md backdrop-blur-sm hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition">
      <div className="text-3xl font-extrabold text-fuchsia-300">{value}</div>
      <p className="mt-2 text-sm text-white/70">{label}</p>
    </div>
  );
}

function EventCard({ event, onReserve, variant = "upcoming" }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-sm transition hover:border-fuchsia-400/40">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          {event.description && (
            <p className="mt-1 text-sm text-white/60">{event.description}</p>
          )}
        </div>
        <span className="rounded-full border border-fuchsia-400/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase text-fuchsia-300">
          {variant === "upcoming" ? "Nadcházející" : "Archiv"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        {event.date && <span className="pill">📅 {event.date}</span>}
        {event.place && <span className="pill">📍 {event.place}</span>}
        {"capacity" in event && <span className="pill">Kapacita: {event.capacity}</span>}
        {"available" in event && (
          <span className="pill text-fuchsia-300">Volná místa: {event.available ?? "?"}</span>
        )}
        {event.price && <span className="pill text-emerald-200">💳 {event.price} Kč</span>}
      </div>

      {variant === "upcoming" && (
        <button
          onClick={() => onReserve(event)}
          className="mt-2 self-start rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 px-4 py-2 text-sm font-semibold text-[#071022] shadow-md hover:scale-[1.02] transition"
        >
          Rezervovat
        </button>
      )}
    </article>
  );
}

// === DATA (do budoucna propojit s Firestore) ===
const heroTags = ["🎮 Herní turnaje", "🎤 Live moderátoři", "📸 Foto koutek", "💬 Seznamování"];
const galleryImages = [
  "https://picsum.photos/seed/party01/800/533",
  "https://picsum.photos/seed/party02/800/533",
  "https://picsum.photos/seed/party03/800/533",
  "https://picsum.photos/seed/party04/800/533",
  "https://picsum.photos/seed/party05/800/533",
  "https://picsum.photos/seed/party06/800/533",
];
const pollOptions = [
  { title: "Retro Night", description: "80s & 90s", votes: 6 },
  { title: "Beer & Quiz", description: "kvízy + pivo", votes: 9 },
  { title: "Hookah & Chill", description: "vodní dýmka & chill", votes: 4 },
];
const crew = [
  { name: "Marek", role: "Moderátor", desc: "Připravuje výzvy a dělá atmosféru.", photo: "https://i.pravatar.cc/200?img=12" },
  { name: "Petra", role: "Koordinátorka", desc: "Propojuje hosty a hlídá flow večera.", photo: "https://i.pravatar.cc/200?img=47" },
  { name: "Tomáš", role: "DJ & Tech", desc: "Hudba, světla a technika vyladěná na party.", photo: "https://i.pravatar.cc/200?img=33" },
];
const reviews = [
  { text: "Skvěle připravené aktivity, poznala jsem úžasné lidi.", author: "Anna" },
  { text: "Program odsýpal a moderátoři byli k nezaplacení.", author: "Jakub" },
  { text: "Parádní večer plný smíchu a přirozených seznámení.", author: "Eliška" },
];

// === HLAVNÍ KOMPONENTA ===
export default function PublicApp() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [stats, setStats] = useState({ events: 0, past: 0, attendees: 0, reviews: 0 });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const now = new Date();
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const upcomingEvents = data.filter((e) => new Date(e.date) >= now);
      const pastEvents = data.filter((e) => new Date(e.date) < now);
      setUpcoming(upcomingEvents);
      setPast(pastEvents);
      setStats((s) => ({ ...s, events: data.length, past: pastEvents.length }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), (snap) => {
      setStats((s) => ({ ...s, attendees: snap.size }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "feedback"), (snap) => {
      setStats((s) => ({ ...s, reviews: snap.size }));
    });
    return () => unsub();
  }, []);

  const pollTotal = pollOptions.reduce((a, b) => a + b.votes, 0);

  return (
    <div className="min-h-screen bg-[#05060a] font-rubik text-white">
      {/* Gradient pozadí */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(124,58,237,0.25),transparent_60%),radial-gradient(40%_40%_at_80%_20%,rgba(236,72,153,0.15),transparent_60%)]" />

      <div className="mx-auto max-w-6xl px-4 pb-24">
        {/* === HLAVIČKA === */}
        <header className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-400 to-pink-500 text-xl font-extrabold text-[#071022] shadow-lg">
              PH
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Poznej &amp; Hraj</h1>
              <p className="text-sm text-white/70">Zábavné večery plné her, kvízů a nových známostí.</p>
            </div>
          </div>
          <nav className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm shadow-md backdrop-blur">
            <ul className="flex flex-wrap items-center gap-3 text-white/70">
              <li><a href="#events" className="hover:text-white">Akce</a></li>
              <li><a href="#stats" className="hover:text-white">Statistiky</a></li>
              <li><a href="#poll" className="hover:text-white">Anketa</a></li>
              <li><a href="#crew" className="hover:text-white">Tým</a></li>
              <li><a href="#reviews" className="hover:text-white">Recenze</a></li>
              <li><a href="#feedback" className="hover:text-white">Kontakt</a></li>
            </ul>
          </nav>
        </header>

        {/* ... celý zbytek kódu včetně sekcí HERO, ABOUT, STATS, EVENTS, POLL, CREW, GALERIE, RECENZE, FEEDBACK, SOCIAL, FOOTER ... */}
      </div>
    </div>
  );
}







