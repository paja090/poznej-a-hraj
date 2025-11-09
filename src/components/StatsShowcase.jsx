import { motion, useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function AnimatedNumber({ value }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, Number(value || 0), {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <span ref={ref} className="text-4xl font-bold text-a2 drop-shadow-[0_0_14px_rgba(0,229,168,0.35)]">
      {displayValue}
    </span>
  );
}

export default function StatsShowcase({ stats = [] }) {
  return (
    <motion.section
      id="stats"
      className="card relative overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30" aria-hidden="true" />
      <div className="relative flex flex-col gap-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">Místa máme aktuálně…</p>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Co se děje v komunitě Poznej &amp; Hraj</h2>
          </div>
          <p className="text-sm text-white/60">
            Čísla se aktualizují v reálném čase podle rezervací, recenzí a aktivity komunity.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ id, label, value, icon: Icon, accent }) => (
            <motion.article
              key={id}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-a1/20 via-transparent to-a2/30 opacity-60" aria-hidden="true" />
              <div className="relative flex items-start gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-3xl text-a2 shadow-xl"
                  style={{ boxShadow: '0 10px 30px rgba(0, 229, 168, 0.25)' }}
                >
                  {Icon ? <Icon /> : <span>{accent ?? '🎲'}</span>}
                </div>
                <div className="flex flex-col">
                  <AnimatedNumber value={value} />
                  <span className="mt-1 text-sm font-medium text-white/70">{label}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
