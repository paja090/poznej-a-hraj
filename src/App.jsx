import FeedbackForm from './components/FeedbackForm.jsx';

const heroTags = ['🎮 Herní turnaje', '🎤 Live moderátoři', '📸 Foto koutek', '💬 Seznamování'];

const upcomingEvents = [
  {
    id: 'e1',
    title: 'Večer her & speed-fun',
    when: '20. 11. 2025 · 19:00',
    place: 'Klub Orion, Praha',
    description: 'Hry, výzvy a poznávání se v bezpečné atmosféře.',
    capacity: 24,
    available: 6,
    price: 150,
  },
  {
    id: 'e2',
    title: 'Beer & Quiz Night',
    when: '27. 11. 2025 · 19:30',
    place: 'Bar Neon, Brno',
    description: 'Týmové kvízy, craft pivo a networking bez nudy.',
    capacity: 20,
    available: 2,
    price: null,
  },
];

const pastEvents = [
  {
    id: 'p1',
    title: 'Retro Opening Party',
    when: '10. 10. 2025 · 20:00',
    place: 'Start Klub',
    description: 'Pilotní večer — atmosféra, na kterou se nezapomíná.',
  },
];

const galleryImages = [
  'https://picsum.photos/seed/party01/800/533',
  'https://picsum.photos/seed/party02/800/533',
  'https://picsum.photos/seed/party03/800/533',
  'https://picsum.photos/seed/party04/800/533',
  'https://picsum.photos/seed/party05/800/533',
  'https://picsum.photos/seed/party06/800/533',
];

const stats = [
  { label: 'naplánovaných akcí', value: '2' },
  { label: 'předešlých akcí', value: '12' },
  { label: 'účastníků celkem', value: '420' },
  { label: 'recenzí', value: '94' },
];

const pollOptions = [
  { title: 'Retro Night', description: '80s & 90s', votes: 6 },
  { title: 'Beer & Quiz', description: 'kvízy + pivo', votes: 9 },
  { title: 'Hookah & Chill', description: 'vodní dýmka & chill', votes: 4 },
];

const crew = [
  {
    name: 'Marek',
    role: 'Moderátor her',
    description: 'Připravuje výzvy a dělá atmosféru.',
    photo: 'https://i.pravatar.cc/200?img=12',
  },
  {
    name: 'Petra',
    role: 'Koordinátorka zábavy',
    description: 'Propojuje hosty a hlídá flow večera.',
    photo: 'https://i.pravatar.cc/200?img=47',
  },
  {
    name: 'Tomáš',
    role: 'DJ & Tech',
    description: 'Hudba, světla a technika vyladěná na party.',
    photo: 'https://i.pravatar.cc/200?img=33',
  },
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-glass backdrop-blur">
      <div className="text-3xl font-extrabold text-a2">{value}</div>
      <div className="mt-2 text-sm text-white/70">{label}</div>
    </div>
  );
}

function EventCard({ event, variant = 'upcoming' }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-white/70">{event.description}</p>
        </div>
        <span className="rounded-full border border-a1/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-a1">
          {variant === 'upcoming' ? 'Nadcházející' : 'Archiv'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        <span className="pill">📅 {event.when}</span>
        <span className="pill">📍 {event.place}</span>
        {'capacity' in event && (
          <span className="pill">Kapacita: {event.capacity}</span>
        )}
        {'available' in event && (
          <span className="pill text-a2">Volná místa: {event.available}</span>
        )}
        {'price' in event && event.price && (
          <span className="pill text-[#b4ffd9]">💳 {event.price} Kč</span>
        )}
      </div>
      {variant === 'upcoming' && (
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

export default function App() {
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
          <nav className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm shadow-lg backdrop-blur">
            <ul className="flex flex-wrap items-center gap-3 text-white/70">
              <li><a className="hover:text-white" href="#about">O projektu</a></li>
              <li><a className="hover:text-white" href="#stats">Statistiky</a></li>
              <li><a className="hover:text-white" href="#events">Akce</a></li>
              <li><a className="hover:text-white" href="#gallery">Galerie</a></li>
              <li><a className="hover:text-white" href="#poll">Anketa</a></li>
              <li><a className="hover:text-white" href="#reviews">Recenze</a></li>
              <li><a className="hover:text-white" href="#crew">Crew</a></li>
            </ul>
          </nav>
        </header>

        <section className="hero-card" id="hero">
          <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-center">
            <div className="flex-1">
              <button
                type="button"
                className="mb-6 self-start rounded-full bg-gradient-to-r from-a1 to-a2 px-5 py-2 text-sm font-semibold text-[#071022] shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
              >
                Rezervuj místo 🔔 Kapacita se rychle plní
              </button>
              <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
                Místo, kde se lidé potkávají přirozeně
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Žádné trapné ticho. Hry, výzvy a soutěže jsou perfektní ledoborce. Organizujeme večery, na které se chceš vracet.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {heroTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:border-a1/50 hover:text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <a
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:-translate-y-1 hover:shadow-lg"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  📸
                </a>
                <a
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:-translate-y-1 hover:shadow-lg"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  📘
                </a>
                <p className="text-sm text-white/60">
                  Sleduj momentky a označ <strong>@poznejahraj</strong>
                </p>
              </div>
            </div>
            <div className="flex-1">
              <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
                <iframe
                  title="Promo video"
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/5jK8L3j4Z_4"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        <main className="mt-12 space-y-12">
          <section className="card" id="about">
            <h3 className="text-xl font-semibold text-white">O projektu</h3>
            <p className="mt-4 text-white/70">
              <strong className="text-white">Poznej &amp; Hraj</strong> vzniklo z touhy spojovat lidi jinak — ne přes aplikace, ale skrze zážitky, hry a skutečné emoce.
              Každý večer má svůj příběh, atmosféru a moderátory, kteří pomáhají, aby se každý cítil vítaný.
            </p>
            <p className="mt-4 text-white/70">
              Program vede tým moderátorů. Dáváme dohromady mix aktivit: kvízy, mini-hry, výzvy v týmech i úkoly pro dvojice.
              Díky řízenému programu se i introverti snadno zapojí a seznámení působí přirozeně.
            </p>
          </section>

          <section className="card" id="stats">
            <h3 className="text-xl font-semibold text-white">Naše akce v číslech</h3>
            <p className="mt-1 text-sm text-white/60">Aktualizované statistiky z posledních akcí</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </div>
          </section>

          <section className="card space-y-8" id="events">
            <div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Nadcházející akce</h3>
                  <p className="text-sm text-white/60">Vyber termín a rezervuj místo</p>
                </div>
                <span className="text-sm text-white/60">{upcomingEvents.length} akce</span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Předešlé akce</h3>
                  <p className="text-sm text-white/60">Fotodokumentace ke každé akci</p>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="past" />
                ))}
              </div>
            </div>
            <div className="space-y-4" id="gallery">
              <h3 className="text-xl font-semibold text-white">Naše momentky &amp; vaše #IG</h3>
              <p className="text-sm text-white/60">
                📸 Již brzy připojíme náš Instagram feed — sleduj nás na <strong>@poznejahraj</strong>.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {galleryImages.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt="Momentka z Poznej & Hraj"
                    className="h-40 w-full rounded-2xl border border-white/10 object-cover shadow-lg"
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <section className="card" id="poll">
              <h3 className="text-xl font-semibold text-white">Anketa: Téma příštího večera</h3>
              <p className="mt-1 text-sm text-white/60">Hlasuj, na co máš chuť příště.</p>
              <div className="mt-6 grid gap-4">
                {pollOptions.map((option) => (
                  <PollOption key={option.title} option={option} />
                ))}
              </div>
            </section>

            <section className="card" id="reviews">
              <h3 className="text-xl font-semibold text-white">Recenze</h3>
              <p className="mt-1 text-sm text-white/60">Co říkají účastníci</p>
              <ul className="mt-6 space-y-4 text-sm text-white/75">
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
                  „Skvěle připravené aktivity, poznala jsem úžasné lidi.“ — <span className="font-semibold">Anna</span>
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
                  „Program odsýpal a moderátoři byli k nezaplacení.“ — <span className="font-semibold">Jakub</span>
                </li>
              </ul>
            </section>
          </section>

          <section className="card" id="crew">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">The Crew</h3>
                <p className="text-sm text-white/60">Lidé, kteří za tím stojí</p>
              </div>
              <span className="text-sm text-white/60">{crew.length} členové</span>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {crew.map((member) => (
                <article
                  key={member.name}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-lg"
                >
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="h-24 w-24 rounded-full border border-white/20 object-cover shadow-lg"
                  />
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-sm text-a2">{member.role}</p>
                  </div>
                  <p className="text-sm text-white/70">{member.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card" id="feedback">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-a1/60 bg-a1/30 text-2xl">💬</div>
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
        </main>

        <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Poznej &amp; Hraj · Těšíme se na další společnou hru!
        </footer>
      </div>
    </div>
  );
}
