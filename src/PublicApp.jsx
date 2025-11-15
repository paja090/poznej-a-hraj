// src/PublicApp.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, getDocs, doc } from "firebase/firestore";
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

function EventCard({ event, onReserve, onDetail, variant = "upcoming" }) {
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
        onClick={() => onDetail(event)}
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

export default function PublicApp() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);

  const [stats, setStats] = useState({
    events: 0,
    past: 0,
    attendees: 0,
    reviews: 0,
  });

  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const [crewMembers, setCrewMembers] = useState([]);
  const [loadingCrew, setLoadingCrew] = useState(true);

  const [reviews, setReviews] = useState([]);

  const [content, setContent] = useState({
    heroTitle: "",
    heroSubtitle: "",
    aboutIntro: "",
    aboutBody: "",
  });

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

  // === Smooth scroll pomocná funkce ===
  const scrollToId = (id) => {
    const target = document.querySelector(id);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  // === HERO + ABOUT z Firestore (settings/publicContent) ===
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "publicContent"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setContent({
          heroTitle: data.heroTitle || "",
          heroSubtitle: data.heroSubtitle || "",
          aboutIntro: data.aboutIntro || "",
          aboutBody: data.aboutBody || "",
        });
      }
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

  // === REZERVACE (obsazenost + počet účastníků) ===
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), (snap) => {
      const reservations = snap.docs.map((doc) => doc.data());

      setUpcoming((prev) =>
        prev.map((event) => {
          const count = reservations.filter((r) => r.eventTitle === event.title).length;
          return {
            ...event,
            available:
              typeof event.capacity === "number"
                ? Math.max(event.capacity - count, 0)
                : event.available,
          };
        })
      );

      setStats((s) => ({ ...s, attendees: snap.size }));
    });

    return () => unsub();
  }, []);

  // === RECENZE ===
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReviews(all.filter((r) => r.approved));
      setStats((s) => ({ ...s, reviews: all.length }));
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
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(124,58,237,0.25),transparent_60%),radial-gradient(40%_40%_at_80%_20%,rgba(236,72,153,0.15),transparent_60%)]" />

      <div className="mx-auto max-w-6xl px-4 pb-24">
        {/* === HLAVIČKA === */}
      
<header className="sticky top-0 z-50 backdrop-blur-xl bg-[#05060a]/70 border-b border-fuchsia-500/20 shadow-[0_0_25px_rgba(236,72,153,0.25)]">

  <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-3 max-w-6xl mx-auto">

    {/* Logo s neon pulzem */}
    <div className="flex justify-center md:justify-start w-full md:w-auto">
     <img
  src="/rebuss.png"
  alt="Reboos Logo"
  className="h-32 w-auto object-contain animate-bulb-glow transition-transform duration-300 hover:scale-105"
/>
    </div>

    {/* Navigace */}
    <nav className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm shadow-md backdrop-blur">
      <ul className="flex items-center gap-4 text-white/70">
        <li><button onClick={() => scrollToId("#events")} className="hover:text-white">Akce</button></li>
        <li><button onClick={() => scrollToId("#stats")} className="hover:text-white">Statistiky</button></li>
        <li><button onClick={() => scrollToId("#poll")} className="hover:text-white">Anketa</button></li>
        <li><button onClick={() => scrollToId("#crew")} className="hover:text-white">Tým</button></li>
        <li><button onClick={() => scrollToId("#reviews")} className="hover:text-white">Recenze</button></li>
        <li><button onClick={() => scrollToId("#feedback")} className="hover:text-white">Kontakt</button></li>
      </ul>
    </nav>

  </div>

  {/* Svítící spodní linka */}
  <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 opacity-60 shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>

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
            <h2 className="text-4xl font-extrabold leading-tight">
              {content.heroTitle || "Místo, kde se lidé potkávají přirozeně"}
            </h2>

            <p className="mt-4 text-lg text-white/80">
              {content.heroSubtitle || "Večery plné her, kvízů a nových přátel."}
            </p>
          </div>
        </section>

        {/* === ABOUT === */}
        <section id="about" className="card mt-10">
          <h3 className="text-xl font-semibold text-white">O projektu</h3>
          <p className="mt-4 text-white/70">
            {content.aboutIntro ||
              "Poznej & Hraj vzniklo z touhy spojovat lidi jinak — ne přes aplikace, ale skrze zážitky, hry a skutečné emoce."}
          </p>
          <p className="mt-4 text-white/70">
            {content.aboutBody ||
              "Každý večer má svůj příběh, atmosféru a moderátory, kteří pomáhají, aby se každý cítil vítaný."}
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
            <h3 className="mb-3 text-xl font-semibold">Nadcházející akce</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              {upcoming.length ? (
                upcoming.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onReserve={setSelectedEvent}
                    onDetail={setDetailEvent}
                  />
                ))
              ) : (
                <p className="text-white/60">Žádné plánované akce.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xl font-semibold">Předešlé akce</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              {past.length ? (
                past.map((e) => (
                  <EventCard key={e.id} event={e} variant="past" onDetail={setDetailEvent} />
                ))
              ) : (
                <p className="text-white/60">Zatím žádné proběhlé akce.</p>
              )}
            </div>
          </div>
        </section>

        {/* === ANKETA === */}
        <PollSection />

        {/* === CREW === */}
        <section id="crew" className="mt-16 space-y-6">
          <h3 className="text-xl font-semibold">The Crew</h3>

          {loadingCrew ? (
            <p className="text-sm text-white/50">Načítám tým...</p>
          ) : crewMembers.length === 0 ? (
            <p className="text-sm text-white/50">Zatím žádní členové týmu.</p>
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
                      className="mx-auto h-24 w-24 rounded-full border border-white/20 object-cover"
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
            <p className="text-sm text-white/50">Načítám galerii...</p>
          ) : gallery.length === 0 ? (
            <p className="text-sm text-white/50">Zatím žádné fotky.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {gallery.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt={img.name || "Momentka"}
                  onClick={() => setSelectedImage(img.url)}
                  className="h-40 w-full cursor-pointer rounded-2xl border border-white/10 object-cover transition hover:scale-[1.03] hover:border-fuchsia-400/50"
                />
              ))}
            </div>
          )}

          {/* LIGHTBOX */}
          {selectedImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            >
              <img
                src={selectedImage}
                alt="Zvětšená fotka"
                className="max-h-[85vh] max-w-[90vw] rounded-xl border border-white/10 shadow-2xl"
              />
              <button
                className="absolute right-6 top-6 text-2xl font-bold text-white/80 hover:text-white"
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
          {reviews.length === 0 ? (
            <p className="text-sm text-white/60">Zatím žádné recenze – těšíme se na první!</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-400/50 transition"
                >
                  <p className="mb-2 text-white/80">„{r.message}“</p>
                  <p className="text-sm font-semibold text-fuchsia-300">— {r.name}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* === FEEDBACK === */}
        <section id="feedback" className="mt-16">
          <h3 className="mb-2 text-xl font-semibold">
            Chceš, abychom uspořádali večer i pro tebe?
          </h3>
          <p className="mb-6 text-sm text-white/70">
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
            <a
              href="https://instagram.com/poznejahraj"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="group relative grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 transition-all hover:border-fuchsia-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.45)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-6 w-6 text-white/80 transition-colors group-hover:text-fuchsia-400"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <circle cx="17.5" cy="6.5" r="0.5" />
              </svg>
            </a>

            <a
              href="https://facebook.com/poznejahraj"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="group relative grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 transition-all hover:border-violet-400 hover:shadow-[0_0_30px_rgba(124,58,237,0.45)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-6 w-6 text-white/80 transition-colors group-hover:text-violet-400"
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

        {/* DETAIL EVENTU MODÁL */}
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

        {/* FOOTER */}
        <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Poznej &amp; Hraj · Těšíme se na další společnou hru!
        </footer>
      </div>
    </div>
  );
}









