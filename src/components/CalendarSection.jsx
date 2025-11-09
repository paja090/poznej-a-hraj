import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { ensureDate } from '../utils/datetime.js';

function formatLong(date) {
  return date.toLocaleString('cs-CZ', { weekday: 'short', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export default function CalendarSection({ events = [], onSelectEvent }) {
  const upcoming = events
    .map((event) => ({ ...event, startDate: ensureDate(event.startDate) }))
    .filter((event) => !event.startDate || event.startDate >= new Date())
    .sort((a, b) => {
      const aTime = a.startDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.startDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  return (
    <motion.section
      id="calendar"
      className="card relative overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-bl from-a1/20 via-transparent to-a2/20 opacity-70" aria-hidden="true" />
      <div className="relative space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-sm uppercase tracking-[0.4em] text-white/40">Kalendář</span>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Plánované herní večery</h2>
          </div>
          <p className="text-sm text-white/60">
            Vyber akci, která tě nejvíc láká. Kapacity se mění podle aktuálních rezervací, proto doporučujeme rezervovat co nejdřív.
          </p>
        </header>
        <div className="grid gap-5 lg:grid-cols-2">
          {upcoming.map((event, index) => (
            <motion.article
              key={event.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass transition-transform hover:-translate-y-1"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-a2/20 opacity-70" aria-hidden="true" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <FaCalendarAlt className="text-a2" />
                  <span>{event.startDate ? formatLong(event.startDate) : 'Datum bude brzy'}</span>
                </div>
                <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                {event.description && <p className="text-sm text-white/65">{event.description}</p>}
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                  {event.place && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                      <FaMapMarkerAlt className="text-a2" />
                      {event.place}
                    </span>
                  )}
                  {typeof event.capacity === 'number' && (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                      Kapacita: {event.capacity}
                    </span>
                  )}
                  {event.price != null && (
                    <span className="rounded-full border border-a2/30 bg-a2/10 px-3 py-1 text-a2 font-semibold">{event.price} Kč</span>
                  )}
                </div>
                {!!event.tags?.length && (
                  <div className="flex flex-wrap gap-2 text-xs text-white/60">
                    {event.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onSelectEvent?.(event.id)}
                  className="self-start rounded-full bg-gradient-to-r from-a1 to-a2 px-5 py-2 text-sm font-semibold text-[#071022] shadow-[0_12px_24px_rgba(0,229,168,0.25)] transition-transform hover:-translate-y-1"
                >
                  Rezervovat
                </button>
              </div>
            </motion.article>
          ))}
          {!upcoming.length && <p className="text-sm text-white/60">Žádné naplánované akce. Sleduj nás pro další termíny!</p>}
        </div>
      </div>
    </motion.section>
  );
}
