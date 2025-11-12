import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  increment,
} from "firebase/firestore";

export default function PollSection() {
  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snap) => {
      const active = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((p) => p.active);
      setPoll(active || null);

      if (active) {
        const ref = collection(db, "polls", active.id, "options");
        onSnapshot(ref, (s) =>
          setOptions(s.docs.map((o) => ({ id: o.id, ...o.data() })))
        );
      } else {
        setOptions([]);
      }
    });
    return () => unsub();
  }, []);

  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);

  const vote = async (optionId) => {
    if (!poll || voted) return;
    const ref = doc(db, "polls", poll.id, "options", optionId);
    await updateDoc(ref, { votes: increment(1) });
    setVoted(true);
  };

  if (!poll) return null;

  return (
    <section id="poll" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">
        🗳️ {poll.title}
      </h3>
      {poll.description && (
        <p className="text-sm text-white/60">{poll.description}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((opt) => {
          const ratio = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <div
              key={opt.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-400/40 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{opt.title}</p>
                  <p className="text-sm text-white/60">{opt.votes} hlasů</p>
                </div>
                <button
                  disabled={voted}
                  onClick={() => vote(opt.id)}
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



