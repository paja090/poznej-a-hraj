// src/PublicApp.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";

import FeedbackForm from "./components/FeedbackForm.jsx";
import ReservationForm from "./components/ReservationForm.jsx";

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

        {/* === HERO === */}
        <section className="grid items-center gap-8 py-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <iframe
              className="h-full w-full aspect-video"
              src="https://www.youtube.com/embed/5jK8L3j4Z_4"
              title="Promo video"
              allowFullScreen
            />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">Místo, kde se lidé potkávají přirozeně</h2>
            <p className="mt-4 text-lg text-white/80">
              Hry, výzvy a soutěže jsou perfektní ledoborce. Organizujeme večery, na které se chceš vracet.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {heroTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-fuchsia-400/50 hover:text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* === STATISTIKY === */}
        <section id="stats" className="mt-10 space-y-6">
          <h3 className="text-xl font-semibold">Naše akce v číslech</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="naplánovaných akcí" value={stats.events} />
            <StatCard label="předešlých akcí" value={stats.past} />
            <StatCard label="účastníků celkem" value={stats.attendees} />
            <StatCard label="recenzí" value={stats.reviews} />
          </div>
        </section>

        {/* === NADCHÁZEJÍCÍ + PŘEDEŠLÉ AKCE === */}
        <section id="events" className="mt-14 space-y-12">
          <div>
            <h3 className="text-xl font-semibold mb-3">Nadcházející akce</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              {upcoming.length
                ? upcoming.map((e) => (
                    <EventCard key={e.id} event={e} onReserve={setSelectedEvent} />
                  ))
                : <p className="text-white/60">Žádné plánované akce.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Předešlé akce</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              {past.length
                ? past.map((e) => <EventCard key={e.id} event={e} variant="past" />)
                : <p className="text-white/60">Zatím žádné proběhlé akce.</p>}
            </div>
          </div>
        </section>

        {/* === ANKETA === */}
        <section id="poll" className="mt-16 space-y-6">
          <h3 className="text-xl font-semibold">Anketa: Téma příštího večera</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {pollOptions.map((opt) => {
              const ratio = Math.round((opt.votes / pollTotal) * 100);
              return (
                <div key={opt.title} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{opt.title}</p>
                      <p className="text-sm text-white/60">{opt.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-fuchsia-300">{ratio}%</span>
                  </div>
                  <div className="mt-3 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* === CREW === */}
        <section id="crew" className="mt-16 space-y-6">
          <h3 className="text-xl font-semibold">The Crew</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {crew.map((m) => (
              <div
                key={m.name}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-fuchsia-400/50 transition"
              >
                <img src={m.photo} alt={m.name} className="h-24 w-24 mx-auto rounded-full border border-white/20" />
                <p className="mt-3 font-semibold text-white">{m.name}</p>
                <p className="text-sm text-fuchsia-300">{m.role}</p>
                <p className="mt-2 text-sm text-white/70">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === RECENZE === */}
        <section id="reviews" className="mt-16 space-y-6">
          <h3 className="text-xl font-semibold">Recenze</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-400/50 transition"
              >
                <p className="text-white/80 mb-2">„{r.text}“</p>
                <p className="text-sm text-fuchsia-300 font-semibold">— {r.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === FEEDBACK === */}
        <section id="feedback" className="mt-16">
          <h3 className="text-xl font-semibold mb-2">Chceš, abychom uspořádali večer i pro tebe?</h3>
          <p className="text-sm text-white/70 mb-6">
            Máš nápad, přání nebo zpětnou vazbu? Napiš nám – připravíme program na míru.
          </p>
          <FeedbackForm />
        </section>

        {/* === MODÁL REZERVACE === */}
        {selectedEvent && (
          <ReservationForm event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}

        {/* === FOOTER === */}
        <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Poznej & Hraj · Těšíme se na další společnou hru!
        </footer>
      </div>
    </div>
  );
}






