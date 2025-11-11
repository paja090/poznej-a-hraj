import FeedbackForm from "./components/FeedbackForm.jsx";

// === DATA ===
const heroTags = ["🎮 Herní turnaje", "🎤 Live moderátoři", "📸 Foto koutek", "💬 Seznamování"];

const upcomingEvents = [
  {
    id: "e1",
    title: "Večer her & speed-fun",
    when: "20. 11. 2025 · 19:00",
    place: "Klub Orion, Praha",
    description: "Hry, výzvy a poznávání se v bezpečné atmosféře.",
    capacity: 24,
    available: 6,
    price: 150,
  },
  {
    id: "e2",
    title: "Beer & Quiz Night",
    when: "27. 11. 2025 · 19:30",
    place: "Bar Neon, Brno",
    description: "Týmové kvízy, craft pivo a networking bez nudy.",
    capacity: 20,
    available: 2,
    price: null,
  },
];

const pastEvents = [
  {
    id: "p1",
    title: "Retro Opening Party",
    when: "10. 10. 2025 · 20:00",
    place: "Start Klub",
    description: "Pilotní večer — atmosféra, na kterou se nezapomíná.",
  },
];

const galleryImages = [
  "https://picsum.photos/seed/party01/800/533",
  "https://picsum.photos/seed/party02/800/533",
  "https://picsum.photos/seed/party03/800/533",
];

const stats = [
  { label: "naplánovaných akcí", value: "2" },
  { label: "předešlých akcí", value: "12" },
  { label: "účastníků celkem", value: "420" },
  { label: "recenzí", value: "94" },
];

const pollOptions = [
  { title: "Retro Night", description: "80s & 90s", votes: 6 },
  { title: "Beer & Quiz", description: "kvízy + pivo", votes: 9 },
  { title: "Hookah & Chill", description: "vodní dýmka & chill", votes: 4 },
];

const crew = [
  {
    name: "Marek",
    role: "Moderátor her",
    description: "Připravuje výzvy a dělá atmosféru.",
    photo: "https://i.pravatar.cc/200?img=12",
  },
  {
    name: "Petra",
    role: "Koordinátorka zábavy",
    description: "Propojuje hosty a hlídá flow večera.",
    photo: "https://i.pravatar.cc/200?img=47",
  },
  {
    name: "Tomáš",
    role: "DJ & Tech",
    description: "Hudba, světla a technika vyladěná na party.",
    photo: "https://i.pravatar.cc/200?img=33",
  },
];

// === DÍLČÍ KOMPONENTY ===
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-glass backdrop-blur">
      <div className="text-3xl font-extrabold text-a2">{value}</div>
      <div className="mt-2 text-sm text-white/70">{label}</div>
    </div>
  );
}

function EventCard({ event, variant = "upcoming" }) {
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
        <span className="pill">📅 {event.when}</span>
        <span className="pill">📍 {event.place}</span>
        {"capacity" in event && <span className="pill">Kapacita: {event.capacity}</span>}
        {"available" in event && <span className="pill text-a2">Volná místa: {event.available}</span>}
        {"price" in event && event.price && <span className="pill text-[#b4ffd9]">💳 {event.price} Kč</span>}
      </div>
      {variant === "upcoming" && (
        <button
          type="button"
          className="self-start rounded-xl border border-white/20 px-4 py-2 text-sm text-a1 transition hover:border-a1/80 hover:text-white"
        >
          Rezervovat
        </button>
      )}
    </article>
  );
}

function PollOption({ option }) {
  const totalVotes = pollOptions.reduce((sum, item) => sum + item.votes, 0);
  const ratio = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{option.title}</p>
          <p className="text-sm text-white/60">{option.description}</p>
        </div>
        <span className="text-sm font-semibold text-a2">{option.votes} hlasů</span>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-a1 to-a2" style={{ width: `${ratio}%` }} />
      </div>
      <p className="mt-2 text-xs text-white/60">{ratio}% hlasů</p>
    </div>
  );
}

// === HLAVNÍ KOMPONENTA ===
export default function PublicApp() {
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

        {/* --- sem patří zbytek tvého obsahu (sekce about, stats, events, gallery, poll, crew, feedback atd.) --- */}

        <section id="feedback" className="card mt-12">
          <h3 className="text-xl font-semibold mb-2">Chceš, abychom uspořádali večer i pro tebe?</h3>
          <p className="text-sm text-white/70 mb-6">
            Máš nápad, přání nebo zpětnou vazbu? Napiš nám – připravíme program na míru a rádi si poslechneme tvůj názor.
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

