import { useState } from "react";

const initialPoll = [
  { title: "Retro Night", description: "80s & 90s", votes: 6 },
  { title: "Beer & Quiz", description: "kvízy + pivo", votes: 9 },
  { title: "Hookah & Chill", description: "vodní dýmka & chill", votes: 4 },
];

export default function PollSection() {
  const [options, setOptions] = useState(initialPoll);
  const [voted, setVoted] = useState(false);

  const handleVote = (index) => {
    if (voted) return;
    const newPoll = [...options];
    newPoll[index].votes += 1;
    setOptions(newPoll);
    setVoted(true);
  };

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <section id="poll" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">Anketa: Téma příštího večera</h3>
      <p className="text-sm text-white/60">Hlasuj, co bys chtěl(a) zažít příště 👇</p>
      <div className="grid gap-4">
        {options.map((opt, i) => {
          const ratio = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <div
              key={opt.title}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-a1/50 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{opt.title}</p>
                  <p className="text-sm text-white/60">{opt.description}</p>
                </div>
                <button
                  disabled={voted}
                  onClick={() => handleVote(i)}
                  className={`px-4 py-1 rounded-full text-sm font-medium ${
                    voted ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-a1 to-a2 text-[#071022]"
                  }`}
                >
                  {voted ? "✅ Hlasováno" : "Hlasovat"}
                </button>
              </div>
              <div className="mt-3 h-2 w-full bg-white/10 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-a1 to-a2 rounded-full"
                  style={{ width: `${ratio}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/60">{ratio}% hlasů</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
import { useState } from "react";

const initialPoll = [
  { title: "Retro Night", description: "80s & 90s", votes: 6 },
  { title: "Beer & Quiz", description: "kvízy + pivo", votes: 9 },
  { title: "Hookah & Chill", description: "vodní dýmka & chill", votes: 4 },
];

export default function PollSection() {
  const [options, setOptions] = useState(initialPoll);
  const [voted, setVoted] = useState(false);

  const handleVote = (index) => {
    if (voted) return;
    const newPoll = [...options];
    newPoll[index].votes += 1;
    setOptions(newPoll);
    setVoted(true);
  };

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <section id="poll" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">Anketa: Téma příštího večera</h3>
      <p className="text-sm text-white/60">Hlasuj, co bys chtěl(a) zažít příště 👇</p>
      <div className="grid gap-4">
        {options.map((opt, i) => {
          const ratio = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <div
              key={opt.title}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-a1/50 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{opt.title}</p>
                  <p className="text-sm text-white/60">{opt.description}</p>
                </div>
                <button
                  disabled={voted}
                  onClick={() => handleVote(i)}
                  className={`px-4 py-1 rounded-full text-sm font-medium ${
                    voted ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-a1 to-a2 text-[#071022]"
                  }`}
                >
                  {voted ? "✅ Hlasováno" : "Hlasovat"}
                </button>
              </div>
              <div className="mt-3 h-2 w-full bg-white/10 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-a1 to-a2 rounded-full"
                  style={{ width: `${ratio}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/60">{ratio}% hlasů</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

