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
