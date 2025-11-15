// src/components/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import AdminPolls from "./AdminPolls.jsx";
// ⭐ Přednastavené tagy pro akce (možnost 3C)
const presetTags = [
  "Soutěže",
  "Minihry",
  "Dýmky",
  "Seznamovací",
  "Party",
  "Kvízy",
  "Týmové hry",
  "Volná zábava",
  "Speciální edice",
  "Mikulášská",
];
export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(true);
  

  // === DATA STAVY ===
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [crew, setCrew] = useState([]);
  const [content, setContent] = useState({
  heroTitle: "Místo, kde se lidé potkávají přirozeně",
  heroSubtitle: "Večery plné her, kvízů a nových přátel.",
  ctaText: "Rezervuj si své místo",
  guaranteeText: "Vracíme peníze, pokud se ti akce nebude líbit.",
  aboutIntro:
    "Poznej & Hraj vzniklo z touhy spojovat lidi jinak — ne přes aplikace, ale skrze zážitky, hry a skutečné emoce.",
  aboutBody:
    "Každý večer má svůj příběh, atmosféru a moderátory, kteří pomáhají, aby se každý cítil vítaný.",
  tags: ["kvízy", "zábava", "noví lidé"],
});
const [newTag, setNewTag] = useState("");
  const [profile, setProfile] = useState({
    displayName: "",
    role: "",
    bio: "",
    avatarURL: "",
  });

  const [savingContent, setSavingContent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // === NOVÁ AKCE FORM ===
  const [newEvent, setNewEvent] = useState({
  title: "",
  date: "",
  place: "",
  description: "",
  capacity: "",
  price: "",

  bannerUrl: "",
  bannerFile: null,       // ⭐ nový prvek

  tags: [],
  customTag: "",
  program: [],
  dressCode: "",
  included: [],
  goals: [],
  galleryImages: [],
});

  // === NOVÝ CREW MEMBER ===
  const [newCrewMember, setNewCrewMember] = useState({
    name: "",
    role: "",
    description: "",
    photoFile: null,
  });

  // === NOVÁ RECENZE (MANUÁLNÍ PŘIDÁNÍ) ===
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 5,
    message: "",
  });

  // === SUBSCRIBE NA DATA ===
  useEffect(() => {
    // Akce
    const eventsQ = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubEvents = onSnapshot(eventsQ, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Rezervace
    const reservationsQ = query(
      collection(db, "reservations"),
      orderBy("createdAt", "desc")
    );
    const unsubReservations = onSnapshot(reservationsQ, (snapshot) => {
      setReservations(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Feedback (jen count)
    const unsubFeedback = onSnapshot(collection(db, "feedback"), (snap) => {
      setFeedbackCount(snap.size);
    });

    // Recenze
    const reviewsQ = query(
      collection(db, "reviews"),
      orderBy("createdAt", "desc")
    );
    const unsubReviews = onSnapshot(reviewsQ, (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Galerie
    const galleryQ = query(
      collection(db, "gallery"),
      orderBy("createdAt", "desc")
    );
    const unsubGallery = onSnapshot(galleryQ, (snap) => {
      setGallery(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Crew
    const crewQ = query(
      collection(db, "crew"),
      orderBy("order", "asc")
    );
    const unsubCrew = onSnapshot(crewQ, (snap) => {
      setCrew(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Public content
    const unsubContent = onSnapshot(
      doc(db, "settings", "publicContent"),
      (d) => {
        if (d.exists()) {
          setContent((prev) => ({ ...prev, ...d.data() }));
        }
      }
    );

    // Admin profil
    const unsubProfile = onSnapshot(doc(db, "admins", user.uid), (d) => {
      if (d.exists()) {
        setProfile((prev) => ({
          ...prev,
          ...d.data(),
        }));
      } else {
        // default podle Firebase usera
        setProfile((prev) => ({
          ...prev,
          displayName: user.displayName || "",
          avatarURL: user.photoURL || "",
        }));
      }
    });

    return () => {
      unsubEvents();
      unsubReservations();
      unsubFeedback();
      unsubReviews();
      unsubGallery();
      unsubCrew();
      unsubContent();
      unsubProfile();
    };
  }, [user.uid, user.displayName, user.photoURL]);

  // === ODHADNUTÉ STATISTIKY PRO OVERVIEW ===
  const stats = useMemo(() => {
    const upcoming = events.filter((ev) => {
      if (!ev.date) return false;
      try {
        return new Date(ev.date) >= new Date();
      } catch {
        return false;
      }
    });
    const past = events.length - upcoming.length;
    const totalAttendees = reservations.reduce(
      (sum, r) => sum + (Number(r.peopleCount || 1)),
      0
    );
    return {
      eventsTotal: events.length,
      eventsUpcoming: upcoming.length,
      eventsPast: past,
      reservations: reservations.length,
      attendees: totalAttendees,
      feedback: feedbackCount,
      reviews: reviews.length,
    };
  }, [events, reservations, feedbackCount, reviews]);

  // === HANDLERY ===

  // Přidání akce
const handleAddEvent = async (e) => {
  e.preventDefault();
  if (!newEvent.title || !newEvent.date || !newEvent.place) return;

  // ⭐ 1) Nahrajeme banner
  let uploadedBannerUrl = newEvent.bannerUrl;

  if (newEvent.bannerFile) {
    const path = `events/banners/${Date.now()}-${newEvent.bannerFile.name}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, newEvent.bannerFile);
    uploadedBannerUrl = await getDownloadURL(ref);
  }

  // ⭐ 2) PŘIPRAVÍME DATA BEZ bannerFile
  const eventDataToSave = {
    title: newEvent.title,
    date: newEvent.date,
    place: newEvent.place,
    description: newEvent.description,
    capacity: Number(newEvent.capacity) || 0,
    price: Number(newEvent.price) || 0,

    bannerUrl: uploadedBannerUrl,
    tags: newEvent.tags,
    program: newEvent.program,
    dressCode: newEvent.dressCode,
    included: newEvent.included,
    goals: newEvent.goals,
    galleryImages: newEvent.galleryImages,

    createdAt: serverTimestamp(),
  };

  // ⭐ 3) ULOŽÍME AKCI
  await addDoc(collection(db, "events"), eventDataToSave);

  // ⭐ 4) RESET FORMULÁŘE
  setNewEvent({
    title: "",
    date: "",
    place: "",
    description: "",
    capacity: "",
    price: "",

    bannerUrl: "",
    bannerFile: null,

    tags: [],
    customTag: "",
    program: [],
    dressCode: "",
    included: [],
    goals: [],

    galleryImages: [],
  });
};


  const handleDeleteEvent = async (id) => {
    if (window.confirm("Opravdu smazat akci?")) {
      await deleteDoc(doc(db, "events", id));
    }
  };

  // Rezervace – smazání & zaplaceno
  const handleDeleteReservation = async (id) => {
    if (window.confirm("Opravdu smazat rezervaci?")) {
      await deleteDoc(doc(db, "reservations", id));
    }
  };

  const toggleReservationPaid = async (reservation) => {
    await updateDoc(doc(db, "reservations", reservation.id), {
      paid: !reservation.paid,
    });
  };

  const exportReservationsToCSV = () => {
    if (!reservations.length) return;

    const header = [
      "Jméno",
      "E-mail",
      "Akce",
      "Pohlaví",
      "Věk",
      "Vztahový stav",
      "Počet osob",
      "Zaplaceno",
      "Vytvořeno",
    ];

    const rows = reservations.map((r) => [
      r.name || "",
      r.email || "",
      r.eventTitle || "",
      r.gender || "",
      r.ageRange || "",
      r.relationship || "",
      r.peopleCount || 1,
      r.paid ? "ANO" : "NE",
      r.createdAt?.toDate
        ? r.createdAt.toDate().toLocaleString("cs-CZ")
        : "",
    ]);

    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((val) =>
            `"${String(val ?? "")
              .replace(/"/g, '""')
              .replace(/\n/g, " ")}"`
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rezervace-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Uložení contentu
  const handleSaveContent = async (e) => {
    e.preventDefault();
    setSavingContent(true);
    try {
      await setDoc(
        doc(db, "settings", "publicContent"),
        {
          ...content,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } finally {
      setSavingContent(false);
    }
  };

  // Galerie – upload
  const handleGalleryUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    try {
      const path = `gallery/${Date.now()}-${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      await addDoc(collection(db, "gallery"), {
        url,
        storagePath: path,
        label: file.name,
        createdAt: serverTimestamp(),
      });
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  };

  const handleDeleteGalleryItem = async (item) => {
    if (!window.confirm("Smazat tento obrázek z galerie?")) return;
    try {
      if (item.storagePath) {
        const ref = storageRef(storage, item.storagePath);
        await deleteObject(ref);
      }
    } catch {
      // i kdyby storage selhal, smažeme meta
    }
    await deleteDoc(doc(db, "gallery", item.id));
  };

  // Crew – přidání + smazání
  const handleAddCrewMember = async (e) => {
    e.preventDefault();
    if (!newCrewMember.name || !newCrewMember.role) return;

    let photoURL = "";
    if (newCrewMember.photoFile) {
      const path = `crew/${Date.now()}-${newCrewMember.photoFile.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, newCrewMember.photoFile);
      photoURL = await getDownloadURL(ref);
    }

    await addDoc(collection(db, "crew"), {
      name: newCrewMember.name,
      role: newCrewMember.role,
      description: newCrewMember.description,
      photoURL,
      order: crew.length,
      createdAt: serverTimestamp(),
    });

    setNewCrewMember({
      name: "",
      role: "",
      description: "",
      photoFile: null,
    });
  };

  const handleDeleteCrewMember = async (member) => {
    if (!window.confirm("Smazat člena týmu?")) return;
    await deleteDoc(doc(db, "crew", member.id));
  };

  // Recenze – přidání + smazání
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.message.trim()) return;

    await addDoc(collection(db, "reviews"), {
      name: newReview.name || "Anonym",
      rating: Number(newReview.rating) || 5,
      message: newReview.message.trim(),
      approved: true,
      createdAt: serverTimestamp(),
    });

    setNewReview({
      name: "",
      rating: 5,
      message: "",
    });
  };

  const toggleReviewApproved = async (review) => {
    await updateDoc(doc(db, "reviews", review.id), {
      approved: !review.approved,
    });
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm("Smazat recenzi?")) return;
    await deleteDoc(doc(db, "reviews", review.id));
  };

  // Profil – uložení a avatar upload
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await setDoc(
        doc(db, "admins", user.uid),
        {
          ...profile,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const path = `admins/${user.uid}/avatar-${Date.now()}-${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      setProfile((prev) => ({ ...prev, avatarURL: url }));
      await setDoc(
        doc(db, "admins", user.uid),
        { avatarURL: url, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  // === UI KLASY PRO DARK / LIGHT ===
  const layoutClasses = darkMode
    ? "min-h-screen bg-slate-900 text-white"
    : "min-h-screen bg-slate-50 text-slate-900";

  const cardClasses = darkMode
    ? "bg-slate-800 text-white"
    : "bg-white text-slate-900 border-slate-200";

  const subCardClasses = darkMode
    ? "bg-slate-800 text-white"
    : "bg-slate-100 text-slate-900";

  return (
    <div className={layoutClasses}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* === HLAVIČKA === */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Admin panel – Poznej &amp; Hraj
            </h1>
            <p className="text-sm text-slate-400">
              Spravuj akce, rezervace, tým, obsah i ankety na jednom místě.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              className="rounded-full border border-slate-600/60 bg-slate-800/60 px-3 py-1 text-xs font-medium shadow-sm hover:bg-slate-700/80"
            >
              {darkMode ? "🌙 Dark" : "☀️ Light"}
            </button>
            <div className="flex items-center gap-3">
              {profile.avatarURL || user.photoURL ? (
                <img
                  src={profile.avatarURL || user.photoURL}
                  alt="Admin avatar"
                  className="h-10 w-10 rounded-full border border-slate-500 object-cover"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-500 text-sm font-bold text-white">
                  {user.email?.[0]?.toUpperCase() || "A"}
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {profile.displayName || user.displayName || "Admin"}
                </p>
                <p className="text-xs text-slate-400">
                  {profile.role || user.email}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold shadow hover:bg-red-700"
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </header>

        {/* === NAVIGACE / TABS === */}
        <nav className={`mb-6 grid gap-2 md:grid-cols-4 lg:grid-cols-8`}>
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            label="📊 Přehled"
          />
          <TabButton
            active={activeTab === "events"}
            onClick={() => setActiveTab("events")}
            label="📅 Akce"
          />
          <TabButton
            active={activeTab === "reservations"}
            onClick={() => setActiveTab("reservations")}
            label="🧾 Rezervace"
          />
          <TabButton
            active={activeTab === "polls"}
            onClick={() => setActiveTab("polls")}
            label="🗳️ Ankety"
          />
          <TabButton
            active={activeTab === "content"}
            onClick={() => setActiveTab("content")}
            label="✏️ Obsah webu"
          />
          <TabButton
            active={activeTab === "gallery"}
            onClick={() => setActiveTab("gallery")}
            label="📸 Galerie"
          />
          <TabButton
            active={activeTab === "crew"}
            onClick={() => setActiveTab("crew")}
            label="🎧 The Crew"
          />
          <TabButton
            active={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
            label="⭐ Recenze"
          />
          <TabButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            label="👤 Profil admina"
          />
        </nav>

        {/* === OBSAH TABS === */}
        <main className="space-y-6">
          {activeTab === "overview" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <h2 className="mb-4 text-lg font-semibold">Přehled</h2>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <StatTile
                  label="Celkem akcí"
                  value={stats.eventsTotal}
                  hint={`${stats.eventsUpcoming} nadcházejících, ${stats.eventsPast} proběhlých`}
                />
                <StatTile
                  label="Rezervace"
                  value={stats.reservations}
                  hint={`${stats.attendees} účastníků`}
                />
                <StatTile
                  label="Recenze"
                  value={stats.reviews}
                  hint="schválené i čekající"
                />
                <StatTile
                  label="Feedback"
                  value={stats.feedback}
                  hint="z kontaktního formuláře"
                />
              </div>

              {/* Poslední rezervace */}
              <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <div
                  className={`rounded-xl border border-slate-700/60 p-4 ${subCardClasses}`}
                >
                  <h3 className="mb-2 text-sm font-semibold">
                    Poslední rezervace
                  </h3>
                  {reservations.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Zatím žádné rezervace.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {reservations.slice(0, 6).map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2"
                        >
                          <div>
                            <p className="font-semibold">
                              {r.name || "Bez jména"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {r.eventTitle} • {r.ageRange} • {r.gender}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              r.paid
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/50"
                                : "bg-amber-500/10 text-amber-300 border border-amber-400/40"
                            }`}
                          >
                            {r.paid ? "Zaplaceno" : "Nezaplaceno"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Malý "fake" graf návštěvnosti z rezervací */}
                <div
                  className={`rounded-xl border border-slate-700/60 p-4 ${subCardClasses}`}
                >
                  <h3 className="mb-2 text-sm font-semibold">Návštěvnost</h3>
                  <p className="mb-2 text-xs text-slate-400">
                    Jednoduchý odhad na základě rezervací za poslední akce.
                  </p>
                  <div className="flex h-32 items-end gap-1">
                    {events.slice(0, 8).map((ev) => {
                      const totalForEvent = reservations.filter(
                        (r) => r.eventTitle === ev.title
                      ).length;
                      const height = Math.min(
                        100,
                        10 + totalForEvent * 10
                      );
                      return (
                        <div
                          key={ev.id}
                          className="flex-1 rounded-t-md bg-gradient-to-t from-violet-600 via-fuchsia-500 to-emerald-400"
                          style={{ height: `${height}%` }}
                          title={`${ev.title} – ${totalForEvent} rezervací`}
                        />
                      );
                    })}
                    {events.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Přidej první akci a začne se kreslit „graf“ 🙂
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* === AKCE === */}
          {activeTab === "events" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <h2 className="mb-4 text-lg font-semibold">Akce</h2>
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                {/* Seznam akcí */}
                <div>
                  {events.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Zatím nejsou žádné akce.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {events.map((ev) => (
                        <li
                          key={ev.id}
                          className="flex flex-col gap-2 rounded-xl bg-slate-900/40 p-3 text-sm md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-base font-semibold">
                              {ev.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              📅 {ev.date} • 📍 {ev.place}
                            </p>
                            {ev.description && (
                              <p className="mt-1 text-xs text-slate-300">
                                {ev.description}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                              Kapacita:{" "}
                              {ev.capacity ? `${ev.capacity} osob` : "neuvedena"}
                              {ev.price
                                ? ` • Cena: ${ev.price} Kč`
                                : ""}
                            </p>
                          </div>
                         <div className="flex gap-2 self-start md:self-auto">
  <button
    onClick={() => handleEditEvent(ev)}
    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold hover:bg-blue-700"
  >
    ✏️ Upravit
  </button>

  <button
    onClick={() => handleDeleteEvent(ev.id)}
    className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold hover:bg-red-700"
  >
    🗑️ Smazat
  </button>
</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

               {/* Přidat novou akci */}
<div className={`rounded-xl border border-slate-700/60 p-3 ${subCardClasses}`}>
  <h3 className="mb-3 text-sm font-semibold">
    Přidat novou akci
  </h3>

  <form onSubmit={handleAddEvent} className="space-y-3 text-xs">

    {/* Název */}
    <input
      type="text"
      placeholder="Název akce"
      value={newEvent.title}
      onChange={(e) =>
        setNewEvent({ ...newEvent, title: e.target.value })
      }
      required
      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
    />

    {/* Místo */}
    <input
      type="text"
      placeholder="Místo konání"
      value={newEvent.place}
      onChange={(e) =>
        setNewEvent({ ...newEvent, place: e.target.value })
      }
      required
      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
    />

    {/* Datum */}
    <input
      type="date"
      value={newEvent.date}
      onChange={(e) =>
        setNewEvent({ ...newEvent, date: e.target.value })
      }
      required
      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
    />

    {/* Kapacita + cena */}
    <div className="grid grid-cols-2 gap-2">
      <input
        type="number"
        min="0"
        placeholder="Kapacita"
        value={newEvent.capacity}
        onChange={(e) =>
          setNewEvent({ ...newEvent, capacity: e.target.value })
        }
        className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
      />

      <input
        type="number"
        min="0"
        placeholder="Cena (Kč)"
        value={newEvent.price}
        onChange={(e) =>
          setNewEvent({ ...newEvent, price: e.target.value })
        }
        className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
      />
    </div>

    {/* Popis */}
    <textarea
      placeholder="Popis události"
      rows={3}
      value={newEvent.description}
      onChange={(e) =>
        setNewEvent({ ...newEvent, description: e.target.value })
      }
      className="w-full resize-none rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
    />

   {/* Banner akce */}
<div className="space-y-2">
  <p className="text-xs font-semibold text-slate-300">Banner akce</p>

  {/* Náhled banneru */}
  {newEvent.bannerUrl ? (
    <img
      src={newEvent.bannerUrl}
      alt="Banner"
      className="w-full h-32 object-cover rounded-md border border-white/20"
    />
  ) : (
    <div className="w-full h-32 bg-white/10 rounded-md border border-white/10 grid place-items-center text-white/40 text-xs">
      Náhled banneru
    </div>
  )}

  {/* Upload button */}
  <label className="flex cursor-pointer items-center gap-2 text-xs">
    <span className="rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600">
      📤 Nahrát banner
    </span>
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setNewEvent({ ...newEvent, bannerFile: file });
        }
      }}
    />
  </label>
</div>

    {/* Tagy – preset + vlastní */}
    <div className="space-y-1 mt-2">
      <p className="text-xs font-semibold text-slate-300">Tagy akce</p>
      <div className="grid grid-cols-2 gap-1">
        {presetTags.map((tag) => (
          <label key={tag} className="flex items-center gap-1 text-[11px]">
            <input
              type="checkbox"
              checked={newEvent.tags.includes(tag)}
              onChange={(e) => {
                if (e.target.checked) {
                  setNewEvent({ ...newEvent, tags: [...newEvent.tags, tag] });
                } else {
                  setNewEvent({
                    ...newEvent,
                    tags: newEvent.tags.filter((t) => t !== tag),
                  });
                }
              }}
            />
            {tag}
          </label>
        ))}
      </div>

      {/* vlastní tag */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="Vlastní tag"
          value={newEvent.customTag || ""}
          onChange={(e) =>
            setNewEvent({ ...newEvent, customTag: e.target.value })
          }
          className="flex-1 rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 text-xs"
        />
        <button
          type="button"
          onClick={() => {
            if (newEvent.customTag?.trim()) {
              setNewEvent({
                ...newEvent,
                tags: [...newEvent.tags, newEvent.customTag.trim()],
                customTag: "",
              });
            }
          }}
          className="px-3 py-2 bg-emerald-600 rounded-md text-xs font-semibold"
        >
          Přidat
        </button>
      </div>
    </div>

    {/* Program večera */}
    <div>
      <p className="text-xs font-semibold text-slate-300">Program večera</p>
      <textarea
        placeholder={`Např:\n19:00 – Welcome drink\n19:30 – Seznamovací hry\n20:30 – Andělé vs. Čerti`}
        rows={4}
        value={newEvent.program.join("\n")}
        onChange={(e) =>
          setNewEvent({
            ...newEvent,
            program: e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l),
          })
        }
        className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 text-xs"
      />
    </div>

    {/* Dress code */}
    <input
      type="text"
      placeholder="Dress code"
      value={newEvent.dressCode}
      onChange={(e) =>
        setNewEvent({ ...newEvent, dressCode: e.target.value })
      }
      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 text-xs"
    />

    {/* V ceně vstupenky */}
    <div>
      <p className="text-xs font-semibold text-slate-300">V ceně vstupenky</p>
      <textarea
        placeholder="Např:\nWelcome drink\nVstup do soutěží\nPřístup do chill zóny"
        rows={3}
        value={newEvent.included.join("\n")}
        onChange={(e) =>
          setNewEvent({
            ...newEvent,
            included: e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l),
          })
        }
        className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 text-xs"
      />
    </div>

    {/* Cíl akce */}
    <div>
      <p className="text-xs font-semibold text-slate-300">Cíl akce</p>
      <textarea
        placeholder="Cíle akce (každý řádek jedna položka)"
        rows={3}
        value={newEvent.goals.join("\n")}
        onChange={(e) =>
          setNewEvent({
            ...newEvent,
            goals: e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l),
          })
        }
        className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 text-xs"
      />
    </div>
    {/* Výběr fotek do modalu */}
<div>
  <p className="text-xs font-semibold text-slate-300 mb-2">
    Fotky z galerie pro tuto akci
  </p>

  {gallery.length === 0 ? (
    <p className="text-[11px] text-slate-400">
      Galerie je prázdná. Nahraj fotky v záložce „📸 Galerie“.
    </p>
  ) : (
    <div className="grid grid-cols-3 gap-2">
      {gallery.map((img) => (
        <label
          key={img.id}
          className="relative cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={newEvent.galleryImages.includes(img.url)}
            onChange={(e) => {
              if (e.target.checked) {
                setNewEvent({
                  ...newEvent,
                  galleryImages: [...newEvent.galleryImages, img.url],
                });
              } else {
                setNewEvent({
                  ...newEvent,
                  galleryImages: newEvent.galleryImages.filter(
                    (u) => u !== img.url
                  ),
                });
              }
            }}
            className="absolute top-1 left-1 z-10 h-4 w-4"
          />

          {/* Náhled obrázku */}
          <img
            src={img.url}
            alt={img.label}
            className="h-20 w-full object-cover rounded-lg border border-white/20 group-hover:border-violet-400/50 transition"
          />

          {/* Overlay když je vybráno */}
          {newEvent.galleryImages.includes(img.url) && (
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center text-emerald-300 font-bold text-xl">
              ✓
            </div>
          )}
        </label>
      ))}
    </div>
  )}
</div>

    {/* Odeslat */}
    <button
      type="submit"
      className="w-full rounded-md bg-emerald-600 py-2 text-xs font-semibold hover:bg-emerald-700"
    >
      ➕ Přidat akci
    </button>
  </form>
</div>


              </div>
            </section>
          )}

          {/* === REZERVACE === */}
          {activeTab === "reservations" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Rezervace</h2>
                <button
                  onClick={exportReservationsToCSV}
                  className="rounded-md bg-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-600"
                >
                  ⬇️ Export CSV
                </button>
              </div>
              {reservations.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Zatím žádné rezervace.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-900/60">
                      <tr className="text-left">
                        <Th>Jméno</Th>
                        <Th>Akce</Th>
                        <Th>Věk</Th>
                        <Th>Pohlaví</Th>
                        <Th>Vztah</Th>
                        <Th>Počet</Th>
                        <Th>E-mail</Th>
                        <Th>Zaplaceno</Th>
                        <Th>Akce</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-slate-800/80 hover:bg-slate-900/50"
                        >
                          <Td>{r.name || "Bez jména"}</Td>
                          <Td>{r.eventTitle}</Td>
                          <Td>{r.ageRange}</Td>
                          <Td>{r.gender}</Td>
                          <Td>{r.relationship}</Td>
                          <Td>{r.peopleCount || 1}</Td>
                          <Td>{r.email}</Td>
                          <Td>
                            <button
                              onClick={() => toggleReservationPaid(r)}
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                r.paid
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40"
                                  : "bg-amber-500/10 text-amber-300 border border-amber-400/40"
                              }`}
                            >
                              {r.paid ? "Zaplaceno" : "Nezaplaceno"}
                            </button>
                          </Td>
                          <Td>
                            <button
                              onClick={() => handleDeleteReservation(r.id)}
                              className="rounded-md bg-red-600 px-2 py-1 text-[11px] hover:bg-red-700"
                            >
                              🗑️
                            </button>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* === ANKETY === */}
          {activeTab === "polls" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <AdminPolls />
            </section>
          )}

         {/* === OBSAH WEBU === */}
{activeTab === "content" && (
  <section
    className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
  >
    <h2 className="mb-4 text-lg font-semibold">Texty na webu</h2>

    <form onSubmit={handleSaveContent} className="grid gap-4 md:grid-cols-2">
      {/* HERO – nadpis */}
      <label className="flex flex-col gap-2 text-xs">
        Hero – nadpis
        <input
          type="text"
          value={content.heroTitle}
          onChange={(e) =>
            setContent({ ...content, heroTitle: e.target.value })
          }
          className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
        />
      </label>

      {/* HERO – podnadpis */}
      <label className="flex flex-col gap-2 text-xs">
        Hero – podnadpis
        <input
          type="text"
          value={content.heroSubtitle}
          onChange={(e) =>
            setContent({ ...content, heroSubtitle: e.target.value })
          }
          className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
        />
      </label>

      {/* CTA TEXT */}
      <label className="flex flex-col gap-2 text-xs">
        CTA tlačítko (text)
        <input
          type="text"
          value={content.ctaText}
          onChange={(e) =>
            setContent({ ...content, ctaText: e.target.value })
          }
          className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
        />
      </label>

      {/* GARANČNÍ TEXT */}
      <label className="flex flex-col gap-2 text-xs">
        Garanční text pod tlačítkem
        <input
          type="text"
          value={content.guaranteeText}
          onChange={(e) =>
            setContent({ ...content, guaranteeText: e.target.value })
          }
          className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
        />
      </label>

      {/* O PROJEKTU – ÚVOD */}
      <label className="flex flex-col gap-2 text-xs md:col-span-2">
        O projektu – úvod
        <textarea
          rows={3}
          value={content.aboutIntro}
          onChange={(e) =>
            setContent({
              ...content,
              aboutIntro: e.target.value,
            })
          }
          className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
        />
      </label>

      {/* O PROJEKTU – TEXT */}
      <label className="flex flex-col gap-2 text-xs md:col-span-2">
        O projektu – text
        <textarea
          rows={4}
          value={content.aboutBody}
          onChange={(e) =>
            setContent({
              ...content,
              aboutBody: e.target.value,
            })
          }
          className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
        />
      </label>

      {/* TAGY */}
      <div className="md:col-span-2 flex flex-col gap-2 text-xs">
        <p className="font-semibold text-slate-200">Tagy v hero sekci</p>

        {/* existující tagy */}
        <div className="flex flex-wrap gap-2">
          {(content.tags || []).map((tag, idx) => (
            <span
              key={idx}
              className="flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-[11px] text-slate-100 ring-1 ring-slate-600/70"
            >
              {tag}
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    tags: content.tags.filter((_, i) => i !== idx),
                  })
                }
                className="text-slate-400 hover:text-red-400"
              >
                ✕
              </button>
            </span>
          ))}
          {(!content.tags || content.tags.length === 0) && (
            <span className="text-[11px] text-slate-400">
              Zatím žádné tagy – přidej první níže.
            </span>
          )}
        </div>

        {/* přidání nového tagu */}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Nový tag (např. kvízy)"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 rounded-md bg-slate-900/40 px-3 py-2 text-xs outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
          />
          <button
            type="button"
            onClick={() => {
              const t = newTag.trim();
              if (!t) return;
              const tags = Array.isArray(content.tags) ? content.tags : [];
              setContent({ ...content, tags: [...tags, t] });
              setNewTag("");
            }}
            className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold hover:bg-violet-700"
          >
            ➕ Přidat tag
          </button>
        </div>
      </div>

      {/* SPODNÍ ŘÁDEK – INFO + ULOŽIT */}
      <div className="md:col-span-2 flex flex-col gap-3 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <span>
          Tyto texty a tagy se načítají na public stránce z Firestore kolekce{" "}
          <code>settings/publicContent</code>.
        </span>
        <button
          type="submit"
          disabled={savingContent}
          className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
        >
          {savingContent ? "Ukládám…" : "💾 Uložit texty"}
        </button>
      </div>
    </form>
  </section>
)}


          {/* === GALERIE === */}
          {activeTab === "gallery" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Galerie</h2>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <span className="rounded-md bg-slate-700 px-3 py-1 hover:bg-slate-600">
                    📤 Nahrát fotku
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadingGallery && (
                <p className="mb-3 text-xs text-slate-400">
                  Nahrávám obrázek…
                </p>
              )}
              {gallery.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Zatím nejsou žádné fotky v galerii.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-xl bg-slate-900/40"
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        className="h-40 w-full object-cover"
                      />
                      <div className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-200">
                        <span className="truncate">{item.label}</span>
                        <button
                          onClick={() => handleDeleteGalleryItem(item)}
                          className="rounded-md bg-red-600 px-2 py-1 hover:bg-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* === CREW === */}
          {activeTab === "crew" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <h2 className="mb-4 text-lg font-semibold">The Crew</h2>
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  {crew.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Zatím žádný tým – přidej první členy.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {crew.map((m) => (
                        <article
                          key={m.id}
                          className="flex flex-col items-center gap-2 rounded-xl bg-slate-900/40 p-3 text-center text-xs"
                        >
                          {m.photoURL ? (
                            <img
                              src={m.photoURL}
                              alt={m.name}
                              className="h-16 w-16 rounded-full border border-slate-500 object-cover"
                            />
                          ) : (
                            <div className="grid h-16 w-16 place-items-center rounded-full bg-violet-500 text-sm font-bold">
                              {m.name?.[0] || "?"}
                            </div>
                          )}
                          <p className="text-sm font-semibold">{m.name}</p>
                          <p className="text-[11px] text-emerald-300">
                            {m.role}
                          </p>
                          <p className="text-[11px] text-slate-300">
                            {m.description}
                          </p>
                          <button
                            onClick={() => handleDeleteCrewMember(m)}
                            className="mt-1 rounded-md bg-red-600 px-2 py-1 text-[11px] hover:bg-red-700"
                          >
                            🗑️ Odebrat
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                {/* Přidání člena */}
                <div className={`rounded-xl border border-slate-700/60 p-3 ${subCardClasses}`}>
                  <h3 className="mb-2 text-sm font-semibold">
                    Přidat člena týmu
                  </h3>
                  <form
                    onSubmit={handleAddCrewMember}
                    className="space-y-2 text-xs"
                  >
                    <input
                      type="text"
                      placeholder="Jméno"
                      value={newCrewMember.name}
                      onChange={(e) =>
                        setNewCrewMember({
                          ...newCrewMember,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={newCrewMember.role}
                      onChange={(e) =>
                        setNewCrewMember({
                          ...newCrewMember,
                          role: e.target.value,
                        })
                      }
                      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                      required
                    />
                    <textarea
                      placeholder="Krátký popis"
                      rows={3}
                      value={newCrewMember.description}
                      onChange={(e) =>
                        setNewCrewMember({
                          ...newCrewMember,
                          description: e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-xs">
                      <span className="rounded-md bg-slate-700 px-3 py-1 hover:bg-slate-600">
                        📷 Nahrát fotku
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setNewCrewMember({
                            ...newCrewMember,
                            photoFile: e.target.files?.[0] || null,
                          })
                        }
                        className="hidden"
                      />
                    </label>
                    <button
                      type="submit"
                      className="w-full rounded-md bg-emerald-600 py-2 text-xs font-semibold hover:bg-emerald-700"
                    >
                      ➕ Přidat člena
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* === RECENZE === */}
          {activeTab === "reviews" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <h2 className="mb-4 text-lg font-semibold">Recenze</h2>
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Zatím žádné recenze.
                    </p>
                  ) : (
                    <ul className="space-y-3 text-xs">
                      {reviews.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-xl bg-slate-900/40 p-3"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                {r.name || "Anonym"}
                              </p>
                              <p className="text-[11px] text-amber-300">
                                {"⭐".repeat(r.rating || 5)}
                              </p>
                            </div>
                            <div className="flex gap-2 text-[11px]">
                              <button
                                onClick={() => toggleReviewApproved(r)}
                                className={`rounded-md px-3 py-1 font-semibold ${
                                  r.approved
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-slate-700 hover:bg-slate-600"
                                }`}
                              >
                                {r.approved ? "Schváleno" : "Čeká"}
                              </button>
                              <button
                                onClick={() => handleDeleteReview(r)}
                                className="rounded-md bg-red-600 px-2 py-1 hover:bg-red-700"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-200">
                            {r.message}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Přidání recenze */}
                <div className={`rounded-xl border border-slate-700/60 p-3 ${subCardClasses}`}>
                  <h3 className="mb-2 text-sm font-semibold">
                    Přidat recenzi ručně
                  </h3>
                  <form
                    onSubmit={handleAddReview}
                    className="space-y-2 text-xs"
                  >
                    <input
                      type="text"
                      placeholder="Jméno (volitelné)"
                      value={newReview.name}
                      onChange={(e) =>
                        setNewReview({
                          ...newReview,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                    />
                    <select
                      value={newReview.rating}
                      onChange={(e) =>
                        setNewReview({
                          ...newReview,
                          rating: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4)</option>
                      <option value={3}>⭐⭐⭐ (3)</option>
                      <option value={2}>⭐⭐ (2)</option>
                      <option value={1}>⭐ (1)</option>
                    </select>
                    <textarea
                      placeholder="Text recenze"
                      rows={4}
                      value={newReview.message}
                      onChange={(e) =>
                        setNewReview({
                          ...newReview,
                          message: e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full rounded-md bg-emerald-600 py-2 text-xs font-semibold hover:bg-emerald-700"
                    >
                      ➕ Uložit recenzi
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* === PROFIL ADMINA === */}
          {activeTab === "profile" && (
            <section
              className={`rounded-2xl border border-slate-700/60 p-5 shadow-md ${cardClasses}`}
            >
              <h2 className="mb-4 text-lg font-semibold">Profil administrátora</h2>
              <div className="grid gap-6 md:grid-cols-[auto,1fr]">
                <div className="flex flex-col items-center gap-3">
                  {profile.avatarURL || user.photoURL ? (
                    <img
                      src={profile.avatarURL || user.photoURL}
                      alt="Admin avatar"
                      className="h-24 w-24 rounded-full border border-slate-500 object-cover"
                    />
                  ) : (
                    <div className="grid h-24 w-24 place-items-center rounded-full bg-violet-500 text-xl font-bold">
                      {user.email?.[0]?.toUpperCase() || "A"}
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                    <span className="rounded-md bg-slate-700 px-3 py-1 hover:bg-slate-600">
                      📷 Změnit avatar
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadingAvatar && (
                    <p className="text-[11px] text-slate-400">
                      Nahrávám avatar…
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className="space-y-3 text-xs"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      Zobrazované jméno
                      <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            displayName: e.target.value,
                          })
                        }
                        className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Role / pozice
                      <input
                        type="text"
                        value={profile.role}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            role: e.target.value,
                          })
                        }
                        placeholder="Např. Organizátor, Produkce, Tech…"
                        className="rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1">
                    Krátký bio text (uvidíš jen v adminu, klidně osobnější)
                    <textarea
                      rows={4}
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          bio: e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-md bg-slate-900/40 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400">
                    E-mail z přihlášení: {user.email}
                  </p>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="mt-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingProfile ? "Ukládám…" : "💾 Uložit profil"}
                  </button>
                </form>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// === POMOCNÉ MINI KOMPONENTY ===
function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow"
          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/90"
      }`}
    >
      {label}
    </button>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-slate-900/60 px-4 py-3 shadow-sm ring-1 ring-slate-700/70">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-fuchsia-300">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-3 py-2 text-[11px]">{children}</td>;
}






