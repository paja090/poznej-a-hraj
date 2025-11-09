import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaRegStar, FaStar } from 'react-icons/fa';

function StarRating({ value, onChange, editable }) {
  return (
    <div className="flex items-center gap-1 text-xl text-a2">
      {[1, 2, 3, 4, 5].map((star) => {
        const Icon = star <= value ? FaStar : FaRegStar;
        return (
          <button
            key={star}
            type="button"
            onClick={() => editable && onChange?.(star)}
            className={`transition-transform ${editable ? 'hover:-translate-y-0.5' : 'cursor-default'}`}
          >
            <Icon className={star <= value ? 'drop-shadow-[0_0_12px_rgba(0,229,168,0.4)]' : 'text-white/40'} />
          </button>
        );
      })}
    </div>
  );
}

export default function EventRatings({ events = [], ratings = [], onSubmit, isOnline }) {
  const [form, setForm] = useState({ eventId: '', name: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const grouped = useMemo(() => {
    const map = new Map();
    ratings.forEach((rating) => {
      if (!rating.eventId) return;
      const bucket = map.get(rating.eventId) ?? [];
      bucket.push(rating);
      map.set(rating.eventId, bucket);
    });
    return map;
  }, [ratings]);

  const averages = useMemo(() => {
    return events.map((event) => {
      const collection = grouped.get(event.id) ?? [];
      const average = collection.length
        ? collection.reduce((sum, item) => sum + Number(item.rating || 0), 0) / collection.length
        : 0;
      return { event, average, collection };
    });
  }, [events, grouped]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.eventId || !form.comment) return;
    setSubmitting(true);
    try {
      await onSubmit?.({ ...form });
      setForm({ eventId: '', name: '', rating: 5, comment: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      id="ratings"
      className="card relative overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-a2/20 via-transparent to-a1/20 opacity-70" aria-hidden="true" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <header className="space-y-2">
            <span className="text-sm uppercase tracking-[0.4em] text-white/40">Hodnocení akcí</span>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Jak návštěvníci hodnotí poslední večery?</h2>
            <p className="text-sm text-white/60">
              Sečítáme hvězdičky z každé akce a pomáháme tak zlepšovat další edice. {isOnline ? 'Data čerpáme z Firestore.' : 'V demo režimu si můžeš hodnocení vyzkoušet lokálně.'}
            </p>
          </header>
          <div className="space-y-4">
            {averages.map(({ event, average, collection }) => (
              <motion.div
                key={event.id}
                className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <StarRating value={Math.round(average)} editable={false} />
                    <span>
                      {collection.length ? average.toFixed(1) : '–'} / 5 · {collection.length} hodnocení
                    </span>
                  </div>
                </div>
                {!!collection.length && (
                  <p className="text-sm text-white/60">„{collection[0].comment}“ — {collection[0].name || 'Anonym'}</p>
                )}
              </motion.div>
            ))}
            {!averages.length && <p className="text-sm text-white/50">Zatím bez hodnocení.</p>}
          </div>
        </div>
        <form className="space-y-4 rounded-3xl border border-white/10 bg-[#0c1424]/70 p-6 shadow-glass" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-white">Vyber akci</label>
            <select
              required
              value={form.eventId}
              onChange={(event) => setForm((prev) => ({ ...prev, eventId: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a2 focus:outline-none focus:ring-2 focus:ring-a2/40"
            >
              <option value="">— vyber akci —</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Jméno (volitelné)
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Tvoje jméno"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a2 focus:outline-none focus:ring-2 focus:ring-a2/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Hodnocení
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <StarRating
                  value={form.rating}
                  editable
                  onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
                />
              </div>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Komentář
            <textarea
              required
              rows={4}
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
              placeholder="Co se ti líbilo nebo co můžeme zlepšit?"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a2 focus:outline-none focus:ring-2 focus:ring-a2/40"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-to-r from-a1 to-a2 px-6 py-3 text-sm font-semibold text-[#071022] shadow-[0_12px_26px_rgba(0,229,168,0.3)] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Odesílám…' : 'Odeslat hodnocení'}
          </button>
        </form>
      </div>
    </motion.section>
  );
}
