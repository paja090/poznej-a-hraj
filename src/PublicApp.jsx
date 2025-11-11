import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";

import FeedbackForm from "./components/FeedbackForm.jsx";
import ReservationForm from "./components/ReservationForm";

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-glass backdrop-blur">
      <div className="text-3xl font-extrabold text-a2">{value}</div>
      <div className="mt-2 text-sm text-white/70">{label}</div>
    </div>
  );
}

function EventCard({ event, onReserve, variant = "upcoming" }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-white/70">{event.description}</p>
        </div>
        <span className="rounded-full border border-a1/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-a1">
          {variant === "upcoming" ? "Nadcházející" : "Archiv"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        <span className="pill">📅 {event.date || event.when}</span>
        <span className="pill">📍 {event.place}</span>
        {"capacity" in event && <span className="pill">Kapacita: {event.capacity}</span>}
        {"available" in event && (
          <span className="pill text-a2">Volná místa: {event.available || "?"}</span>
        )}
        {"price" in event && event.price && (
          <span className="pill text-[#b4ffd9]">💳 {event.price} Kč</span>
        )}
      </div>
      {variant === "upcoming" && (
        <button
          type="button"
          onClick={() => onReserve(event)}
          className="self-start rounded-xl border border-white/20 px-4 py-2 text-sm text-a1 transition hover:border-a1/80 hover:text-white"
        >
          Rezervovat
        </button>
      )}
    </article>
  );
}

export default function PublicApp() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [stats, setStats] = useState({
    events: 0,
    past: 0,
    attendees: 0,
    reviews: 0,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const now = new Date();
      const getEventDate = (e) =>
        e.date?.toDate ? e.date.toDate() : new Date(e.date || e.startDate || e.when || 0);
      const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const upcoming = events.filter((e) => getEventDate(e) >= now);
      const past = events.filter((e) => getEventDate(e) < now);
      setUpcomingEvents(upcoming);
      setPastEvents(past);
      setStats((s) => ({ ...s, events: events.length, past: past.length }));
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
    <div className="min-h-screen bg-poznej font-rubik text-white">
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <header className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-a1 to-a2 text-2xl font-extrabold text-[#071022] shadow-xl">
              PH
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Poznej &amp; Hraj</h1>
              <p className="text-sm text-white/70">
                Zábavné večery plné her, kvízů a nových známostí — přijď, zahraj si, poznej lidi.
              </p>
            </div>
          </div>
        </header>

        <section className="card" id="stats">
          <h3 className="text-xl font-semibold text-white">Naše akce v číslech</h3>
          <p className="mt-1 text-sm text-white/60">Aktualizované statistiky z posledních akcí</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="naplánovaných akcí" value={stats.events} />
            <StatCard label="předešlých akcí" value={stats.past} />
            <StatCard label="účastníků celkem" value={stats.attendees} />
            <StatCard label="recenzí" value={stats.reviews} />
          </div>
        </section>

        <section className="card space-y-8" id="events">
          <h3 className="text-xl font-semibold text-white mb-2">Nadcházející akce</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-white/60">Žádné plánované akce.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} onReserve={setSelectedEvent} />
              ))}
            </div>
          )}
        </section>

        {selectedEvent && (
          <ReservationForm event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}

        <section className="card space-y-6 mt-12" id="past-events">
          <h3 className="text-xl font-semibold text-white">Předešlé akce</h3>
          {pastEvents.length === 0 ? (
            <p className="text-white/60">Zatím žádné proběhlé akce.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="past" />
              ))}
            </div>
          )}
        </section>

        <section id="feedback" className="card mt-12">
          <h3 className="text-xl font-semibold mb-2">
            Chceš, abychom uspořádali večer i pro tebe?
          </h3>
          <p className="text-sm text-white/70 mb-6">
            Máš nápad, přání nebo zpětnou vazbu? Napiš nám – připravíme program na míru a rádi
            si poslechneme tvůj názor.
          </p>
          <FeedbackForm />
        </section>

        <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Poznej &amp; Hraj · Těšíme se na další společnou hru!
        </footer>
      </div>
    </div>
  );
}




