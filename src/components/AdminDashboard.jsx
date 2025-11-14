// src/components/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AdminPolls from "./AdminPolls.jsx";

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("events");

  // === DATA ===
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    place: "",
    description: "",
    capacity: "",
    price: "",
  });

  const [editEvent, setEditEvent] = useState(null);

  // === LOAD EVENTS ===
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // === LOAD RESERVATIONS ===
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), (snapshot) => {
      setReservations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // === ADD NEW EVENT ===
  const handleAddEvent = async (e) => {
    e.preventDefault();

    if (!newEvent.title || !newEvent.date || !newEvent.place) return;

    await addDoc(collection(db, "events"), {
      ...newEvent,
      capacity: Number(newEvent.capacity) || 0,
      price: Number(newEvent.price) || 0,
      createdAt: serverTimestamp(),
    });

    setNewEvent({
      title: "",
      date: "",
      place: "",
      description: "",
      capacity: "",
      price: "",
    });
  };

  // === DELETE EVENT ===
  const handleDeleteEvent = async (id) => {
    if (window.confirm("Opravdu smazat akci?")) {
      await deleteDoc(doc(db, "events", id));
    }
  };

  // === DELETE RESERVATION ===
  const handleDeleteReservation = async (id) => {
    if (window.confirm("Opravdu smazat rezervaci?"))
      await deleteDoc(doc(db, "reservations", id));
  };

  // === UPDATE EVENT ===
  const handleUpdateEvent = async (e) => {
    e.preventDefault();

    const docRef = doc(db, "events", editEvent.id);

    let imageUrl = editEvent.imageUrl || "";

    if (editEvent.newBanner) {
      const storageRef = ref(storage, `eventBanners/${editEvent.id}`);
      await uploadBytes(storageRef, editEvent.newBanner);
      imageUrl = await getDownloadURL(storageRef);
    }

    await updateDoc(docRef, {
      title: editEvent.title,
      date: editEvent.date,
      place: editEvent.place,
      description: editEvent.description,
      longDescription: editEvent.longDescription || "",
      price: Number(editEvent.price) || 0,
      capacity: Number(editEvent.capacity) || 0,
      imageUrl,
      program:
        typeof editEvent.program === "string"
          ? editEvent.program.split("\n").filter((x) => x.trim() !== "")
          : editEvent.program,
    });

    setEditEvent(null);
  };

  // === RENDER ===
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* HLAVIČKA */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Panel – Poznej & Hraj</h1>

        <div className="flex items-center gap-4">
          <img
            src={user.photoURL}
            alt="user"
            className="w-10 h-10 rounded-full border border-white/20"
          />
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      {/* NAV */}
      <nav className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "events" ? "bg-indigo-600" : "bg-slate-700"
          }`}
        >
          Akce
        </button>

        <button
          onClick={() => setActiveTab("reservations")}
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "reservations" ? "bg-indigo-600" : "bg-slate-700"
          }`}
        >
          Rezervace
        </button>

        <button
          onClick={() => setActiveTab("polls")}
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "polls" ? "bg-indigo-600" : "bg-slate-700"
          }`}
        >
          Ankety
        </button>
      </nav>

      {/* === TAB: EVENTS === */}
      {activeTab === "events" && (
        <div className="space-y-8">
          {/* ADD NEW EVENT */}
          <form onSubmit={handleAddEvent} className="grid grid-cols-2 gap-4 bg-slate-800 p-4 rounded-xl">
            <input
              type="text"
              placeholder="Název akce"
              className="p-2 rounded bg-slate-700"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />

            <input
              type="date"
              className="p-2 rounded bg-slate-700"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />

            <input
              type="text"
              placeholder="Místo"
              className="p-2 rounded bg-slate-700"
              value={newEvent.place}
              onChange={(e) => setNewEvent({ ...newEvent, place: e.target.value })}
            />

            <input
              type="number"
              placeholder="Cena"
              className="p-2 rounded bg-slate-700"
              value={newEvent.price}
              onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
            />

            <input
              type="number"
              placeholder="Kapacita"
              className="p-2 rounded bg-slate-700"
              value={newEvent.capacity}
              onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
            />

            <textarea
              placeholder="Krátký popis"
              className="col-span-2 p-2 rounded bg-slate-700"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />

            <button className="col-span-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
              Přidat akci
            </button>
          </form>

          {/* === EVENT LIST === */}
          <div className="space-y-3">
            {events.map((e) => (
              <div
                key={e.id}
                className="bg-slate-800 border border-white/10 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg">{e.title}</p>
                  <p className="text-sm text-slate-300">{e.date}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditEvent(e)}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                  >
                    Upravit
                  </button>

                  <button
                    onClick={() => handleDeleteEvent(e.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TAB: RESERVATIONS === */}
      {activeTab === "reservations" && (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="bg-slate-800 border border-white/10 p-4 rounded-xl flex justify-between"
            >
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-slate-300">{r.email}</p>
                <p className="text-sm">{r.eventTitle}</p>
              </div>

              <button
                onClick={() => handleDeleteReservation(r.id)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              >
                Smazat
              </button>
            </div>
          ))}
        </div>
      )}

      {/* === TAB: POLLS === */}
      {activeTab === "polls" && <AdminPolls />}

      {/* === EDIT MODAL === */}
      {editEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 w-full max-w-2xl p-6 rounded-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Upravit akci</h2>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <input
                type="text"
                className="w-full p-2 rounded bg-slate-700"
                value={editEvent.title}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                placeholder="Název"
              />

              <textarea
                className="w-full p-2 rounded bg-slate-700"
                value={editEvent.description}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, description: e.target.value })
                }
                placeholder="Krátký popis"
              />

              <textarea
                className="w-full p-2 rounded bg-slate-700"
                value={editEvent.longDescription || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, longDescription: e.target.value })
                }
                placeholder="Dlouhý popis / detail"
              />

              <textarea
                className="w-full p-2 rounded bg-slate-700"
                value={
                  Array.isArray(editEvent.program)
                    ? editEvent.program.join("\n")
                    : editEvent.program || ""
                }
                onChange={(e) =>
                  setEditEvent({ ...editEvent, program: e.target.value })
                }
                placeholder="Program večera (každý bod na nový řádek)"
              />

              <input
                type="text"
                className="w-full p-2 rounded bg-slate-700"
                value={editEvent.place}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, place: e.target.value })
                }
                placeholder="Místo"
              />

              <input
                type="date"
                className="w-full p-2 rounded bg-slate-700"
                value={editEvent.date}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, date: e.target.value })
                }
              />

              <input
                type="number"
                className="w-full p-2 rounded bg-slate-700"
                value={editEvent.price}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, price: e.target.value })
                }
                placeholder="Cena"
              />

              <input
                type="number"
                className="w-full p-2 rounded bg-slate-700"
                value={editEvent.capacity}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, capacity: e.target.value })
                }
                placeholder="Kapacita"
              />

              <div>
                <p className="text-sm mb-1">Banner</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditEvent({
                      ...editEvent,
                      newBanner: e.target.files[0],
                    })
                  }
                />
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setEditEvent(null)}
                  className="px-4 py-2 bg-red-500 rounded"
                >
                  Zavřít
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 rounded"
                >
                  Uložit změny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}





