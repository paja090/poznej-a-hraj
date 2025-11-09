import Reveal from './Reveal.jsx';

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.75a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 22V12h3l1-4h-4V6a1 1 0 011-1h3V1h-3a5 5 0 00-5 5v2H6v4h3v10h4z" />
    </svg>
  );
}

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  );
}

export default function HeroSection({ heroTags = [], onReserve }) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#0a1020] to-[#0b1528] p-10 shadow-2xl shadow-black/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.2),_transparent_60%),radial-gradient(circle_at_bottom_right,_rgba(0,229,168,0.18),_transparent_55%)]" aria-hidden="true" />
      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <Reveal as="div" className="flex flex-col gap-6" offset={40} duration={0.7} margin="-80px">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/70 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-a2 shadow-[0_0_12px_rgba(0,229,168,0.6)]" />
            Večery plné her a nových přátel
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-[0_0_25px_rgba(139,92,246,0.45)] md:text-5xl">
              Místo, kde se lidé potkávají přirozeně
            </h1>
            <p className="max-w-xl text-lg text-white/70 md:text-xl">
              Večery plné her, kvízů a nových přátel. Žádné trapné ticho – jen herní výzvy, které propojí úplně každého.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {heroTags.map((tag) => (
              <span key={tag.id} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
                {tag.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={onReserve}
              className="cta-pulse inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#6f7df6] to-[#00e5a8] px-7 py-3 text-lg font-semibold text-[#071022] shadow-[0_12px_30px_rgba(107,240,193,0.35)] transition-transform hover:-translate-y-1"
            >
              Rezervovat místo
            </button>
            <div className="flex items-center gap-4 text-white/70">
              <a
                href="https://www.instagram.com/poznejahraj"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg transition-transform hover:-translate-y-1 hover:text-white"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg transition-transform hover:-translate-y-1 hover:text-white"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <span className="flex items-center gap-2 text-sm">
                <PlayIcon className="h-3 w-3 text-a2" />
                Sleduj momentky @poznejahraj
              </span>
            </div>
          </div>
        </Reveal>
        <Reveal as="div" className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl" offset={20} fromScale={0.9} duration={0.8} margin="-80px">
          <div className="absolute inset-0 bg-gradient-to-tr from-a1/20 via-transparent to-a2/30 opacity-70" aria-hidden="true" />
          <iframe
            title="Promo video"
            src="https://www.youtube.com/embed/5jK8L3j4Z_4"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="relative aspect-video w-full"
          />
        </Reveal>
      </div>
    </section>
  );
}
