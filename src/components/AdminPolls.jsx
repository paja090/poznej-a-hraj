// src/components/AdminPolls.jsx
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

export default function AdminPolls() {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    active: false,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snapshot) => {
      setPolls(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  const toggleActive = async (poll) => {
    await updateDoc(doc(db, "polls", poll.id), { active: !poll.active });
  };

  const deletePoll = async (id) => {
    if (window.confirm("Opravdu smazat tuto anketu?")) {
      await deleteDoc(doc(db, "polls", id));
    }
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl shadow-lg mt-10">
      <h2 className="text-xl font-semibold mb-4">📊 Ankety</h2>

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
        <p className="text-gray-400">Žádné ankety zatím nejsou.</p>
      ) : (
        <ul className="space-y-3">
          {polls.map((p) => (
            <li
              key={p.id}
              className="bg-slate-700 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-gray-400">{p.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  🗳️ Hlasů: {p.votes || 0}
                </p>
              </div>
              <div className="flex gap-3 mt-3 md:mt-0">
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
                  🗑️ Smazat
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


