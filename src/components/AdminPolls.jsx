
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export default function AdminPolls() {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    votes: 0,
    active: true,
  });

  // 🔹 Načtení všech anket v reálném čase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snapshot) => {
      setPolls(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 🔹 Přidání nové ankety
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPoll.title.trim()) return alert("Zadej název ankety");
    await addDoc(collection(db, "polls"), {
      ...newPoll,
      createdAt: serverTimestamp(),
    });
    setNewPoll({ title: "", description: "", votes: 0, active: true });
  };

  // 🔹 Aktivace / deaktivace
  const toggleActive = async (id, current) => {
    await updateDoc(doc(db, "polls", id), { active: !current });
  };

  // 🔹 Reset hlasů
  const resetVotes = async (id) => {
    if (window.confirm("Opravdu vynulovat hlasy?")) {
      await updateDoc(doc(db, "polls", id), { votes: 0 });
    }
  };

  // 🔹 Smazání ankety
  const handleDelete = async (id) => {
    if (window.confirm("Opravdu smazat anketu?")) {
      await deleteDoc(doc(db, "polls", id));
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">🗳️ Správa anket</h2>

      {/* Formulář pro novou anketu */}
      <form
        onSubmit={handleAdd}
        className="bg-white/5 border border-white/10 p-4 rounded-xl mb-8 space-y-3"
      >
        <input
          type="text"
          placeholder="Název ankety"
          value={newPoll.title}
          onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
          className="w-full p-2 rounded-md bg-white/10 text-white"
        />
        <textarea
          placeholder="Popis ankety"
          value={newPoll.description}
          onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
          className="w-full p-2 rounded-md bg-white/10 text-white"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 text-[#071022] px-4 py-2 rounded-lg font-semibold"
        >
          ➕ Přidat anketu
        </button>
      </form>

      {/* Seznam anket */}
      <div className="space-y-4">
        {polls.length === 0 ? (
          <p className="text-white/60">Zatím žádné ankety...</p>
        ) : (
          polls.map((p) => (
            <div
              key={p.id}
              className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col md:flex-row md:justify-between md:items-center"
            >
              <div>
                <h4 className="font-semibold text-white">{p.title}</h4>
                <p className="text-sm text-white/60">{p.description}</p>
                <p className="text-xs text-white/50 mt-1">
                  Hlasy: {p.votes || 0} | {p.active ? "🟢 Aktivní" : "⚪ Neaktivní"}
                </p>
              </div>

              <div className="flex gap-2 mt-3 md:mt-0">
                <button
                  onClick={() => toggleActive(p.id, p.active)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm"
                >
                  {p.active ? "Deaktivovat" : "Aktivovat"}
                </button>
                <button
                  onClick={() => resetVotes(p.id)}
                  className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-md text-sm"
                >
                  Reset hlasů
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm"
                >
                  Smazat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

