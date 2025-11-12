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

// === GALERIE – dynamická z Firebase ===
function GallerySection() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data());
        setImages(list);
      } catch (err) {
        console.error("Chyba při načítání galerie:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGallery();
  }, []);

  return (
    <section id="gallery" className="mt-16 space-y-6">
      <h3 className="text-xl font-semibold">Momentky z večerů</h3>
      <p className="text-sm text-white/60">
        📸 Sdílej své fotky s hashtagem <strong>#poznejahraj</strong>
      </p>

      {loading ? (
        <p className="text-white/50 text-sm">Načítám galerii...</p>
      ) : images.length === 0 ? (
        <p className="text-white/50 text-sm">Zatím žádné fotky.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {images.map((img, i) => (
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
  );
}

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

  return (
    <div className="min-h-screen bg-[#05060a] font-rubik text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(124,58,237,0.25),transparent_60%),radial-gradient(40%_40%_at_80%_20%,rgba(236,72,153,0.15),transparent_60%)]" />
      <div className="mx-auto max-w-6xl px-4 pb-24">

        {/* === HERO, ABOUT, STATS, AKCE, ANKETA atd. zůstávají beze změny === */}
        {/* (ponecháváš vše ostatní přesně, jak to máš ve své verzi) */}

        {/* === ANKETA === */}
        <PollSection />

        {/* === DYNAMICKÁ GALERIE === */}
        <GallerySection />

        {/* === FEEDBACK === */}
        <section id="feedback" className="mt-16">
          <h3 className="text-xl font-semibold mb-2">
            Chceš, abychom uspořádali večer i pro tebe?
          </h3>
          <p className="text-sm text-white/70 mb-6">
            Máš nápad, přání nebo zpětnou vazbu? Napiš nám – připravíme program na míru.
          </p>
          <FeedbackForm />
        </section>

        {selectedEvent && (
          <ReservationForm event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}

        {/* === FOOTER === */}
        <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Poznej &amp; Hraj · Těšíme se na další společnou hru!
        </footer>
      </div>
    </div>
  );
}







