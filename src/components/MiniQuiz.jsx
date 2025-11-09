import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const questions = [
  {
    id: 'q1',
    question: 'Jaký je tvůj ideální začátek večera?',
    options: [
      { value: 3, label: 'Rychlé ice-breaker hry, ať to odsýpá.' },
      { value: 2, label: 'Něco kreativního – třeba společná výzva.' },
      { value: 1, label: 'Pomalý networking u drinku.' },
    ],
  },
  {
    id: 'q2',
    question: 'Jak se zapojuješ do soutěží?',
    options: [
      { value: 3, label: 'Jdu do toho naplno, chci vyhrát!' },
      { value: 2, label: 'Baví mě týmová spolupráce.' },
      { value: 1, label: 'Spíš fandím a užívám si atmosféru.' },
    ],
  },
  {
    id: 'q3',
    question: 'Jak vypadá tvůj ideální tým?',
    options: [
      { value: 3, label: 'Strategové, co milují logické hry.' },
      { value: 2, label: 'Směs introvertů a extrovertů.' },
      { value: 1, label: 'Kdokoliv – hlavně dobrá energie.' },
    ],
  },
  {
    id: 'q4',
    question: 'Když skončí hlavní program…',
    options: [
      { value: 3, label: 'Pokračuju v hrách nebo turnajích.' },
      { value: 2, label: 'Jdu tančit nebo na karaoke.' },
      { value: 1, label: 'Chilluju a povídám si dál.' },
    ],
  },
];

function resolveProfile(score) {
  if (score >= 11) {
    return {
      title: 'Strategický taktik',
      description: 'Miluješ výzvy, sbíráš body a baví tě promyšlené hry. Přijď na večer s turnaji a týmovým strategiemi.',
    };
  }
  if (score >= 8) {
    return {
      title: 'Společenský parťák',
      description: 'Baví tě být uprostřed dění, hledáš dobrou partu a chceš zkusit mix her, tance i kvízů.',
    };
  }
  return {
    title: 'Chill storyteller',
    description: 'Miluješ atmosféru a zajímavé rozhovory. Vyber si event s relax zónou a kreativními aktivitami.',
  };
}

export default function MiniQuiz({ onSubmit, results = [], isOnline }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [name, setName] = useState('');
  const completed = useMemo(() => Object.keys(answers).length === questions.length, [answers]);

  const handleSelect = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!completed) return;
    const total = Object.values(answers).reduce((sum, val) => sum + Number(val || 0), 0);
    const profile = resolveProfile(total);
    setSubmitting(true);
    try {
      await onSubmit?.({
        score: total,
        type: profile.title,
        answers,
        name,
      });
      setFeedback(profile);
      setAnswers({});
      setName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      id="quiz"
      className="card relative overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-a1/15 via-transparent to-a2/25 opacity-80" aria-hidden="true" />
      <div className="relative flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-sm uppercase tracking-[0.4em] text-white/40">Mini kvíz</span>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Jaký jsi typ hráče?</h2>
          <p className="text-sm text-white/60">
            Vyplň 4 krátké otázky a doporučíme ti ideální akci. Výsledky ukládáme {isOnline ? 'do Firestore' : 'lokálně pro ukázku'}.
          </p>
        </header>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Jméno (volitelné)
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tvoje jméno nebo přezdívka"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a2 focus:outline-none focus:ring-2 focus:ring-a2/40"
            />
          </label>
          {questions.map((item, index) => (
            <motion.fieldset
              key={item.id}
              className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <legend className="text-base font-semibold text-white">{item.question}</legend>
              <div className="grid gap-3 md:grid-cols-3">
                {item.options.map((option) => {
                  const isActive = Number(answers[item.id]) === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleSelect(item.id, option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left text-sm transition-all ${
                        isActive
                          ? 'border-a2/80 bg-a2/20 text-white shadow-[0_10px_30px_rgba(0,229,168,0.25)]'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-a2/40 hover:bg-a2/10 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </motion.fieldset>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-white/50">{isOnline ? 'Odpovědi ukládáme v reálném čase.' : 'Demo režim – odpovědi se ukládají pouze v rámci relace.'}</p>
            <button
              type="submit"
              disabled={!completed || submitting}
              className="rounded-full bg-gradient-to-r from-a1 to-a2 px-6 py-3 text-sm font-semibold text-[#071022] shadow-[0_12px_26px_rgba(139,92,246,0.35)] transition-transform disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-1"
            >
              {submitting ? 'Ukládám…' : 'Zobrazit výsledek'}
            </button>
          </div>
        </form>
        {feedback && (
          <div className="rounded-3xl border border-a2/40 bg-a2/10 p-6 text-white">
            <h3 className="text-xl font-semibold text-a2 drop-shadow-[0_0_14px_rgba(0,229,168,0.3)]">{feedback.title}</h3>
            <p className="mt-2 text-sm text-white/80">{feedback.description}</p>
          </div>
        )}
        {!!results.length && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white/80">Nejnovější výsledky komunity</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {results.slice(0, 4).map((result) => (
                <div key={result.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-semibold">{result.name || 'Anonym'}</span>
                    <span className="text-a2">{result.type}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/40">Skóre {result.score}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
