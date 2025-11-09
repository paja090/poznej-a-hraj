import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';

export default function CommunityBoard({ messages = [], onSubmit, isOnline }) {
  const [form, setForm] = useState({ name: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit?.({ ...form });
      setForm({ name: '', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      id="board"
      className="card relative overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-a1/20 via-transparent to-a2/20 opacity-70" aria-hidden="true" />
      <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <header className="space-y-2">
            <span className="text-sm uppercase tracking-[0.4em] text-white/40">Komunitní nástěnka</span>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Pozdravy, tipy a domluvy na další akce</h2>
            <p className="text-sm text-white/60">
              Napiš krátký vzkaz komunitě. {isOnline ? 'Příspěvky se okamžitě zobrazí všem přihlášeným.' : 'V demo režimu se zprávy ukládají lokálně.'}
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Jméno (volitelné)
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Přezdívka nebo jméno"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a2 focus:outline-none focus:ring-2 focus:ring-a2/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Zpráva
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Domluv se na společném týmu nebo se poděl o zážitek."
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a2 focus:outline-none focus:ring-2 focus:ring-a2/40"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-a1 to-a2 px-6 py-3 text-sm font-semibold text-[#071022] shadow-[0_12px_24px_rgba(0,229,168,0.25)] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPaperPlane />
              {submitting ? 'Odesílám…' : 'Poslat zprávu'}
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <motion.article
              key={message.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/75"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                <span>{message.name || 'Host komunity'}</span>
                {message.createdAt && <span>{new Date(message.createdAt).toLocaleDateString('cs-CZ')}</span>}
              </div>
              <p className="mt-3 text-base text-white">{message.message}</p>
            </motion.article>
          ))}
          {!messages.length && <p className="text-sm text-white/60">Zatím žádné vzkazy. Buď první, kdo se ozve!</p>}
        </div>
      </div>
    </motion.section>
  );
}
