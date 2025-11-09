import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import { motion } from 'framer-motion';
import { FaFacebookF, FaInstagram, FaPlay } from 'react-icons/fa';

const particleOptions = {
  fullScreen: { enable: false },
  background: { color: 'transparent' },
  particles: {
    number: { value: 45 },
    color: { value: ['#8b5cf6', '#00e5a8', '#38bdf8'] },
    opacity: { value: { min: 0.1, max: 0.4 } },
    size: { value: { min: 1, max: 4 } },
    move: { enable: true, speed: 1.4 },
    links: { enable: true, distance: 140, color: '#ffffff', opacity: 0.12, width: 1 },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'repulse' },
      resize: true,
    },
    modes: {
      repulse: { distance: 120 },
    },
  },
};

export default function HeroSection({ heroTags = [], onReserve }) {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#0a1020] to-[#0b1528] p-10 shadow-2xl shadow-black/40">
      <Particles init={particlesInit} options={particleOptions} className="pointer-events-none absolute inset-0" />
      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-6"
        >
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
            <motion.button
              type="button"
              onClick={onReserve}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#6f7df6] to-[#00e5a8] px-7 py-3 text-lg font-semibold text-[#071022] shadow-[0_12px_30px_rgba(107,240,193,0.35)] transition-transform hover:-translate-y-1"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
            >
              Rezervovat místo
            </motion.button>
            <div className="flex items-center gap-4 text-white/70">
              <a
                href="https://www.instagram.com/poznejahraj"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg transition-transform hover:-translate-y-1 hover:text-white"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg transition-transform hover:-translate-y-1 hover:text-white"
              >
                <FaFacebookF />
              </a>
              <span className="flex items-center gap-2 text-sm">
                <FaPlay className="text-a2" />
                Sleduj momentky @poznejahraj
              </span>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-a1/20 via-transparent to-a2/30 opacity-70" aria-hidden="true" />
          <iframe
            title="Promo video"
            src="https://www.youtube.com/embed/5jK8L3j4Z_4"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="relative aspect-video w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
