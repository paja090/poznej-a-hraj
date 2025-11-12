// src/components/AdminHeroTags.jsx
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

export default function AdminHeroTags() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  // 🔹 Načti existující tagy
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "heroTags"), (snap) => {
      setTags(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 🔹 Přidat nový tag
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    await addDoc(collection(db, "heroTags"), {
      text: newTag.trim(),
      createdAt: serverTimestamp(),
    });
    setNewTag("");
  };

  // 🔹 Smazat tag
  const handleDelete = async (id) => {
    if (window.confirm("Smazat tento tag?")) {
      await deleteDoc(doc(db, "heroTags", id));
    }
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl shadow-lg text-white">
      <h2 className="text-xl font-semibold mb-4">🎯 Hlavní tagy (v hlavičce)</h2>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Např. 🎮 Herní turnaje"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="flex-1 bg-slate-700 p-2 rounded-md text-white"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md"
        >
          ➕ Přidat
        </button>
      </form>

      {tags.length === 0 ? (
        <p className="text-gray-400">Zatím žádné tagy.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li
              key={t.id}
              className="border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span>{t.text}</span>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-red-400 hover:text-red-500 text-xs"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
