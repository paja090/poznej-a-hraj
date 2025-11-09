import { useState } from 'react';
import { sendFeedback } from '../services/feedback.js';

const initialForm = {
  name: '',
  email: '',
  message: '',
};

export default function FeedbackForm() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.message) {
      setError('Vyplň prosím e-mail i zprávu.');
      return;
    }

    setLoading(true);
    try {
      await sendFeedback(form, file);
      setSuccess(true);
      setForm(initialForm);
      setFile(null);
      event.target.reset();
    } catch (err) {
      setError(err.message || 'Odeslání se nezdařilo. Zkus to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Jméno
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tvoje jméno"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          E-mail
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="tvuj@email.cz"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-white/70">
        Zpráva
        <textarea
          required
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Sem napiš svou zprávu, nápad nebo zpětnou vazbu..."
          rows={4}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white/70">
        Přilož fotku (volitelné)
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-base text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-a1 file:to-a2 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#071022]"
        />
      </label>
      <div className="flex flex-col gap-3 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        <span>Raději e‑mail? Napiš na <a className="text-a2 underline" href="mailto:poznejahraj@seznam.cz">poznejahraj@seznam.cz</a></span>
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Odesílání…' : 'Odeslat zprávu'}
        </button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {success && <p className="rounded-xl border border-a2/40 bg-a2/10 px-4 py-3 text-sm text-a2">Děkujeme za zpětnou vazbu!</p>}
    </form>
  );
}
