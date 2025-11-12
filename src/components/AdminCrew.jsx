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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

export default function AdminCrew() {
  const [crew, setCrew] = useState([]);
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    desc: "",
  });
  const [newPhoto, setNewPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 🔹 Načíst tým z Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "crew"), (snap) => {
      setCrew(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 🔹 Přidat člena
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role) return alert("Vyplň jméno a roli");

    try {
      setUploading(true);
      let photoURL = "";

      // ✅ Pokud je vybraná fotka, nahraj ji do Firebase Storage
      if (newPhoto) {
        const fileRef = ref(storage, `crew/${Date.now()}_${newPhoto.name}`);
        await uploadBytes(fileRef, newPhoto);
        photoURL = await getDownloadURL(fileRef);
      }

      // ✅ Ulož data člena do Firestore
      await addDoc(collection(db, "crew"), {
        ...newMember,
        photo: photoURL,
        createdAt: serverTimestamp(),
      });

      // Reset formuláře
      setNewMember({ name: "", role: "", desc: "" });
      setNewPhoto(null);
    } catch (error) {
      console.error("Chyba při přidávání člena:", error);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Smazat člena (včetně fotky, pokud existuje)
  const handleDelete = async (id, photoURL) => {
    if (window.confirm("Opravdu smazat člena týmu?")) {
      try {
        await deleteDoc(doc(db, "crew", id));
        if (photoURL) {
          const fileRef = ref(storage, photoURL);
          await deleteObject(fileRef);
        }
      } catch (err) {
        console.error("Chyba při mazání člena:", err);
      }
    }
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl shadow-lg text-white">
      <h2 className="text-xl font-semibold mb-6">👥 Správa týmu (Crew)</h2>

      {/* ✅ FORMULÁŘ */}
      <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2 mb-8">
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

        {/* ✅ Nahrání fotky */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewPhoto(e.target.files[0])}
          className="bg-slate-700 p-2 rounded-md text-white md:col-span-2"
        />

        <textarea
          placeholder="Popis"
          value={newMember.desc}
          onChange={(e) => setNewMember({ ...newMember, desc: e.target.value })}
          className="bg-slate-700 p-2 rounded-md text-white md:col-span-2"
        />

        <button
          type="submit"
          disabled={uploading}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md md:col-span-2"
        >
          {uploading ? "Nahrávám..." : "➕ Přidat člena"}
        </button>
      </form>

      {/* ✅ SEZNAM ČLENŮ */}
      {crew.length === 0 ? (
        <p className="text-gray-400">Zatím žádní členové.</p>
      ) : (
        <ul className="space-y-3">
          {crew.map((m) => (
            <li
              key={m.id}
              className="bg-slate-700 p-4 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {m.photo && (
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover border border-white/20"
                  />
                )}
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm text-fuchsia-300">{m.role}</p>
                  <p className="text-xs text-white/60">{m.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(m.id, m.photo)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm"
              >
                🗑️ Smazat
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

