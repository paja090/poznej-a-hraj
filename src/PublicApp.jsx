// src/PublicApp.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

import FeedbackForm from "./components/FeedbackForm.jsx";
import ReservationForm from "./components/ReservationForm.jsx";
import PollSection from "./components/PollSection.jsx";
import EventDetailModal from "./components/EventDetailModal.jsx";

// === MINI KOMPONENTY ===
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
<button
  onClick={() => setDetailEvent(event)}
  className="self-start rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 border border-white/10 hover:border-fuchsia-400/40 transition"
>
  Zobrazit detail
</button>
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

// === STATICKÁ DATA ===
const pollOptions = [
  { title: "Retro Night", description: "80s & 90s", votes: 6 },
  { title: "Beer & Quiz", description: "kvízy + pivo", votes: 9 },
  { title: "Hookah & Chill", description: "vodní dýmka & chill", votes: 4 },
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [crewMembers, setCrewMembers] = useState([]);
  const [loadingCrew, setLoadingCrew] = useState(true);
  const [heroTags, setHeroTags] = useState([]);
  const [detailEvent, setDetailEvent] = useState(null);

   // === Stripe návrat ===
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("stripe_success") === "1") {
      alert("🎉 Platba proběhla úspěšně! Těšíme se na tebe na akci.");
    }

    if (params.get("stripe_cancel") === "1") {
      console.log("Uživatel zrušil platbu.");
    }
  }, []);

  // === SMOOTH SCROLL ===
  const handleSmoothScroll = (e, id) => {
    e.preventDefault();
    const target = document.querySelector(id);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  // === HERO TAGS ===
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "heroTags"), (snapshot) => {
      setHeroTags(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // === AKCE ===
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

  // === REZERVACE ===
useEffect(() => {
  const unsub = onSnapshot(collection(db, "reservations"), (snap) => {
    const reservations = snap.docs.map((doc) => doc.data());

    // Přepočet podle názvu akce
    setUpcoming((prev) =>
      prev.map((event) => {
        const count = reservations.filter(
          (r) => r.eventTitle === event.title
        ).length;
        return { ...event, available: Math.max(event.capacity - count, 0) };
      })
    );

    setStats((s) => ({ ...s, attendees: snap.size }));
  });

  return () => unsub();
}, []);

  // === FEEDBACK ===
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "feedback"), (snap) => {
      setStats((s) => ({ ...s, reviews: snap.size }));
    });
    return () => unsub();
  }, []);

  // === CREW ===
  useEffect(() => {
    const q = query(collection(db, "crew"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setCrewMembers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoadingCrew(false);
    });
    return () => unsub();
  }, []);

  // === GALERIE ===
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

  // === RENDER ===
  return (
    <div className="min-h-screen bg-[#05060a] font-rubik text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(124,58,237,0.25),transparent_60%),radial-gradient(40%_40%_at_80%_20%,rgba(236,72,153,0.15),transparent_60%)]" />

      <div className="mx-auto max-w-6xl px-4 pb-24">
        {/* === HLAVIČKA === */}
    {/* === HLAVIČKA === */}
<header className="py-2">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    {/* Logo + Text */}
    <div className="flex items-center gap-4">
      {/* Logo (64px) */}
      <div className="h-64 w-64 flex items-center justify-center">
        <img
          src="/logo6.png"
          alt="Logo Poznej & Hraj"
          className="object-contain w-full h-full drop-shadow-[0_0_8px_rgba(236,72,153,0.25)] brightness-110"
        />
      </div>
      {/* Text pod logem */}
      <div className="leading-tight">
        <h1 className="text-lg md:text-xl font-bold">
          Poznej &amp; Hraj
        </h1>
        <p className="text-sm text-white/70">
          Zábavné večery plné her, kvízů a nových známostí.
        </p>
      </div>
    </div>
    {/* Navigace – Smooth Scroll */}
    <nav className="md:self-center rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm shadow-md backdrop-blur">
      <ul className="flex items-center gap-4 text-white/70">

        <li><button onClick={() => document.querySelector('#events').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Akce</button></li>

        <li><button onClick={() => document.querySelector('#stats').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Statistiky</button></li>

        <li><button onClick={() => document.querySelector('#poll').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Anketa</button></li>

        <li><button onClick={() => document.querySelector('#crew').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Tým</button></li>

        <li><button onClick={() => document.querySelector('#reviews').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Recenze</button></li>

        <li><button onClick={() => document.querySelector('#feedback').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Kontakt</button></li>
      </ul>
    </nav>
  </div>
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
            <button
              type="button"
              className="mb-6 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 px-5 py-2 text-sm font-semibold text-[#071022] shadow-lg transition hover:-translate-y-0.5"
            >
              Rezervuj místo 🔔 Kapacita se rychle plní
            </button>
            <h2 className="text-4xl font-extrabold leading-tight">
              Místo, kde se lidé potkávají přirozeně
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Hry, výzvy a soutěže jsou perfektní ledoborce. Organizujeme večery, na které se chceš vracet.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {heroTags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-fuchsia-400/50 hover:text-white"
                >
                  {tag.label || tag.text}
                </span>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-white/70">
              <a href="https://instagram.com/poznejahraj" target="_blank" rel="noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:-translate-y-1 hover:shadow-lg">
                📸
              </a>
              <a href="https://facebook.com/poznejahraj" target="_blank" rel="noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:-translate-y-1 hover:shadow-lg">
                📘
              </a>
              <p className="text-sm text-white/60">Sleduj momentky a označ <strong>@poznejahraj</strong></p>
            </div>
          </div>
        </section>

        {/* === ABOUT SECTION === */}
        <section id="about" className="card mt-10">
          <h3 className="text-xl font-semibold text-white">O projektu</h3>
          <p className="mt-4 text-white/70">
            <strong className="text-white">Poznej &amp; Hraj</strong> vzniklo z touhy spojovat lidi jinak — ne přes aplikace,
            ale skrze zážitky, hry a skutečné emoce. Každý večer má svůj příběh, atmosféru a moderátory, kteří pomáhají,
            aby se každý cítil vítaný.
          </p>
          <p className="mt-4 text-white/70">
            Program vede tým moderátorů. Dáváme dohromady mix aktivit: kvízy, mini-hry, výzvy v týmech i úkoly pro dvojice.
            Díky řízenému programu se i introverti snadno zapojí a seznámení působí přirozeně.
          </p>
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

        {/* === AKCE === */}
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
<PollSection />


        {/* === CREW === */}
<section id="crew" className="mt-16 space-y-6">
  <h3 className="text-xl font-semibold">The Crew</h3>

  {loadingCrew ? (
    <p className="text-white/50 text-sm">Načítám tým...</p>
  ) : crewMembers.length === 0 ? (
    <p className="text-white/50 text-sm">Zatím žádní členové týmu.</p>
  ) : (
    <div className="grid gap-6 md:grid-cols-3">
      {crewMembers.map((m) => (
        <div
          key={m.id}
          className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-fuchsia-400/50 transition"
        >
          {m.photo && (
            <img
              src={m.photo}
              alt={m.name}
              className="h-24 w-24 mx-auto rounded-full border border-white/20 object-cover"
            />
          )}
          <p className="mt-3 font-semibold text-white">{m.name}</p>
          <p className="text-sm text-fuchsia-300">{m.role}</p>
          <p className="mt-2 text-sm text-white/70">{m.desc}</p>
        </div>
      ))}
    </div>
  )}
</section>


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
                  onClick={() => setSelectedImage(img.url)}
                  className="cursor-pointer rounded-2xl border border-white/10 object-cover h-40 w-full hover:scale-[1.03] hover:border-fuchsia-400/50 transition"
                />
              ))}
            </div>
          )}

          {/* === LIGHTBOX === */}
          {selectedImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            >
              <img
                src={selectedImage}
                alt="Zvětšená fotka"
                className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl border border-white/10"
              />
              <button
                className="absolute top-6 right-6 text-white/80 hover:text-white text-2xl font-bold"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
          )}
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

     {/* === SOCIAL CTA === */}
<section id="social" className="mt-16 text-center">
  <h3 className="text-2xl font-bold text-white">Sleduj nás</h3>
  <p className="mt-2 text-white/70">
    Nové akce, momentky a zákulisí každý týden. Přidej se k nám na sítích!
  </p>

  <div className="mt-6 flex justify-center gap-5">
    {/* Instagram */}
    <a
      href="https://instagram.com/poznejahraj"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="group relative grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 transition-all hover:shadow-[0_0_30px_rgba(236,72,153,0.45)] hover:border-fuchsia-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="w-6 h-6 text-white/80 group-hover:text-fuchsia-400 transition-colors"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <circle cx="17.5" cy="6.5" r="0.5" />
      </svg>
    </a>

    {/* Facebook */}
    <a
      href="https://facebook.com/poznejahraj"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Facebook"
      className="group relative grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.45)] hover:border-violet-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.6"
        className="w-6 h-6 text-white/80 group-hover:text-violet-400 transition-colors"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.197 21V12H6v-3.5h3.197V6.174C9.197 3.004 10.982 2 13.694 2c1.239 0 2.303.09 2.614.132v3.033h-1.796c-1.41 0-1.682.668-1.682 1.649V8.5H16L15.5 12h-2.67v9H9.197z"
        />
      </svg>
    </a>
  </div>
</section>
{detailEvent && (
  <EventDetailModal
    event={detailEvent}
    onClose={() => setDetailEvent(null)}
    onReserve={() => {
      setSelectedEvent(detailEvent);
      setDetailEvent(null);
    }}
  />
)}
       
{/* === FOOTER === */}
<footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-white/60">
  © {new Date().getFullYear()} Poznej &amp; Hraj · Těšíme se na další společnou hru!
</footer>

      </div>
    </div>
  );
}







