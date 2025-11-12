import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore";

export default function PollSection() {
  const [options, setOptions] = useState([]);
  const [voted, setVoted] = useState(localStorage.getItem("pollVoted") === "true");
  const [loading, setLoading] = useState(true);

  // 🔹 Načtení dat z Firestore
  useEffect(() => {
    const fetchPoll = async () => {
      const snapshot = await getDocs(collection(db, "poll"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOptions(data);
      setLoading(false);
    };
    fetchPoll();
  }, []);

  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);

  // 🔹 Odeslání hlasu
  const handleVote = async (id) => {
    if (voted) return alert("Už jsi hlasoval(a) – děkujeme! ❤️");
    const optionRef = doc(db, "poll", id);
    await updateDoc(optionRef, { votes: increment(1) });
    localStorage.setItem("pollVoted", "true");
    setVoted(true);

    // Obnovíme lokální zobrazení
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === id ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
      )
    );
  };

  if (loading)
    return (
      <section id="poll" className="card mt-16 text-center text-white/60">
        ⏳ Načítám anketu...
      </section>
    );

  return (
    <section id="poll" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">Anketa: Téma příštího večera</h3>
      <p className="text-sm text-white/60">
        Hlasuj, co bys chtěl(a) zažít příště 👇
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((opt) => {
          const ratio = totalVotes ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
          return (
            <div
              key={opt.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-400/40 transition"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold text-white">{opt.title}</p>
                  <p className="text-sm text-white/60">{opt.description}</p>
                </div>
                <button
                  onClick={() => handleVote(opt.id)}
                  disabled={voted}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                    voted
                      ? "bg-gray-600 cursor-not-allowed text-white/60"
                      : "bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 text-[#071022] hover:scale-105"
                  }`}
                >
                  {voted ? "✅ Hlasováno" : "Hlasovat"}
                </button>
              </div>

              <div className="mt-3 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500"
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


