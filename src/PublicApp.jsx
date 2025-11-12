// src/PublicApp.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";

import FeedbackForm from "./components/FeedbackForm.jsx";
import ReservationForm from "./components/ReservationForm";
import PollSection from "./components/PollSection";
import CrewSection from "./components/CrewSection";
import ReviewsSection from "./components/ReviewsSection";
import GallerySection from "./components/GallerySection";


// --- Pomocné mini-komponenty ---
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur">
      <div className="text-3xl font-extrabold text-lime-300">{value}</div>
      <div className="mt-2 text-sm text-white/70">{label}</div>
    </div>
  );
}

function EventCard({ event, onReserve, variant = "upcoming" }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          {event.description && (
            <p className="mt-1 text-sm text-white/70">{event.description}</p>
          )}
        </div>
        <span className="rounded-full border border-fuchsia-400/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
          {variant === "upcoming" ? "Nadcházející" : "Archiv"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        <span className="pill">📅 {event.date || event.when}</span>
        {event.place && <span className="pill">📍 {event.place}</span>}
        {"capacity" in event && <span className="pill">Kapacita: {event.capacity}</span>}
        {"available" in event && (
          <span className="pill text-lime-300">Volná místa: {event.available ?? "?"}</span>
        )}
        {event.price ? (
          <span className="pill text-emerald-200">💳 {event.price} Kč</span>
        ) : null}
      </div>
      {variant === "upcoming" && (
        <button
          type="button"
          onClick={() => onReserve(event)}
          className="mt-2 self-start rounded-xl border border-white/20 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 px-4 py-2 text-sm font-semibold text-[#071022] shadow hover:scale-[1.02] transition"
        >
          Rezervovat
        </button>
      )}
    </article>
  );
}

function PollOption({ option, total }) {
  const ratio = total ? Math.round((option.votes / total) * 100) : 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{option.title}</p>
          <p className="text-sm text-white/60">{option.description}</p>
        </div>
        <span className="text-sm font-semibold text-lime-300">{option.votes} hlasů</span>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500"
          style={{ width: `${ratio}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-white/60">{ratio}% hlasů</p>
    </div>
  );
}

function CrewCard({ member }) {
  return (
    <article className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow">
      <img
        src={member.photo}
        alt={member.name}
        className="h-24 w-24 rounded-full border border-white/20 object-cover shadow-lg"
      />
      <div>
        <p className="font-semibold text-white">{member.name}</p>
        <p className="text-sm text-fuchsia-300">{member.role}</p>
      </div>
      <p className="text-sm text-white/70">{member.description}</p>
    </article>
  );
}

function ReviewCard({ text, author }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
      „{text}“ — <span className="font-semibold">{author}</span>
    </li>
  );
}

// --- Lokální data (zatím) – připraveno na budoucí přesun do Firestore ---
const heroTagsFallback = ["🎮 Herní turnaje", "🎤 Live moderátoři", "📸 Foto koutek", "💬 Seznamování"];

const pollOptionsLocal = [
  { title: "Retro Night", description: "80s & 90s", votes: 6 },
  { title: "Beer & Quiz", description: "kvízy + pivo", votes: 9 },
  { title: "Hookah & Chill", description: "vodní dýmka & chill", votes: 4 },
];

const crewLocal = [
  { name: "Marek", role: "Moderátor her", description: "Připravuje výzvy a dělá atmosféru.", photo: "https://i.pravatar.cc/200?img=12" },
  { name: "Petra", role: "Koordinátorka zábavy", description: "Propojuje hosty a hlídá flow večera.", photo: "https://i.pravatar.cc/200?img=47" },
  { name: "Tomáš", role: "DJ & Tech", description: "Hudba, světla a technika vyladěná na party.", photo: "https://i.pravatar.cc/200?img=33" },
];

const reviewsLocal = [
  { text: "Skvěle připravené aktivity, poznala jsem úžasné lidi.", author: "Anna" },
  { text: "Program odsýpal a moderátoři byli k nezaplacení.", author: "Jakub" },
];

// === HLAVNÍ KOMPONENTA ===
export default function PublicApp() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [stats, setStats] = useState({ events: 0, past: 0, attendees: 0, reviews: 0 });

  // Načtení akcí z Firestore a rozdělení na nadcházející / minulé
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const now = new Date();
      const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const parsed = events.map((e) => ({
        ...e,
        // pro jistotu, kdyby date nebyl ISO: necháme string projít Date konstruktorem
        _date: e.date ? new Date(e.date) : null,
      }));
      const upcoming = parsed.filter((e) => e._date && e._date >= now);
      const past = parsed.filter((e) => e._date && e._date < now);
      setUpcomingEvents(upcoming);
      setPastEvents(past);
      setStats((s) => ({ ...s, events: events.length, past: past.length }));
    });
    return () => unsub();
  }, []);

  // Počet rezervací (účastníků)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), (snap) => {
      setStats((s) => ({ ...s, attendees: snap.size }));
    });
    return () => unsub();
  }, []);

  // Počet recenzí (feedback)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "feedback"), (snap) => {
      setStats((s) => ({ ...s, reviews: snap.size }));
    });
    return () => unsub();
  }, []);

  // Výpočty pro anketu (zatím lokální)
  const pollTotal = pollOptionsLocal.reduce((a, b) => a + b.votes, 0);

  return (
    <div className="min-h-screen bg-[#05060a] font-rubik text-white">
      {/* Ambientní gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(124,58,237,0.25),transparent_60%),radial-gradient(40%_40%_at_80%_20%,rgba(236,72,153,0.15),transparent_60%)]" />

      <div className="mx-auto max-w-6xl px-4 pb-24">
        {/* === HLAVIČKA === */}
        <header className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-400 to-pink-500 text-xl font-extrabold text-[#071022] shadow-xl">
              PH
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Poznej &amp; Hraj</h1>
              <p className="text-sm text-white/70">
                Zábavné večery plné her, kvízů a nových známostí — přijď, zahraj si, poznej lidi.
              </p>
            </div>
          </div>
          <nav className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm shadow-lg backdrop-blur">
            <ul className="flex flex-wrap items-center gap-3 text-white/70">
              <li><a className="hover:text-white" href="#events">Akce</a></li>
              <li><a className="hover:text-white" href="#stats">Statistiky</a></li>
              <li><a className="hover:text-white" href="#poll">Anketa</a></li>
              <li><a className="hover:text-white" href="#crew">Crew</a></li>
              <li><a className="hover:text-white" href="#reviews">Recenze</a></li>
              <li><a className="hover:text-white" href="#feedback">Kontakt</a></li>
            </ul>
          </nav>
        </header>

        {/* === HERO (video vlevo / text vpravo) === */}
        <section className="grid items-center gap-8 py-10 md:grid-cols-2">
          {/* Video vlevo */}
          <div className="order-1 overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] md:order-none">
            <div className="aspect-video">
              <iframe
                title="Promo video"
                className="h-full w-full"
                src="https://www.youtube.com/embed/5jK8L3j4Z_4"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          {/* Text + CTA vpravo */}
          <div>
            <button
              type="button"
              className="mb-6 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 px-5 py-2 text-sm font-semibold text-[#071022] shadow-lg transition hover:-translate-y-0.5"
            >
              Rezervuj místo 🔔 Kapacita se rychle plní
            </button>
            <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
              Místo, kde se lidé potkávají přirozeně
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Hry, výzvy a soutěže jsou perfektní ledoborce. Organizujeme večery, na které se chceš vracet.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {heroTagsFallback.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:border-fuchsia-400/50 hover:text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* === STATISTIKY === */}
        <section className="card mt-6" id="stats">
          <h3 className="text-xl font-semibold text-white">Naše akce v číslech</h3>
          <p className="mt-1 text-sm text-white/60">Aktualizované statistiky z posledních akcí</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="naplánovaných akcí" value={stats.events} />
            <StatCard label="předešlých akcí" value={stats.past} />
            <StatCard label="účastníků celkem" value={stats.attendees} />
            <StatCard label="recenzí" value={stats.reviews} />
          </div>
        </section>

        {/* === AKCE === */}
        <section className="card space-y-8 mt-10" id="events">
          <div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-xl font-semibold text-white">Nadcházející akce</h3>
              <span className="text-sm text-white/60">{upcomingEvents.length} akce</span>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="mt-3 text-white/60">Žádné plánované akce.</p>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} onReserve={setSelectedEvent} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-xl font-semibold text-white">Předešlé akce</h3>
              <span className="text-sm text-white/60">{pastEvents.length} v archivu</span>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {pastEvents.length === 0 ? (
                <p className="text-white/60">Zatím žádné proběhlé akce.</p>
              ) : (
                pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="past" />
                ))
              )}
            </div>
          </div>
        </section>

        {/* === ANKETA === */}
        <section className="card mt-12" id="poll">
          <h3 className="text-xl font-semibold text-white">Anketa: Téma příštího večera</h3>
          <p className="mt-1 text-sm text-white/60">Hlasuj, na co máš chuť příště. (propojení do adminu doplníme)</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pollOptionsLocal.map((opt) => (
              <PollOption key={opt.title} option={opt} total={pollTotal} />
            ))}
          </div>
        </section>

        {/* === CREW === */}
        <section className="card mt-12" id="crew">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">The Crew</h3>
              <p className="text-sm text-white/60">Lidé, kteří za tím stojí</p>
            </div>
            <span className="text-sm text-white/60">{crewLocal.length} členové</span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {crewLocal.map((m) => (
              <CrewCard key={m.name} member={m} />
            ))}
          </div>
        </section>

        {/* === RECENZE === */}
        <section className="card mt-12" id="reviews">
          <h3 className="text-xl font-semibold text-white">Recenze</h3>
          <p className="mt-1 text-sm text-white/60">Co říkají účastníci</p>
          <ul className="mt-6 space-y-4 text-sm text-white/75">
            {reviewsLocal.map((r, i) => (
              <ReviewCard key={i} text={r.text} author={r.author} />
            ))}
          </ul>
        </section>

        {/* === FEEDBACK === */}
        <section id="feedback" className="card mt-12">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-fuchsia-400/60 bg-fuchsia-400/20 text-2xl">
              💬
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Chceš, abychom uspořádali večer i pro tebe?</h3>
              <p className="text-sm text-white/70">
                Máš nápad, přání nebo zpětnou vazbu? Napiš nám – připravíme program na míru a rádi si poslechneme tvůj názor.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <FeedbackForm />
          </div>
        </section>

        {/* === MODÁL REZERVACE === */}
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





