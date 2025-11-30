import { useState } from 'react';

const defaultForm = {
  name: '',
  rating: '5',
  message: '',
};

export default function ReviewForm({ onSubmit, disabled }) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!form.message.trim()) {
      setError('Napiš prosím krátkou recenzi.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim() || 'Anonym',
        rating: Number(form.rating) || 5,
        message: form.message.trim(),
      });
      setForm(defaultForm);
      setStatus('Díky! Recenze je uložená, po schválení se zobrazí na webu.');
    } catch (err) {
      setError(err.message || 'Recenzi se nepodařilo odeslat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Jméno (volitelné)
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tvoje jméno"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/70">
          Hodnocení
          <select
            name="rating"
            value={form.rating}
            onChange={handleChange}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
          >
            <option value="5">⭐⭐⭐⭐⭐</option>
            <option value="4">⭐⭐⭐⭐</option>
            <option value="3">⭐⭐⭐</option>
            <option value="2">⭐⭐</option>
            <option value="1">⭐</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-white/70">
        Recenze
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={4}
          placeholder="Jaký byl tvůj večer Réboos?"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
          required
        />
      </label>
      <div className="flex flex-col gap-3 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        <span>Recenze se před zveřejněním schvalují, aby web zůstal bezpečný.</span>
        <button
          type="submit"
          disabled={disabled || submitting}
          className="bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Odesílám…' : 'Odeslat recenzi'}
        </button>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {status && <p className="rounded-xl border border-a2/40 bg-a2/10 px-4 py-3 text-sm text-a2">{status}</p>}
    </form>
  );
}
