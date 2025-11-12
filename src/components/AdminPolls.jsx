// src/components/AdminPolls.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

export default function AdminPolls() {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    active: false,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snap) => {
      setPolls(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const addPoll = async (e) => {
    e.preventDefault();
    if (!newPoll.title) return alert("Zadej název ankety!");
    await addDoc(collection(db, "polls"), {
      ...newPoll,
      votes: 0,
    });
    setNewPoll({ title: "", description: "", active: false });
  };

  const deletePoll = async (id) => {
    if (window.confirm("Opravdu chceš smazat tuto anketu?")) {
      await deleteDoc(doc(db, "polls", id));
    }
  };

  const toggleActive = async (poll) => {
    await updateDoc(doc(db, "polls", poll.id), { active: !poll.active });
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl shadow-lg mt-10">
      <h2 className="text-xl font-semibold mb-4">🗳️ Ankety</h2>

      {/* Přidat novou anketu */}
      <form onSubmit={addPoll} className="grid gap-3 md:grid-cols-2 mb-6">
        <input
          type="text"
          placeholder="Název ankety"
          value={newPoll.title}
          onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
          className="bg-slate-700 p-2 rounded-md text-white"
          required
        />
        <input
          type="text"
          placeholder="Popis (volitelný)"
          value={newPoll.description}
          onChange={(e) =>
            setNewPoll({ ...newPoll, description: e.target.value })
          }
          className="bg-slate-700 p-2 rounded-md text-white"
        />
        <label className="flex items-center gap-2 text-sm text-gray-300 md:col-span-2">
          <input
            type="checkbox"
            checked={newPoll.active}
            onChange={(e) =>
              setNewPoll({ ...newPoll, active: e.target.checked })
            }
          />
          Aktivní anketa
        </label>
        <button
          type="submit"
          className="md:col-span-2 bg-green-600 hover:bg-green-700 py-2 rounded-md text-white"
        >
          ➕ Přidat anketu
        </button>
      </form>

      {polls.length === 0 ? (
        <p className="text-gray-400">Zatím žádné ankety.</p>
      ) : (
        <ul className="space-y-5">
          {polls.map((p) => (
            <li
              key={p.id}
              className="bg-slate-700 p-4 rounded-lg flex flex-col gap-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-gray-400">{p.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      p.active
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {p.active ? "🟢 Aktivní" : "⚪ Neaktivní"}
                  </button>
                  <button
                    onClick={() => deletePoll(p.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Možnosti ankety */}
              <PollOptions pollId={p.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// 🔹 Subkomponenta pro možnosti
function PollOptions({ pollId }) {
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    const ref = collection(db, "polls", pollId, "options");
    const unsub = onSnapshot(ref, (snap) =>
      setOptions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [pollId]);

  const addOption = async (e) => {
    e.preventDefault();
    if (!newOption.trim()) return;
    await addDoc(collection(db, "polls", pollId, "options"), {
      title: newOption.trim(),
      votes: 0,
    });
    setNewOption("");
  };

  const deleteOption = async (id) => {
    if (window.confirm("Smazat možnost?")) {
      await deleteDoc(doc(db, "polls", pollId, "options", id));
    }
  };

  return (
    <div className="bg-slate-800 p-3 rounded-lg mt-3">
      <h4 className="text-sm font-semibold mb-2">🎯 Možnosti</h4>
      <form onSubmit={addOption} className="flex gap-2 mb-3">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Přidat možnost..."
          className="bg-slate-700 p-2 rounded-md text-white flex-1"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-sm"
        >
          ➕
        </button>
      </form>

      {options.length === 0 ? (
        <p className="text-gray-400 text-sm">Žádné možnosti.</p>
      ) : (
        <ul className="space-y-1">
          {options.map((o) => (
            <li
              key={o.id}
              className="flex justify-between items-center text-sm text-gray-300 bg-slate-700 px-3 py-2 rounded-md"
            >
              <span>
                {o.title} <span className="text-gray-500">({o.votes} hlasů)</span>
              </span>
              <button
                onClick={() => deleteOption(o.id)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



