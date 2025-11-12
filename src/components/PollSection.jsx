import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function PollSection() {
  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [voted, setVoted] = useState(false);

  // Načti aktivní anketu + její možnosti
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snap) => {
      const polls = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const active = polls.find((p) => p.active === true);
      setPoll(active || null);

      if (active) {
        const optRef = collection(db, "polls", active.id, "options");
        onSnapshot(optRef, (s) => {
          setOptions(s.docs.map((o) => ({ id: o.id, ...o.data() })));
        });
      } else {
        setOptions([]);
      }
    });
    return () => unsub();
  }, []);

  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);

  const handleVote = async (optionId) => {
    if (!poll || voted) return;
    const optRef = doc(db, "polls", poll.id, "options", optionId);
    await updateDoc(optRef, { votes: increment(1) });
    setVoted(true);
  };

  if (!poll) {
    return (
      <section id="poll" className="mt-16 text-center text-white/70">
        <h3 className="text-xl font-semibold mb-2">Anketa</h3>
        <p>Momentálně není aktivní žádná anketa.</p>
      </section>
    );
  }

  return (
    <section id="poll" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">
        🗳️ {poll.title}
      </h3>
      {poll.description && (
        <p className="text-sm text-white/60">{poll.description}</p>
      )}

      <div className="grid gap-4">
        {options.map((opt) => {
          const ratio = totalVotes
            ? Math.round((opt.votes / totalVotes) * 100)
            : 0;
          return (
            <div
              key={opt.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-400/40 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{opt.title}</p>
                  <p className="text-sm text-white/60">{opt.votes} hlasů</p>
                </div>
                <button
                  disabled={voted}
                  onClick={() => handleVote(opt.id)}
                  className={`px-4 py-1 rounded-full text-sm font-medium ${
                    voted
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 text-[#071022]"
                  }`}
                >
                  {voted ? "✅ Hlasováno" : "Hlasovat"}
                </button>
              </div>
              <div className="mt-3 h-2 w-full bg-white/10 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 rounded-full"
                  style={{ width: `${ratio}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/60">{ratio}% hlasů</p>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-white/50 mt-2 text-center">
        Celkem hlasů: {totalVotes}
      </p>
    </section>
  );
}


