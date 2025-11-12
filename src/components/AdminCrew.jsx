// src/components/AdminCrew.jsx
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function AdminCrew() {
  const [crew, setCrew] = useState([]);
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    desc: "",
    photo: "",
  });

  // 🔹 Načti tým z Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "crew"), (snap) => {
      setCrew(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 🔹 Přidat nového člena
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role) return;
    await addDoc(collection(db, "crew"), {
      ...newMember,
      createdAt: serverTimestamp(),
    });
    setNewMember({ name: "", role: "", desc: "", photo: "" });
  };

  // 🔹 Smazat člena
  const handleDelete = async (id) => {
    if (window.confirm("Opravdu smazat člena týmu?")) {
      await deleteDoc(doc(db, "crew", id));
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg text-white">
      <h2 className="text-xl font-semibold mb-4">👥 Správa týmu</h2>

      {/* FORMULÁŘ */}
      <form onSubmit={handleAddMember} className="grid gap-4 md:grid-cols-2 mb-8">
        <input
          type="text"
          placeholder="Jméno"
          value={newMember.name}
          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          className="bg-slate-700 p-2 rounded-md text-white"
          required
        />
        <input
          type="text"
          placeholder="Role"
          value={newMember.role}
          onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
          className="bg-slate-700 p-2 rounded-md text-white"
          required
        />
        <input
          type="text"
          placeholder="URL fotky"
          value={newMember.photo}
          onChange={(e) => setNewMember({ ...newMember, photo: e.target.value })}
          className="bg-slate-700 p-2 rounded-md text-white"
        />
        <textarea
          placeholder="Popis"
          value={newMember.desc}
          onChange={(e) => setNewMember({ ...newMember, desc: e.target.value })}
          className="bg-slate-700 p-2 rounded-md text-white md:col-span-2"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md md:col-span-2"
        >
          ➕ Přidat člena
        </button>
      </form>

      {/* SEZNAM */}
      {crew.length === 0 ? (
        <p className="text-gray-400">Zatím žádní členové týmu.</p>
      ) : (
        <ul className="space-y-3">
          {crew.map((c) => (
            <li
              key={c.id}
              className="bg-slate-700 p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {c.photo && (
                  <img
                    src={c.photo}
                    alt={c.name}
                    className="w-12 h-12 rounded-full object-cover border border-white/20"
                  />
                )}
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-fuchsia-300">{c.role}</p>
                  <p className="text-xs text-white/60">{c.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm"
              >
                🗑️ Smazat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
