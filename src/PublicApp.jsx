// src/PublicApp.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, getDocs, query, orderBy } from "firebase/firestore";
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

// === DATA (statické části zůstávají) ===
const heroTags = ["🎮 Herní turnaje", "🎤 Live moderátoři", "📸 Foto koutek", "💬 Seznamování"];
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
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

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

  // 🔹 Načtení galerie z Firestore
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const imgs = snap.docs.map((d) => d.data());
        setGallery(imgs);
      } catch (err) {
        console.error("Chyba při načítání galerie:", err);
      } finally {
        setLoadingGallery(false);
      }
    };
    loadGallery();
  }, []);

  const pollTotal = pollOptions.reduce((a, b) => a + b.votes, 0);

  return (
    <div className="min-h-screen bg-[#05060a] font-rubik text-white">
      {/* === zbytek tvého původního kódu beze změn === */}

      {/* === GALERIE === */}
      <section id="gallery" className="mt-16 space-y-6">
        <h3 className="text-xl font-semibold">Momentky z večerů</h3>
        <p className="text-sm text-white/60">
          📸 Sdílej své fotky s hashtagem <strong>#poznejahraj</strong>
        </p>

        {loadingGallery ? (
          <p className="text-white/50 text-sm">Načítám galerii...</p>
        ) : gallery.length === 0 ? (
          <p className="text-white/50 text-sm">Zatím žádné fotky.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {gallery.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.name || "Momentka"}
                className="rounded-2xl border border-white/10 object-cover h-40 w-full hover:scale-[1.03] hover:border-fuchsia-400/50 transition"
              />
            ))}
          </div>
        )}
      </section>

      {/* === zbytek stránky (crew, reviews, feedback, footer) zůstává přesně podle tvého kódu === */}
    </div>
  );
}







