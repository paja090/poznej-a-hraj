import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import FeedbackForm from './components/FeedbackForm.jsx';
import ReviewForm from './components/ReviewForm.jsx';
import { db, storage, isFirebaseConfigured } from './firebaseConfig.js';
import {
  sampleCrew,
  sampleEvents,
  sampleGallery,
  sampleHeroTags,
  samplePollOptions,
  samplePollQuestion,
  sampleReservations,
  sampleReviews,
} from './sampleData.js';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'akce1234';

function ensureDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatDateTime(value, withTime = true) {
  const date = ensureDate(value);
  if (!date) return '';
  const options = withTime
    ? { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleString('cs-CZ', options).replaceAll('.', '.');
}

function EventCard({ event, available, onReserve, onShowPhotos }) {
  const eventDate = ensureDate(event.startDate);
  const isArchive = eventDate ? eventDate < new Date() : false;
  const day = eventDate ? eventDate.toLocaleDateString('cs-CZ', { day: '2-digit' }) : '';
  const month = eventDate ? eventDate.toLocaleDateString('cs-CZ', { month: 'short' }) : '';

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          {event.description && <p className="mt-1 text-sm text-white/70">{event.description}</p>}
        </div>
        <span className="rounded-full border border-a1/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-a1">
          {isArchive ? 'Archiv' : 'Nadcházející'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        {eventDate && <span className="pill">📅 {formatDateTime(eventDate)}</span>}
        {event.place && <span className="pill">📍 {event.place}</span>}
        {typeof event.capacity === 'number' && <span className="pill">Kapacita: {event.capacity}</span>}
        {typeof available === 'number' && !isArchive && (
          <span className={`pill ${available > 0 ? 'text-a2' : 'text-rose-300'}`}>
            Volná místa: {Math.max(0, available)}
          </span>
        )}
        {event.price ? <span className="pill text-[#b4ffd9]">💳 {event.price} Kč</span> : null}
        {(event.tags || []).map((tag) => (
          <span key={tag} className="pill text-white/60">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {!isArchive && (
          <button
            type="button"
            onClick={() => onReserve(event.id)}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-a1 transition hover:border-a1/80 hover:text-white"
            disabled={available !== undefined && available <= 0}
          >
            {available !== undefined && available <= 0 ? 'Obsazeno' : 'Rezervovat'}
          </button>
        )}
        {isArchive && (event.photos || []).length > 0 && (
          <button
            type="button"
            onClick={() => onShowPhotos(event.id, 0)}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white transition hover:border-a1/60"
          >
            📸 Fotky z akce
          </button>
        )}
      </div>
      {isArchive && (!event.photos || event.photos.length === 0) && (
        <p className="text-xs text-white/50">Fotky budou doplněny brzy.</p>
      )}
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-center text-xs text-white/50">
        <span className="font-semibold text-white/70">{day}</span> · {month}
      </div>
    </article>
  );
}

function PollOption({ option, totalVotes, onVote }) {
  const ratio = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{option.title}</p>
          {option.description && <p className="text-sm text-white/60">{option.description}</p>}
        </div>
        <span className="text-sm font-semibold text-a2">{option.votes} hlasů</span>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-a1 to-a2" style={{ width: `${ratio}%` }} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 text-xs text-white/60">
        <span>{ratio}% hlasů</span>
        <button
          type="button"
          onClick={() => onVote(option.id)}
          className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-a1 transition hover:border-a1/70 hover:text-white"
        >
          Hlasovat
        </button>
      </div>
    </div>
  );
}
function Lightbox({ isOpen, photos, currentIndex, onClose, onNavigate }) {
  if (!isOpen || !photos.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
      >
        Zavřít
      </button>
      <button
        type="button"
        onClick={() => onNavigate(currentIndex - 1)}
        className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-2xl text-white"
      >
        ◀
      </button>
      <img
        src={photos[currentIndex]}
        alt="Event"
        className="max-h-[80vh] max-w-5xl rounded-3xl border border-white/20 object-contain shadow-2xl"
      />
      <button
        type="button"
        onClick={() => onNavigate(currentIndex + 1)}
        className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-2xl text-white"
      >
        ▶
      </button>
    </div>
  );
}

function ReservationModal({
  isOpen,
  events,
  reservations,
  onClose,
  selectedEventId,
  onSubmitReservation,
  isOnline,
}) {
  const [form, setForm] = useState({
    eventId: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    age: '',
    status: '',
    expectation: '',
    count: 1,
    note: '',
    guests: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setForm({
        eventId: '',
        name: '',
        email: '',
        phone: '',
        gender: '',
        age: '',
        status: '',
        expectation: '',
        count: 1,
        note: '',
        guests: [],
      });
      setSuccessMessage('');
      setError('');
      return;
    }
    if (selectedEventId) {
      setForm((prev) => ({ ...prev, eventId: selectedEventId }));
    }
  }, [isOpen, selectedEventId]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events.filter((event) => {
      const date = ensureDate(event.startDate);
      return date && date >= now;
    });
  }, [events]);

  const reservationTotals = useMemo(() => {
    const map = new Map();
    reservations.forEach((item) => {
      const current = map.get(item.eventId) ?? 0;
      map.set(item.eventId, current + (item.count ?? 0));
    });
    return map;
  }, [reservations]);

  const selectedEvent = upcomingEvents.find((event) => event.id === form.eventId);
  const eventCapacity = selectedEvent && typeof selectedEvent.capacity === 'number' ? selectedEvent.capacity : null;
  const availableSeats = selectedEvent
    ? eventCapacity != null
      ? eventCapacity - (reservationTotals.get(selectedEvent.id) ?? 0)
      : Infinity
    : 0;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuestChange = (index, value) => {
    setForm((prev) => {
      const nextGuests = [...prev.guests];
      nextGuests[index] = value;
      return { ...prev, guests: nextGuests };
    });
  };

  const guestInputs = Array.from({ length: Math.max(0, Number(form.count || 1) - 1) }, (_, idx) => idx);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!form.eventId) {
        throw new Error('Vyber prosím akci.');
      }
      if (!form.name || !form.email) {
        throw new Error('Vyplň prosím jméno a e-mail.');
      }
      if (!selectedEvent) {
        throw new Error('Vybraná akce nebyla nalezena.');
      }
      const requested = Number(form.count || 1);
      if (requested < 1) {
        throw new Error('Počet osob musí být alespoň 1.');
      }
      if (typeof selectedEvent.capacity === 'number' && requested > availableSeats) {
        throw new Error('Počet míst překračuje aktuální volnou kapacitu.');
      }

      await onSubmitReservation({
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        age: form.age,
        status: form.status,
        expectation: form.expectation,
        count: requested,
        guests: form.guests.filter(Boolean),
        note: form.note,
        price: selectedEvent.price ?? null,
      });

      setSuccessMessage(
        isOnline
          ? 'Díky — rezervace byla odeslána.'
          : 'Díky! Rezervaci máme uloženou v náhledu. Jakmile připojíš Firebase, odešli ji prosím znovu.',
      );
      setForm({
        eventId: selectedEvent.id,
        name: '',
        email: '',
        phone: '',
        gender: '',
        age: '',
        status: '',
        expectation: '',
        count: 1,
        note: '',
        guests: [],
      });
    } catch (err) {
      setError(err.message || 'Rezervaci se nepodařilo uložit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-gradient-to-b from-[#071022] to-[#0b1220] p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full border border-white/20 px-3 py-1 text-sm text-white/70 hover:text-white"
        >
          ✕ Zavřít
        </button>
        <h2 className="text-2xl font-semibold text-white">Rezervace</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {!isOnline && (
            <p className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Tento náhled běží bez propojení na Firebase. Rezervace se ukládají pouze lokálně.
            </p>
          )}
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Vyber akci
            <select
              value={form.eventId}
              onChange={(e) => handleChange('eventId', e.target.value)}
              className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
            >
              <option value="">— vyber akci —</option>
              {upcomingEvents.map((eventItem) => {
                const taken = reservationTotals.get(eventItem.id) ?? 0;
                const hasCapacity = typeof eventItem.capacity === 'number';
                const capacity = hasCapacity ? eventItem.capacity : null;
                const left = hasCapacity ? capacity - taken : Infinity;
                const capacityText = hasCapacity ? `${Math.max(0, left)}/${capacity}` : 'bez limitu';
                return (
                  <option key={eventItem.id} value={eventItem.id}>
                    {eventItem.title} — {formatDateTime(eventItem.startDate)} ({capacityText})
                  </option>
                );
              })}
            </select>
          </label>
          {selectedEvent && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              📅 {formatDateTime(selectedEvent.startDate)}
              {selectedEvent.place ? ` • 📍 ${selectedEvent.place}` : ''}
              {selectedEvent.price ? ` • 💳 ${selectedEvent.price} Kč` : ''}
              {typeof selectedEvent.capacity === 'number'
                ? ` • Volná místa: ${Math.max(0, availableSeats)}/${selectedEvent.capacity}`
                : ' • Kapacita: bez omezení'}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Jméno a příjmení
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                required
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Telefon
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Pohlaví
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              >
                <option value="">— vyber —</option>
                <option value="muž">Kluk / muž</option>
                <option value="žena">Holka / žena</option>
                <option value="jiné">Jiné / neuvádět</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Věk
              <select
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              >
                <option value="">— vyber —</option>
                <option value="18–22">18–22</option>
                <option value="23–27">23–27</option>
                <option value="28–32">28–32</option>
                <option value="33–37">33–37</option>
                <option value="38–45">38–45</option>
                <option value="46+">46+</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Stav
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              >
                <option value="">— vyber —</option>
                <option value="nezadaný/á">nezadaný/á</option>
                <option value="zadaný/á">zadaný/á</option>
                <option value="je to složité">je to složité</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Počet osob
              <select
                value={form.count}
                onChange={(e) => handleChange('count', Number(e.target.value))}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              >
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {guestInputs.length > 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Jména hostů</p>
              <div className="mt-4 grid gap-3">
                {guestInputs.map((index) => (
                  <input
                    key={index}
                    type="text"
                    value={form.guests[index] ?? ''}
                    onChange={(e) => handleGuestChange(index, e.target.value)}
                    placeholder={`Jméno hosta ${index + 1}`}
                    className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                  />
                ))}
              </div>
            </div>
          )}
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Očekávání od akce
            <textarea
              rows={3}
              value={form.expectation}
              onChange={(e) => handleChange('expectation', e.target.value)}
              className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Poznámka
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
            />
          </label>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {successMessage && (
            <p className="rounded-2xl border border-a2/40 bg-a2/10 px-4 py-3 text-sm text-a2">{successMessage}</p>
          )}
          <div className="flex flex-col gap-3 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
            <span>
              Dotazy? Piš na <a className="text-a2 underline" href="mailto:poznejahraj@seznam.cz">poznejahraj@seznam.cz</a>
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-white/40 hover:text-white"
              >
                Zavřít
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Odesílám…' : 'Odeslat rezervaci'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
function AdminPanel({
  onClose,
  events,
  reservations,
  gallery,
  pollOptions,
  pollQuestion,
  heroTags,
  crew,
  reviews,
  isOnline,
}) {
  const [eventForm, setEventForm] = useState({
    title: '',
    when: '',
    place: '',
    description: '',
    capacity: '',
    price: '',
    tags: '',
    files: [],
  });
  const [question, setQuestion] = useState(pollQuestion || 'Jaké téma chcete příště?');
  const [crewDraft, setCrewDraft] = useState({ name: '', role: '', description: '', file: null });
  const [uploadingEvent, setUploadingEvent] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [pollLoading, setPollLoading] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [crewSaving, setCrewSaving] = useState(false);

  useEffect(() => {
    setQuestion(pollQuestion || 'Jaké téma chcete příště?');
  }, [pollQuestion]);

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setUploadingEvent(true);
    try {
      if (!eventForm.title || !eventForm.when) {
        throw new Error('Vyplň název i datum.');
      }
      const parsedDate = new Date(eventForm.when);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error('Datum nemá správný formát.');
      }

      if (!isOnline || !db) {
        throw new Error('Pro správu akcí nastav Firebase konfiguraci (.env soubor).');
      }

      const docRef = await addDoc(collection(db, 'events'), {
        title: eventForm.title,
        description: eventForm.description,
        place: eventForm.place,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : null,
        price: eventForm.price ? Number(eventForm.price) : null,
        tags: eventForm.tags
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        startDate: Timestamp.fromDate(parsedDate),
        createdAt: serverTimestamp(),
        photos: [],
      });

      if (eventForm.files.length) {
        const uploadedUrls = [];
        for (const file of eventForm.files) {
          const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
          const storageRef = ref(storage, `event-photos/${docRef.id}/${safeName}`);
          const uploaded = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(uploaded.ref);
          uploadedUrls.push(url);
        }
        await updateDoc(docRef, { photos: uploadedUrls });
      }

      setEventForm({
        title: '',
        when: '',
        place: '',
        description: '',
        capacity: '',
        price: '',
        tags: '',
        files: [],
      });
    } catch (err) {
      alert(err.message || 'Akci se nepodařilo uložit.');
    } finally {
      setUploadingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Opravdu smazat akci?')) return;
    if (!isOnline || !db) {
      alert('Smazání akce je dostupné až po propojení na Firebase.');
      return;
    }
    await deleteDoc(doc(db, 'events', eventId));
  };

  const handleGalleryUpload = async (file) => {
    if (!file) return;
    setUploadingGallery(true);
    try {
      if (!isOnline || !db || !storage) {
        throw new Error('Nahrávání fotek vyžaduje nastavení Firebase Storage.');
      }
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const storageRef = ref(storage, `gallery/${safeName}`);
      const uploaded = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploaded.ref);
      await addDoc(collection(db, 'gallery'), {
        name: file.name,
        imageUrl: url,
        storagePath: storageRef.fullPath,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      alert(err.message || 'Nepodařilo se nahrát fotku.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGallery = async (item) => {
    if (!window.confirm('Smazat fotku?')) return;
    if (!isOnline || !db) {
      alert('Smazání fotky vyžaduje aktivní Firebase konfiguraci.');
      return;
    }
    await deleteDoc(doc(db, 'gallery', item.id));
    if (item.storagePath) {
      try {
        await deleteObject(ref(storage, item.storagePath));
      } catch (err) {
        console.warn('Nelze smazat objekt ze storage', err);
      }
    }
  };

  const handleAddPollOption = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    if (!title) return;
    setPollLoading(true);
    try {
      if (!isOnline || !db) {
        throw new Error('Správa ankety vyžaduje propojení na Firebase.');
      }
      await addDoc(collection(db, 'pollOptions'), {
        title,
        description: description || '',
        votes: 0,
        createdAt: serverTimestamp(),
      });
      event.currentTarget.reset();
    } catch (err) {
      alert(err.message || 'Nepodařilo se přidat možnost.');
    } finally {
      setPollLoading(false);
    }
  };

  const handleDeletePollOption = async (id) => {
    if (!window.confirm('Smazat možnost ankety?')) return;
    if (!isOnline || !db) {
      alert('Smazání možnosti vyžaduje aktivní Firebase.');
      return;
    }
    await deleteDoc(doc(db, 'pollOptions', id));
  };

  const handleResetPollVotes = async () => {
    if (!window.confirm('Vynulovat všechny hlasy?')) return;
    setPollLoading(true);
    try {
      if (!isOnline || !db) {
        throw new Error('Reset hlasů vyžaduje propojení na Firebase.');
      }
      await Promise.all(pollOptions.map((option) => updateDoc(doc(db, 'pollOptions', option.id), { votes: 0 })));
    } catch (err) {
      alert(err.message || 'Nepodařilo se vynulovat hlasy.');
    } finally {
      setPollLoading(false);
    }
  };

  const handleSaveQuestion = async (event) => {
    event.preventDefault();
    setSavingQuestion(true);
    try {
      if (!isOnline || !db) {
        throw new Error('Uložení otázky vyžaduje aktivní Firebase.');
      }
      await setDoc(doc(db, 'poll', 'settings'), { question }, { merge: true });
    } catch (err) {
      alert(err.message || 'Dotaz ankety se nepodařilo uložit.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleAddHeroTag = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const label = formData.get('label')?.toString().trim();
    if (!label) return;
    if (!isOnline || !db) {
      alert('Přidání tagu je dostupné až po propojení Firebase.');
      return;
    }
    await addDoc(collection(db, 'heroTags'), { label, createdAt: serverTimestamp() });
    event.currentTarget.reset();
  };

  const handleDeleteHeroTag = async (id) => {
    if (!isOnline || !db) {
      alert('Smazání tagu je dostupné až po propojení Firebase.');
      return;
    }
    await deleteDoc(doc(db, 'heroTags', id));
  };

  const handleAddCrewMember = async (event) => {
    event.preventDefault();
    if (!crewDraft.name || !crewDraft.role) {
      alert('Vyplň jméno i roli.');
      return;
    }
    if (!isOnline || !db) {
      alert('Správa týmu je dostupná až po propojení Firebase.');
      return;
    }
    setCrewSaving(true);
    try {
      let photoUrl = '';
      let storagePath;
      if (crewDraft.file) {
        const safeName = `${Date.now()}_${crewDraft.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const storageRef = ref(storage, `crew/${safeName}`);
        const uploaded = await uploadBytes(storageRef, crewDraft.file);
        photoUrl = await getDownloadURL(uploaded.ref);
        storagePath = storageRef.fullPath;
      }
      await addDoc(collection(db, 'crew'), {
        name: crewDraft.name,
        role: crewDraft.role,
        description: crewDraft.description,
        photoUrl,
        storagePath: storagePath || '',
        createdAt: serverTimestamp(),
      });
      setCrewDraft({ name: '', role: '', description: '', file: null });
    } catch (err) {
      alert(err.message || 'Nepodařilo se uložit člena týmu.');
    } finally {
      setCrewSaving(false);
    }
  };

  const handleDeleteCrewMember = async (member) => {
    if (!window.confirm('Smazat člena týmu?')) return;
    if (!isOnline || !db) {
      alert('Smazání člena je dostupné až po propojení Firebase.');
      return;
    }
    await deleteDoc(doc(db, 'crew', member.id));
    if (member.storagePath) {
      try {
        await deleteObject(ref(storage, member.storagePath));
      } catch (err) {
        console.warn('Nelze smazat fotku z úložiště', err);
      }
    }
  };

  const handleReviewApproval = async (review, approved) => {
    if (!isOnline || !db) {
      alert('Schvalování recenzí vyžaduje propojení na Firebase.');
      return;
    }
    await updateDoc(doc(db, 'reviews', review.id), { approved });
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm('Smazat recenzi?')) return;
    if (!isOnline || !db) {
      alert('Smazání recenze vyžaduje propojení na Firebase.');
      return;
    }
    await deleteDoc(doc(db, 'reviews', review.id));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-6">
      <div className="relative mx-auto max-w-5xl rounded-3xl border border-white/15 bg-[#071022] p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full border border-white/20 px-3 py-1 text-sm text-white/70 hover:text-white"
        >
          ✕ Zavřít panel
        </button>
        <h2 className="text-3xl font-semibold text-white">Admin panel</h2>
        <p className="mt-2 text-sm text-white/60">Spravuj akce, galerii, anketu, tým i recenze v reálném čase.</p>
        {!isOnline && (
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100">
            Pro plné úpravy obsahu je potřeba doplnit Firebase konfiguraci (.env). Níže vidíš pouze ukázková data.
          </div>
        )}

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Přidat akci</h3>
          <form className="grid gap-4" onSubmit={handleCreateEvent}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-white/70">
                Název
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-white/70">
                Datum a čas
                <input
                  type="datetime-local"
                  value={eventForm.when}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, when: e.target.value }))}
                  className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                  required
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-white/70">
                Místo
                <input
                  type="text"
                  value={eventForm.place}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, place: e.target.value }))}
                  className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-white/70">
                Kapacita
                <input
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-white/70">
                Cena (Kč)
                <input
                  type="number"
                  value={eventForm.price}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-white/70">
                Tagy (čárkou)
                <input
                  type="text"
                  value={eventForm.tags}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                  placeholder="turnaj, kvíz, hookah"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Popis
              <textarea
                rows={3}
                value={eventForm.description}
                onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Fotky akce (max. 5)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setEventForm((prev) => ({ ...prev, files: Array.from(e.target.files ?? []).slice(0, 5) }))}
                className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-white/70"
              />
            </label>
            <button
              type="submit"
              disabled={uploadingEvent || !isOnline}
              className="self-start bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingEvent ? 'Ukládám…' : 'Uložit akci'}
            </button>
          </form>
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white">Aktivní akce</h4>
            <div className="grid gap-4">
              {events.length === 0 && <p className="text-sm text-white/60">Zatím žádné akce.</p>}
              {events.map((eventItem) => (
                <div
                  key={eventItem.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                >
                  <div>
                    <p className="font-semibold text-white">{eventItem.title}</p>
                    <p>
                      {formatDateTime(eventItem.startDate)} • {eventItem.place}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(eventItem.id)}
                    disabled={!isOnline}
                    className="rounded-xl border border-rose-400/40 px-4 py-2 text-sm text-rose-300 hover:border-rose-300"
                  >
                    Smazat
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Galerie</h3>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Nahrát fotku
              <input
                type="file"
                accept="image/*"
                disabled={!isOnline}
                onChange={(e) => handleGalleryUpload(e.target.files?.[0] ?? null)}
                className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-white/70"
              />
            </label>
            {uploadingGallery && <span className="text-sm text-white/60">Nahrávám…</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {gallery.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <img src={item.imageUrl} alt={item.name || 'Fotka'} className="h-32 w-full rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteGallery(item)}
                  disabled={!isOnline}
                  className="mt-3 w-full rounded-xl border border-white/20 px-3 py-2 text-xs text-white hover:border-rose-300 hover:text-rose-200"
                >
                  Smazat
                </button>
              </div>
            ))}
            {gallery.length === 0 && <p className="text-sm text-white/60">Galerie je prázdná.</p>}
          </div>
        </section>

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Anketa</h3>
          <form className="flex flex-col gap-3 md:flex-row md:items-end" onSubmit={handleSaveQuestion}>
            <label className="flex flex-1 flex-col gap-2 text-sm text-white/70">
              Otázka ankety
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              />
            </label>
            <button
              type="submit"
              disabled={savingQuestion || !isOnline}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-a1 hover:border-a1/60 hover:text-white"
            >
              {savingQuestion ? 'Ukládám…' : 'Uložit otázku'}
            </button>
          </form>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleAddPollOption}>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Název možnosti
              <input name="title" type="text" className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white" required />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Popis (volitelný)
              <input name="description" type="text" className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white" />
            </label>
            <button
              type="submit"
              disabled={pollLoading || !isOnline}
              className="bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            >
              {pollLoading ? 'Přidávám…' : 'Přidat možnost'}
            </button>
          </form>
          <div className="space-y-3">
            {pollOptions.map((option) => (
              <div
                key={option.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
              >
                <div>
                  <p className="font-semibold text-white">{option.title}</p>
                  {option.description && <p>{option.description}</p>}
                  <p className="text-xs text-white/50">{option.votes} hlasů</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePollOption(option.id)}
                  disabled={!isOnline}
                  className="rounded-xl border border-white/20 px-4 py-2 text-xs text-white/70 hover:border-rose-300 hover:text-rose-200"
                >
                  Smazat
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={pollLoading || !isOnline}
            onClick={handleResetPollVotes}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-a1/60 hover:text-white"
          >
            Vynulovat hlasy
          </button>
        </section>

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Hero tagy</h3>
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleAddHeroTag}>
            <input
              name="label"
              type="text"
              placeholder="např. 🎮 Herní turnaje"
              className="flex-1 rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              required
            />
            <button
              type="submit"
              disabled={!isOnline}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-a1 hover:border-a1/60 hover:text-white"
            >
              Přidat tag
            </button>
          </form>
          <div className="grid gap-3 md:grid-cols-2">
            {heroTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              >
                <span>{tag.label}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteHeroTag(tag.id)}
                  disabled={!isOnline}
                  className="rounded-xl border border-white/20 px-3 py-1 text-xs text-white/70 hover:border-rose-300 hover:text-rose-200"
                >
                  Smazat
                </button>
              </div>
            ))}
            {heroTags.length === 0 && <p className="text-sm text-white/60">Žádné tagy.</p>}
          </div>
        </section>

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Tým</h3>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddCrewMember}>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Jméno
              <input
                type="text"
                value={crewDraft.name}
                onChange={(e) => setCrewDraft((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Role
              <input
                type="text"
                value={crewDraft.role}
                onChange={(e) => setCrewDraft((prev) => ({ ...prev, role: e.target.value }))}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
                required
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/70">
              Popis
              <textarea
                rows={3}
                value={crewDraft.description}
                onChange={(e) => setCrewDraft((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/70">
              Fotka
              <input
                type="file"
                accept="image/*"
                disabled={!isOnline}
                onChange={(e) => setCrewDraft((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
                className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-white/70"
              />
            </label>
            <button
              type="submit"
              disabled={crewSaving || !isOnline}
              className="md:col-span-2 bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-white rounded-xl shadow-lg hover:-translate-y-1 transition-all px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {crewSaving ? 'Ukládám…' : 'Přidat člena'}
            </button>
          </form>
          <div className="grid gap-4 md:grid-cols-2">
            {crew.map((member) => (
              <div key={member.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="flex items-center gap-3">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/10 text-lg font-semibold text-white">
                      {member.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-a2">{member.role}</p>
                  </div>
                </div>
                {member.description && <p className="mt-3 text-xs text-white/60">{member.description}</p>}
                <button
                  type="button"
                  onClick={() => handleDeleteCrewMember(member)}
                  disabled={!isOnline}
                  className="mt-4 w-full rounded-xl border border-white/20 px-3 py-2 text-xs text-white/70 hover:border-rose-300 hover:text-rose-200"
                >
                  Smazat člena
                </button>
              </div>
            ))}
            {crew.length === 0 && <p className="text-sm text-white/60">Tým zatím nemá žádné členy.</p>}
          </div>
        </section>

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Rezervace</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/70">
              <thead className="text-xs uppercase text-white/50">
                <tr>
                  <th className="px-3 py-2">Čas</th>
                  <th className="px-3 py-2">Akce</th>
                  <th className="px-3 py-2">Jméno</th>
                  <th className="px-3 py-2">E-mail</th>
                  <th className="px-3 py-2">Počet</th>
                  <th className="px-3 py-2">Cena</th>
                  <th className="px-3 py-2">Poznámka</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{formatDateTime(item.createdAt)}</td>
                    <td className="px-3 py-2">{item.eventTitle}</td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.email}</td>
                    <td className="px-3 py-2">{item.count}</td>
                    <td className="px-3 py-2">{item.price ? `${item.price} Kč` : '-'}</td>
                    <td className="px-3 py-2">{item.note || '-'}</td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-center text-sm text-white/50" colSpan={7}>
                      Žádné rezervace.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Recenze</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{review.name}</p>
                    <p className="text-xs text-white/50">{formatDateTime(review.createdAt)}</p>
                  </div>
                  <div className="text-yellow-300">{'★'.repeat(review.stars || 0)}</div>
                </div>
                {(review.message ?? review.text) && (
                  <p className="mt-3 text-sm text-white/70">{review.message ?? review.text}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleReviewApproval(review, !review.approved)}
                    disabled={!isOnline}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs text-white/70 hover:border-a1/60 hover:text-white"
                  >
                    {review.approved ? 'Zrušit schválení' : 'Schválit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(review)}
                    disabled={!isOnline}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs text-white/70 hover:border-rose-300 hover:text-rose-200"
                  >
                    Smazat
                  </button>
                  <span className={`pill ${review.approved ? 'text-a2' : 'text-amber-200/80'}`}>
                    {review.approved ? 'Schváleno' : 'Čeká na schválení'}
                  </span>
                </div>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-sm text-white/60">Žádné recenze.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
export default function App() {
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [pollOptions, setPollOptions] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('Jaké téma chcete příště?');
  const [heroTags, setHeroTags] = useState([]);
  const [crew, setCrew] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showReservation, setShowReservation] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [lightboxState, setLightboxState] = useState({ open: false, photos: [], index: 0 });
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const firebaseReady = isFirebaseConfigured && !!db;

  useEffect(() => {
    if (!firebaseReady) {
      setEvents(sampleEvents.map((item) => ({ ...item })));
      return undefined;
    }
    const eventsQuery = query(collection(db, 'events'), orderBy('startDate'));
    return onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setReservations(sampleReservations.map((item) => ({ ...item })));
      return undefined;
    }
    const reservationQuery = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    return onSnapshot(reservationQuery, (snapshot) => {
      setReservations(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setGallery(sampleGallery.map((item) => ({ ...item })));
      return undefined;
    }
    const galleryQuery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    return onSnapshot(galleryQuery, (snapshot) => {
      setGallery(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setPollOptions(samplePollOptions.map((item) => ({ ...item })));
      return undefined;
    }
    const pollQuery = query(collection(db, 'pollOptions'), orderBy('createdAt'));
    return onSnapshot(pollQuery, (snapshot) => {
      setPollOptions(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setHeroTags(sampleHeroTags.map((item) => ({ ...item })));
      return undefined;
    }
    const heroQuery = query(collection(db, 'heroTags'), orderBy('createdAt'));
    return onSnapshot(heroQuery, (snapshot) => {
      setHeroTags(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setCrew(sampleCrew.map((item) => ({ ...item })));
      return undefined;
    }
    const crewQuery = query(collection(db, 'crew'), orderBy('createdAt'));
    return onSnapshot(crewQuery, (snapshot) => {
      setCrew(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setReviews(sampleReviews.map((item) => ({ ...item })));
      return undefined;
    }
    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    return onSnapshot(reviewsQuery, (snapshot) => {
      setReviews(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setPollQuestion(samplePollQuestion);
      return undefined;
    }
    const pollDoc = doc(db, 'poll', 'settings');
    return onSnapshot(pollDoc, (snapshot) => {
      if (snapshot.exists()) {
        setPollQuestion(snapshot.data().question || 'Jaké téma chcete příště?');
      }
    });
  }, [firebaseReady]);

  const reservationTotals = useMemo(() => {
    const map = new Map();
    reservations.forEach((item) => {
      const current = map.get(item.eventId) ?? 0;
      map.set(item.eventId, current + (item.count ?? 0));
    });
    return map;
  }, [reservations]);

  const now = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const upcomingEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = ensureDate(event.startDate);
      return eventDate && eventDate >= now;
    });
  }, [events, now]);

  const pastEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = ensureDate(event.startDate);
      return eventDate && eventDate < now;
    });
  }, [events, now]);

  const approvedReviews = useMemo(() => reviews.filter((review) => review.approved), [reviews]);
  const totalVotes = pollOptions.reduce((sum, option) => sum + (option.votes || 0), 0);

  const stats = {
    upcoming: upcomingEvents.length,
    past: pastEvents.length,
    attendees: reservations.reduce((sum, item) => sum + (item.count ?? 0), 0),
    reviews: approvedReviews.length,
  };

  const marqueeImages = useMemo(() => {
    const images = gallery.map((item) => item.imageUrl).filter(Boolean);
    events.forEach((event) => {
      (event.photos || []).forEach((photo) => {
        if (typeof photo === 'string') {
          images.push(photo);
        }
      });
    });
    return images;
  }, [events, gallery]);

  const handleCreateReservation = async (payload) => {
    if (!firebaseReady) {
      setReservations((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, ...payload, createdAt: new Date() },
      ]);
      return;
    }
    await addDoc(collection(db, 'reservations'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  };

  const handleVote = async (optionId) => {
    if (!optionId) return;
    if (!firebaseReady) {
      setPollOptions((prev) =>
        prev.map((option) =>
          option.id === optionId
            ? { ...option, votes: (option.votes || 0) + 1 }
            : option,
        ),
      );
      return;
    }
    try {
      await updateDoc(doc(db, 'pollOptions', optionId), { votes: increment(1) });
    } catch (err) {
      alert(err.message || 'Hlasování se nepodařilo uložit.');
    }
  };

  const handleSubmitReview = async ({ name, rating, message }) => {
    if (!firebaseReady) {
      setReviews((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          name,
          rating,
          stars: rating,
          message,
          approved: true,
          createdAt: new Date(),
        },
      ]);
      return;
    }
    await addDoc(collection(db, 'reviews'), {
      name,
      rating,
      stars: rating,
      message,
      approved: false,
      createdAt: serverTimestamp(),
    });
  };

  const handleOpenReservation = (eventId) => {
    setSelectedEventId(eventId || '');
    setShowReservation(true);
  };

  const handleCloseReservation = () => {
    setShowReservation(false);
    setSelectedEventId('');
  };

  const handleShowPhotos = (eventId, startIndex = 0) => {
    const event = events.find((item) => item.id === eventId);
    const photos = (event?.photos || []).filter(Boolean);
    if (!photos.length) return;
    setLightboxState({ open: true, photos, index: startIndex });
  };

  const handleNavigateLightbox = (nextIndex) => {
    setLightboxState((prev) => {
      const total = prev.photos.length;
      if (!total) return prev;
      const normalized = (nextIndex + total) % total;
      return { ...prev, index: normalized };
    });
  };

  const handleCloseLightbox = () => {
    setLightboxState({ open: false, photos: [], index: 0 });
  };

  const handleAdminLogin = (event) => {
    event.preventDefault();
    if (!ADMIN_PASSWORD) {
      setAdminError('Není nastavené heslo admina (VITE_ADMIN_PASSWORD).');
      return;
    }
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminPassword('');
      setAdminError('');
      setShowAdminPrompt(false);
    } else {
      setAdminError('Nesprávné heslo.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminPrompt(false);
  };

  return (
    <div className="min-h-screen bg-poznej font-rubik text-white">
      <div className="mx-auto max-w-6xl px-4 pb-20">
        {!firebaseReady && (
          <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100">
            Tento náhled běží bez propojení na Firebase. Data se ukládají pouze v rámci aktuální relace.
          </div>
        )}
        <header className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-a1 to-a2 text-2xl font-extrabold text-[#071022] shadow-xl">
              PH
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Poznej &amp; Hraj</h1>
              <p className="text-sm text-white/70">
                Zábavné večery plné her, kvízů a nových známostí — přijď, zahraj si, poznej lidi.
              </p>
            </div>
          </div>
          <nav className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm shadow-lg backdrop-blur">
            <ul className="flex flex-wrap items-center gap-3 text-white/70">
              <li>
                <a className="hover:text-white" href="#about">
                  O projektu
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="#stats">
                  Statistiky
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="#events">
                  Akce
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="#gallery">
                  Galerie
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="#poll">
                  Anketa
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="#reviews">
                  Recenze
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="#crew">
                  Crew
                </a>
              </li>
            </ul>
          </nav>
        </header>

        <section className="hero-card" id="hero">
          <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-center">
            <div className="flex-1">
              <button
                type="button"
                onClick={() => handleOpenReservation('')}
                className="mb-6 self-start rounded-full bg-gradient-to-r from-a1 to-a2 px-5 py-2 text-sm font-semibold text-[#071022] shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
              >
                Rezervuj místo 🔔 Kapacita se rychle plní
              </button>
              <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
                Místo, kde se lidé potkávají přirozeně
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Žádné trapné ticho. Hry, výzvy a soutěže jsou perfektní ledoborce. Organizujeme večery, na které se chceš vracet.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {heroTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:border-a1/50 hover:text-white"
                  >
                    {tag.label}
                  </span>
                ))}
                {heroTags.length === 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                    🎮 Herní turnaje
                  </span>
                )}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <a
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:-translate-y-1 hover:shadow-lg"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  📸
                </a>
                <a
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:-translate-y-1 hover:shadow-lg"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  📘
                </a>
                <p className="text-sm text-white/60">
                  Sleduj momentky a označ <strong>@poznejahraj</strong>
                </p>
              </div>
            </div>
            <div className="flex-1">
              <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
                <iframe
                  title="Promo video"
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/5jK8L3j4Z_4"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        <main className="mt-12 space-y-12">
          <section className="card" id="about">
            <h3 className="text-xl font-semibold text-white">O projektu</h3>
            <p className="mt-4 text-white/70">
              <strong className="text-white">Poznej &amp; Hraj</strong> vzniklo z touhy spojovat lidi jinak — ne přes aplikace, ale skrze zážitky,
              hry a skutečné emoce. Každý večer má svůj příběh, atmosféru a moderátory, kteří pomáhají, aby se každý cítil vítaný.
            </p>
            <p className="mt-4 text-white/70">
              Program vede tým moderátorů. Dáváme dohromady mix aktivit: kvízy, mini-hry, výzvy v týmech i úkoly pro dvojice. Díky řízenému
              programu se i introverti snadno zapojí a seznámení působí přirozeně.
            </p>
          </section>

          <section className="card" id="stats">
            <h3 className="text-xl font-semibold text-white">Naše akce v číslech</h3>
            <p className="mt-1 text-sm text-white/60">Aktualizované statistiky z posledních akcí</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-glass">
                <div className="text-3xl font-extrabold text-a2">{stats.upcoming}</div>
                <div className="mt-2 text-sm text-white/70">naplánovaných akcí</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-glass">
                <div className="text-3xl font-extrabold text-a2">{stats.past}</div>
                <div className="mt-2 text-sm text-white/70">předešlých akcí</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-glass">
                <div className="text-3xl font-extrabold text-a2">{stats.attendees}</div>
                <div className="mt-2 text-sm text-white/70">účastníků celkem</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-glass">
                <div className="text-3xl font-extrabold text-a2">{stats.reviews}</div>
                <div className="mt-2 text-sm text-white/70">recenzí</div>
              </div>
            </div>
          </section>

          <section className="card space-y-8" id="events">
            <div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Nadcházející akce</h3>
                  <p className="text-sm text-white/60">Vyber termín a rezervuj místo</p>
                </div>
                <span className="text-sm text-white/60">{upcomingEvents.length} akcí</span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    available={typeof event.capacity === 'number' ? (event.capacity ?? 0) - (reservationTotals.get(event.id) ?? 0) : undefined}
                    onReserve={handleOpenReservation}
                    onShowPhotos={handleShowPhotos}
                  />
                ))}
                {upcomingEvents.length === 0 && <p className="text-sm text-white/60">Žádné akce nejsou vypsané. Sleduj nás!</p>}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Předešlé akce</h3>
                  <p className="text-sm text-white/60">Fotodokumentace ke každé akci</p>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    available={undefined}
                    onReserve={handleOpenReservation}
                    onShowPhotos={handleShowPhotos}
                  />
                ))}
                {pastEvents.length === 0 && <p className="text-sm text-white/60">Archiv se připravuje.</p>}
              </div>
            </div>
            <div className="space-y-4" id="gallery">
              <h3 className="text-xl font-semibold text-white">Naše momentky &amp; vaše #IG</h3>
              <p className="text-sm text-white/60">
                📸 Již brzy připojíme náš Instagram feed — sleduj nás na <strong>@poznejahraj</strong>.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {gallery.slice(0, 6).map((item) => (
                  <img
                    key={item.id}
                    src={item.imageUrl}
                    alt={item.name || 'Momentka z Poznej & Hraj'}
                    className="h-40 w-full rounded-2xl border border-white/10 object-cover shadow-lg"
                  />
                ))}
                {gallery.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/60">
                    Galerie se teprve plní.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="card" id="poll">
            <h3 className="text-xl font-semibold text-white">Anketa: Téma příštího večera</h3>
            <p className="mt-1 text-sm text-white/60">Hlasuj, na co máš chuť příště.</p>
            <div className="mt-6 grid gap-4">
              {pollOptions.map((option) => (
                <PollOption key={option.id} option={option} totalVotes={totalVotes} onVote={handleVote} />
              ))}
              {pollOptions.length === 0 && <p className="text-sm text-white/60">Anketa zatím nemá žádné možnosti.</p>}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[2fr_1fr]" id="reviews">
            <section className="card">
              <h3 className="text-xl font-semibold text-white">Recenze</h3>
              <p className="mt-1 text-sm text-white/60">Co říkají účastníci</p>
              <ul className="mt-6 space-y-4 text-sm text-white/75">
                {approvedReviews.map((review) => {
                  const message = review.message ?? review.text ?? '';
                  return (
                    <li key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
                      „{message}“ — <span className="font-semibold">{review.name}</span>
                    </li>
                  );
                })}
                {approvedReviews.length === 0 && (
                  <li className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                    Recenze zatím čekají na schválení.
                  </li>
                )}
              </ul>
              <ReviewForm onSubmit={handleSubmitReview} disabled={false} />
              {!firebaseReady && (
                <p className="text-xs text-white/50">
                  Tento formulář v náhledu uchovává recenze pouze lokálně. Pro veřejné ukládání přidej Firebase konfiguraci.
                </p>
              )}
            </section>
            <section className="card" id="crew">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">The Crew</h3>
                  <p className="text-sm text-white/60">Lidé, kteří za tím stojí</p>
                </div>
                <span className="text-sm text-white/60">{crew.length} členů</span>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-1">
                {crew.map((member) => (
                  <article
                    key={member.id}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-lg"
                  >
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="h-24 w-24 rounded-full border border-white/20 object-cover shadow-lg"
                      />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold text-white">
                        {member.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-a2">{member.role}</p>
                    </div>
                    <p className="text-sm text-white/70">{member.description}</p>
                  </article>
                ))}
                {crew.length === 0 && <p className="text-sm text-white/60">Tým zatím představíme brzy.</p>}
              </div>
            </section>
          </section>

          <section className="card" id="feedback">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-a1/60 bg-a1/30 text-2xl">💬</div>
              <div>
                <h3 className="text-xl font-semibold text-white">Chceš, abychom uspořádali večer i pro tebe?</h3>
                <p className="text-sm text-white/70">
                  Máš nápad, přání nebo zpětnou vazbu? Napiš nám – připravíme program na míru a rádi si poslechneme tvůj názor.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <FeedbackForm />
            </div>
          </section>
        </main>

        <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Poznej &amp; Hraj · Těšíme se na další společnou hru!
        </footer>
      </div>

      <button
        type="button"
        onClick={() => handleOpenReservation('')}
        className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] px-6 py-3 text-sm font-semibold text-[#071022] shadow-xl transition hover:-translate-y-1"
      >
        Rezervovat místo
      </button>

      <button
        type="button"
        onClick={() => (isAdmin ? handleAdminLogout() : setShowAdminPrompt(true))}
        className="fixed bottom-6 right-6 z-30 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] px-5 py-3 text-sm font-semibold text-[#071022] shadow-xl transition hover:-translate-y-1"
      >
        {isAdmin ? 'Odhlásit admina' : 'Admin panel'}
      </button>

      {showAdminPrompt && !isAdmin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <form
            className="w-full max-w-md space-y-4 rounded-3xl border border-white/15 bg-[#071022] p-6 shadow-2xl"
            onSubmit={handleAdminLogin}
          >
            <h2 className="text-xl font-semibold text-white">Admin přihlášení</h2>
            <p className="text-sm text-white/60">Zadej heslo pro vstup do administračního panelu.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white"
              placeholder="••••••••"
            />
            {adminError && <p className="text-sm text-rose-300">{adminError}</p>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdminPrompt(false);
                  setAdminPassword('');
                  setAdminError('');
                }}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-white/40 hover:text-white"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-white rounded-xl shadow-lg px-5 py-2 text-sm font-semibold"
              >
                Přihlásit
              </button>
            </div>
          </form>
        </div>
      )}

      <ReservationModal
        isOpen={showReservation}
        events={events}
        reservations={reservations}
        onClose={handleCloseReservation}
        selectedEventId={selectedEventId}
        onSubmitReservation={handleCreateReservation}
        isOnline={firebaseReady}
      />

      <Lightbox
        isOpen={lightboxState.open}
        photos={lightboxState.photos}
        currentIndex={lightboxState.index}
        onClose={handleCloseLightbox}
        onNavigate={handleNavigateLightbox}
      />

      {isAdmin && (
        <AdminPanel
          onClose={() => setIsAdmin(false)}
          events={events}
          reservations={reservations}
          gallery={gallery}
          pollOptions={pollOptions}
          pollQuestion={pollQuestion}
          heroTags={heroTags}
          crew={crew}
          reviews={reviews}
          isOnline={firebaseReady}
        />
      )}

      {marqueeImages.length > 0 && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-0 overflow-hidden border-t border-white/10 bg-white/5 py-4">
          <div className="marquee-track flex gap-6 opacity-80">
            {[...marqueeImages, ...marqueeImages].map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt="Poznej & Hraj moment"
                className="h-24 w-auto rounded-2xl border border-white/10 object-cover shadow-lg"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
