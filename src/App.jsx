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
  if (typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1_000_000);
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const fallback = new Date(value.replace(/\s+/g, ' '));
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return null;
}

const toNumber = (value) => {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

function normalizeEvent(raw) {
  if (!raw) return null;
  const startDate =
    ensureDate(raw.startDate) ||
    ensureDate(raw.start_time) ||
    ensureDate(raw.start) ||
    ensureDate(raw.date) ||
    ensureDate(raw.when) ||
    ensureDate(raw.datetime) ||
    ensureDate(raw.timestamp);

  const capacity =
    toNumber(raw.capacity) ??
    toNumber(raw.cap) ??
    toNumber(raw.maxCapacity) ??
    toNumber(raw.maxParticipants);

  const price =
    toNumber(raw.price) ??
    toNumber(raw.cost) ??
    toNumber(raw.fee) ??
    toNumber(raw.ticketPrice);

  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : typeof raw.tags === 'string'
      ? raw.tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  let photos = [];
  if (Array.isArray(raw.photos)) {
    photos = raw.photos;
  } else if (Array.isArray(raw.photoUrls)) {
    photos = raw.photoUrls;
  } else if (raw.photos && typeof raw.photos === 'object') {
    photos = Object.values(raw.photos).filter(Boolean);
  } else if (raw.gallery && Array.isArray(raw.gallery)) {
    photos = raw.gallery;
  }

  return {
    ...raw,
    title: raw.title || raw.name || raw.heading || 'Bez názvu',
    description: raw.description || raw.desc || raw.summary || '',
    place: raw.place || raw.location || raw.venue || '',
    startDate,
    capacity,
    price,
    tags,
    photos,
  };
}

function normalizeGalleryItem(raw) {
  if (!raw) return null;
  const imageUrl = raw.imageUrl || raw.url || raw.src || raw.downloadURL || raw.photoUrl;
  if (!imageUrl) return null;
  return {
    ...raw,
    id: raw.id || raw.uid || imageUrl,
    name: raw.name || raw.label || 'photo',
    imageUrl,
  };
}

function normalizeHeroTag(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const label = raw.trim();
    if (!label) return null;
    return { id: label, label };
  }
  const label = (raw.label || raw.text || raw.value || '').toString().trim();
  if (!label) return null;
  return {
    ...raw,
    id: raw.id || raw.uid || label || JSON.stringify(raw),
    label,
  };
}

function normalizeCrewMember(raw) {
  if (!raw) return null;
  return {
    ...raw,
    id: raw.id || raw.uid || raw.email || raw.name || JSON.stringify(raw),
    name: raw.name || raw.fullName || 'Člen týmu',
    role: raw.role || raw.position || '',
    description: raw.description || raw.desc || raw.bio || '',
    photoUrl: raw.photoUrl || raw.photo || raw.avatar || raw.imageUrl || raw.image || '',
  };
}

function normalizePollOption(raw) {
  if (!raw) return null;
  return {
    ...raw,
    id: raw.id || raw.uid || raw.title || JSON.stringify(raw),
    title: raw.title || raw.label || raw.option || 'Možnost',
    description: raw.description || raw.desc || '',
    votes: typeof raw.votes === 'number' ? raw.votes : Number(raw.votes) || 0,
  };
}

function normalizeReview(raw) {
  if (!raw) return null;
  return {
    ...raw,
    id: raw.id || raw.uid || raw.name || JSON.stringify(raw),
    name: raw.name || raw.author || 'Anonym',
    message: raw.message || raw.text || raw.review || '',
    stars: typeof raw.stars === 'number' ? raw.stars : typeof raw.rating === 'number' ? raw.rating : 5,
    rating: typeof raw.rating === 'number' ? raw.rating : undefined,
    approved: raw.approved ?? raw.visible ?? false,
  };
}

function normalizeReservation(raw) {
  if (!raw) return null;
  return {
    ...raw,
    id: raw.id || raw.uid || JSON.stringify(raw),
    count: toNumber(raw.count) ?? 1,
    createdAt: ensureDate(raw.createdAt) || new Date(),
    eventId: raw.eventId || raw.event || raw.eventRef || '',
    eventTitle: raw.eventTitle || raw.eventName || raw.event || raw.title || '',
    price: toNumber(raw.price) ?? toNumber(raw.totalPrice) ?? toNumber(raw.amount) ?? null,
    guests: Array.isArray(raw.guests)
      ? raw.guests
      : typeof raw.guests === 'string'
        ? raw.guests
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
  };
}

function formatDateTime(value) {
  const date = ensureDate(value);
  if (!date) return '';
  return date
    .toLocaleString('cs-CZ', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replaceAll('.', '.');
}

function formatDateLabel(value) {
  const date = ensureDate(value);
  if (!date) return { day: '', month: '' };
  return {
    day: date.toLocaleDateString('cs-CZ', { day: '2-digit' }),
    month: date.toLocaleDateString('cs-CZ', { month: 'short' }),
  };
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
    return events
      .filter((event) => {
        const date = ensureDate(event.startDate);
        if (!date) return true;
        return date >= now;
      })
      .sort((a, b) => {
        const aDate = ensureDate(a.startDate) ?? new Date(8640000000000000);
        const bDate = ensureDate(b.startDate) ?? new Date(8640000000000000);
        return aDate - bDate;
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
    <div className="modal-back" style={{ display: 'flex' }}>
      <div className="modal">
        <button
          onClick={onClose}
          style={{ position: 'sticky', top: 0, float: 'right', background: 'transparent', border: 'none', color: '#9aa6b2', cursor: 'pointer', zIndex: 2 }}
        >
          ✕
        </button>
        <h2>Rezervace</h2>
        {!isOnline && (
          <div className="pill" style={{ border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.05)', color: '#ffd166', marginTop: '6px' }}>
            Tento náhled běží bez propojení na Firebase. Rezervace se ukládají pouze v rámci relace.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label>Vyber událost</label>
          <select value={form.eventId} onChange={(e) => handleChange('eventId', e.target.value)}>
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
          {selectedEvent && (
            <div className="pill" style={{ marginTop: '8px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#cfe3ff' }}>
              📅 {formatDateTime(selectedEvent.startDate)}
              {selectedEvent.place ? ` • 📍 ${selectedEvent.place}` : ''}
              {selectedEvent.price ? ` • 💳 ${selectedEvent.price} Kč` : ''}
              {typeof selectedEvent.capacity === 'number'
                ? ` • Volná místa: ${Math.max(0, availableSeats)}/${selectedEvent.capacity}`
                : ' • Kapacita: bez omezení'}
            </div>
          )}
          <label>Jméno a příjmení
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
          </label>
          <label>E-mail
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
          </label>
          <label>Telefon
            <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          </label>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
            <div>
              <label>Pohlaví</label>
              <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">— vyber —</option>
                <option value="muž">Kluk / muž</option>
                <option value="žena">Holka / žena</option>
                <option value="jiné">Jiné / neuvádět</option>
              </select>
            </div>
            <div>
              <label>Věk</label>
              <select value={form.age} onChange={(e) => handleChange('age', e.target.value)}>
                <option value="">— vyber —</option>
                <option>18–22</option>
                <option>23–27</option>
                <option>28–32</option>
                <option>33–37</option>
                <option>38–45</option>
                <option>46+</option>
              </select>
            </div>
            <div>
              <label>Stav</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="">— vyber —</option>
                <option>nezadaný/á</option>
                <option>zadaný/á</option>
                <option>je to složité</option>
              </select>
            </div>
          </div>
          <label style={{ marginTop: '8px' }}>Očekávání od akce (co tě láká?)
            <textarea rows={3} value={form.expectation} onChange={(e) => handleChange('expectation', e.target.value)} />
          </label>
          <label style={{ marginTop: '10px' }}>Počet osob
            <select value={form.count} onChange={(e) => handleChange('count', Number(e.target.value))}>
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className="guests-list">
            {guestInputs.map((index) => (
              <div key={index} className="ghost">
                <label>Jméno hosta {index + 1}
                  <input type="text" value={form.guests[index] || ''} onChange={(e) => handleGuestChange(index, e.target.value)} />
                </label>
              </div>
            ))}
          </div>
          <label>Poznámka
            <textarea rows={3} value={form.note} onChange={(e) => handleChange('note', e.target.value)} />
          </label>
          {error && <div className="pill" style={{ color: '#ffb4d0', marginTop: '10px' }}>{error}</div>}
          {successMessage && <div className="pill" style={{ color: '#6bf0c1', marginTop: '10px' }}>{successMessage}</div>}
          <div className="confirm">
            <div className="small-muted">Dotazy? Piš na <a href="mailto:poznejahraj@seznam.cz">poznejahraj@seznam.cz</a></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-join" type="button" onClick={onClose} disabled={submitting}>
                Zrušit
              </button>
              <button className="btn-join" type="submit" disabled={submitting} style={{ borderColor: '#38bdf8', color: '#38bdf8' }}>
                {submitting ? 'Odesílám…' : 'Odeslat rezervaci'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Lightbox({ isOpen, photos, currentIndex, onClose, onNavigate }) {
  if (!isOpen || !photos.length) return null;

  return (
    <div className="lightbox" style={{ display: 'flex' }}>
      <button className="icon-btn" onClick={() => onNavigate(currentIndex - 1)} style={{ position: 'absolute', left: '24px' }}>
        ◀
      </button>
      <img src={photos[currentIndex]} alt="event" />
      <button className="icon-btn" onClick={() => onNavigate(currentIndex + 1)} style={{ position: 'absolute', right: '24px' }}>
        ▶
      </button>
      <div className="controls">
        <button className="icon-btn" onClick={onClose}>
          Zavřít
        </button>
      </div>
    </div>
  );
}
function AdminPanel({
  isOpen,
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

  if (!isOpen) return null;

  const requireOnline = () => {
    if (!isOnline || !db) {
      alert('Tato akce vyžaduje nastavení Firebase (.env konfiguraci).');
      return true;
    }
    return false;
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    if (requireOnline()) return;
    setUploadingEvent(true);
    try {
      if (!eventForm.title || !eventForm.when) {
        throw new Error('Vyplň název i datum.');
      }
      const parsedDate = new Date(eventForm.when);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error('Datum nemá správný formát.');
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
    if (requireOnline()) return;
    await deleteDoc(doc(db, 'events', eventId));
  };

  const handleGalleryUpload = async (file) => {
    if (!file) return;
    if (requireOnline()) return;
    setUploadingGallery(true);
    try {
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
    if (requireOnline()) return;
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
    if (requireOnline()) return;
    setPollLoading(true);
    try {
      await addDoc(collection(db, 'pollOptions'), {
        title,
        description: description || '',
        votes: 0,
        createdAt: serverTimestamp(),
      });
      event.currentTarget.reset();
    } catch (err) {
      alert(err.message || 'Nepodařilo se uložit možnost.');
    } finally {
      setPollLoading(false);
    }
  };

  const handleDeletePollOption = async (optionId) => {
    if (!window.confirm('Smazat možnost ankety?')) return;
    if (requireOnline()) return;
    await deleteDoc(doc(db, 'pollOptions', optionId));
  };

  const handleResetVotes = async () => {
    if (!window.confirm('Vynulovat hlasy?')) return;
    if (requireOnline()) return;
    const batchRef = collection(db, 'pollOptions');
    await Promise.all(
      pollOptions.map((option) => updateDoc(doc(batchRef, option.id), { votes: 0 })),
    );
  };

  const handleSaveQuestion = async () => {
    if (requireOnline()) return;
    setSavingQuestion(true);
    try {
      await setDoc(doc(db, 'poll', 'settings'), { question }, { merge: true });
    } catch (err) {
      alert(err.message || 'Otázku se nepodařilo uložit.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleAddHeroTag = async (event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('tag')?.toString().trim();
    if (!value) return;
    if (requireOnline()) return;
    try {
      await addDoc(collection(db, 'heroTags'), {
        label: value,
        createdAt: serverTimestamp(),
      });
      event.currentTarget.reset();
    } catch (err) {
      alert(err.message || 'Tag se nepodařilo uložit.');
    }
  };

  const handleDeleteHeroTag = async (tagId) => {
    if (!window.confirm('Smazat tag?')) return;
    if (requireOnline()) return;
    await deleteDoc(doc(db, 'heroTags', tagId));
  };

  const handleAddCrew = async (event) => {
    event.preventDefault();
    if (!crewDraft.name || !crewDraft.role) {
      alert('Vyplň jméno i roli.');
      return;
    }
    if (requireOnline()) return;
    setCrewSaving(true);
    try {
      let photoUrl = '';
      let storagePath = '';
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
        storagePath,
        createdAt: serverTimestamp(),
      });
      setCrewDraft({ name: '', role: '', description: '', file: null });
    } catch (err) {
      alert(err.message || 'Člena se nepodařilo uložit.');
    } finally {
      setCrewSaving(false);
    }
  };

  const handleDeleteCrew = async (member) => {
    if (!window.confirm('Smazat člena?')) return;
    if (requireOnline()) return;
    await deleteDoc(doc(db, 'crew', member.id));
    if (member.storagePath) {
      try {
        await deleteObject(ref(storage, member.storagePath));
      } catch (err) {
        console.warn('Nelze smazat obrázek člena', err);
      }
    }
  };

  const handleToggleReview = async (review) => {
    if (requireOnline()) return;
    await updateDoc(doc(db, 'reviews', review.id), { approved: !review.approved });
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm('Smazat recenzi?')) return;
    if (requireOnline()) return;
    await deleteDoc(doc(db, 'reviews', review.id));
  };

  const handleExportReservations = () => {
    if (!reservations.length) {
      alert('Žádné rezervace k exportu.');
      return;
    }
    const header = ['createdAt', 'eventTitle', 'name', 'email', 'phone', 'gender', 'age', 'status', 'expectation', 'count', 'price', 'guests', 'note'];
    const csv = [header.join(',')]
      .concat(
        reservations.map((item) =>
          [
            JSON.stringify(item.createdAt),
            JSON.stringify(item.eventTitle || ''),
            JSON.stringify(item.name || ''),
            JSON.stringify(item.email || ''),
            JSON.stringify(item.phone || ''),
            JSON.stringify(item.gender || ''),
            JSON.stringify(item.age || ''),
            JSON.stringify(item.status || ''),
            JSON.stringify(item.expectation || ''),
            JSON.stringify(item.count ?? 0),
            JSON.stringify(item.price ?? ''),
            JSON.stringify((item.guests || []).join('; ')),
            JSON.stringify(item.note || ''),
          ].join(','),
        ),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'poznej_a_hraj_reservations.csv';
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur px-4 py-10">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1220]/95 p-8 text-white shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Admin panel</h2>
            <p className="text-sm text-white/60">Spravuj obsah Poznej &amp; Hraj v reálném čase.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOnline ? 'bg-a2/20 text-a2' : 'bg-yellow-400/20 text-yellow-200'}`}>
              {isOnline ? 'Online' : 'Demo režim'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-a2/40 hover:text-a2"
            >
              Zavřít
            </button>
          </div>
        </header>

        {!isOnline && (
          <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
            Připoj Firebase pro plnohodnotnou správu obsahu (uploady, editace, ankety…).
          </div>
        )}

        <section className="mt-8 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Nová akce</h3>
            <p className="text-sm text-white/60">Vyplň detaily a nahraj náhledové fotky (max. 5).</p>
            <form id="createForm" onSubmit={handleCreateEvent} className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm text-white/70">
                Název
                <input
                  value={eventForm.title}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a2 focus:outline-none focus:ring-2 focus:ring-a2/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70">
                Datum (YYYY-MM-DD HH:MM)
                <input
                  value={eventForm.when}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, when: e.target.value }))}
                  placeholder="2025-11-20 19:00"
                  required
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70">
                Místo
                <input
                  value={eventForm.place}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, place: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70">
                Kapacita
                <input
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70 md:col-span-2">
                Popis
                <input
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70">
                Cena (Kč – volit.)
                <input
                  type="number"
                  value={eventForm.price}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70">
                Tagy (čárkou oddělené)
                <input
                  value={eventForm.tags}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70 md:col-span-2">
                Fotky akce (až 5)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setEventForm((prev) => ({ ...prev, files: Array.from(e.target.files || []).slice(0, 5) }))}
                  className="mt-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-a1 file:to-a2 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#071022]"
                />
              </label>
              <div className="md:col-span-2 flex justify-end">
                <button
                  className="rounded-full bg-gradient-to-r from-a1 to-a2 px-6 py-2 text-sm font-semibold text-[#071022] shadow-[0_12px_24px_rgba(139,92,246,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={uploadingEvent}
                >
                  {uploadingEvent ? 'Ukládám…' : 'Uložit akci'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Seznam akcí</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {events.map((event) => {
                const { day, month } = formatDateLabel(event.startDate);
                return (
                  <div key={event.id} className="rounded-2xl border border-white/10 bg-[#101b2f] p-4 shadow-lg shadow-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{event.title}</p>
                        <p className="text-xs text-white/60">{formatDateTime(event.startDate)}</p>
                        <p className="mt-2 text-xs text-white/60">
                          {event.place ? `📍 ${event.place} • ` : ''}
                          Kapacita: {event.capacity ?? '—'} | Cena: {event.price ?? '—'}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                        {day} · {month}
                      </span>
                    </div>
                    <button
                      className="mt-3 w-full rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 hover:border-red-300 hover:text-red-300"
                      type="button"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      Smazat
                    </button>
                  </div>
                );
              })}
              {!events.length && <p className="text-sm text-white/60">Žádné akce.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Galerie</h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-a1/40 hover:text-a1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleGalleryUpload(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                + Nahrát fotku
              </label>
              <span className="text-xs text-white/50">Max. velikost 5 MB</span>
              {uploadingGallery && <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Nahrávám…</span>}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {gallery.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-white/10">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-32 w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <button
                    className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2 py-1 text-xs font-semibold text-white/80 opacity-0 transition group-hover:opacity-100"
                    type="button"
                    onClick={() => handleDeleteGallery(item)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {!gallery.length && <p className="text-sm text-white/60">Žádné fotky.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Anketa</h3>
            <form onSubmit={handleAddPollOption} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col text-sm text-white/70">
                Název
                <input
                  name="title"
                  required
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70">
                Popis
                <input
                  name="description"
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
                <button
                  className="rounded-full bg-gradient-to-r from-a1 to-a2 px-5 py-2 text-xs font-semibold text-[#071022] shadow-[0_12px_24px_rgba(0,229,168,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={pollLoading}
                >
                  {pollLoading ? 'Přidávám…' : 'Přidat možnost'}
                </button>
                <button
                  className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold text-white/80 hover:border-a1/40 hover:text-a1"
                  type="button"
                  onClick={handleResetVotes}
                >
                  Vynulovat hlasy
                </button>
              </div>
            </form>
            <div className="mt-4 grid gap-3">
              <label className="flex flex-col text-sm text-white/70">
                Otázka ankety
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <button
                className="self-end rounded-full border border-white/20 px-5 py-2 text-xs font-semibold text-white/80 hover:border-a2/40 hover:text-a2"
                type="button"
                onClick={handleSaveQuestion}
                disabled={savingQuestion}
              >
                {savingQuestion ? 'Ukládám…' : 'Uložit otázku'}
              </button>
              {pollOptions.map((option) => (
                <div key={option.id} className="rounded-2xl border border-white/10 bg-[#101b2f] p-4">
                  <p className="text-sm font-semibold text-white">{option.title}</p>
                  <p className="text-xs text-white/60">{option.description}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/40">{option.votes} hlasů</p>
                  <button
                    className="mt-3 w-full rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 hover:border-red-300 hover:text-red-300"
                    type="button"
                    onClick={() => handleDeletePollOption(option.id)}
                  >
                    Smazat možnost
                  </button>
                </div>
              ))}
              {!pollOptions.length && <p className="text-sm text-white/60">Žádné možnosti.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Hero tagy</h3>
            <form onSubmit={handleAddHeroTag} className="mt-4 flex flex-wrap gap-3">
              <input
                name="tag"
                placeholder="např. 🎮 Herní turnaje"
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
              />
              <button className="rounded-full bg-gradient-to-r from-a1 to-a2 px-5 py-2 text-xs font-semibold text-[#071022] shadow-[0_12px_24px_rgba(0,229,168,0.25)]" type="submit">
                Přidat tag
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {heroTags.map((tag) => (
                <span
                  key={tag.id}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101b2f] px-3 py-1 text-xs text-white/70"
                >
                  {tag.label}
                  <button
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60 transition group-hover:border-red-300 group-hover:text-red-300"
                    type="button"
                    onClick={() => handleDeleteHeroTag(tag.id)}
                  >
                    Smazat
                  </button>
                </span>
              ))}
              {!heroTags.length && <p className="text-sm text-white/60">Žádné tagy.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Správa týmu</h3>
            <form onSubmit={handleAddCrew} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col text-sm text-white/70">
                Jméno
                <input
                  value={crewDraft.name}
                  onChange={(e) => setCrewDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70">
                Role
                <input
                  value={crewDraft.role}
                  onChange={(e) => setCrewDraft((prev) => ({ ...prev, role: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70 md:col-span-2">
                Popis
                <input
                  value={crewDraft.description}
                  onChange={(e) => setCrewDraft((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
                />
              </label>
              <label className="flex flex-col text-sm text-white/70 md:col-span-2">
                Fotka
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCrewDraft((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
                  className="mt-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-a1 file:to-a2 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#071022]"
                />
              </label>
              <div className="md:col-span-2 flex justify-end">
                <button className="rounded-full bg-gradient-to-r from-a1 to-a2 px-5 py-2 text-xs font-semibold text-[#071022] shadow-[0_12px_24px_rgba(139,92,246,0.25)] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={crewSaving}>
                  {crewSaving ? 'Přidávám…' : 'Přidat člena'}
                </button>
              </div>
            </form>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {crew.map((member) => (
                <div key={member.id} className="rounded-2xl border border-white/10 bg-[#101b2f] p-4">
                  <div className="flex items-center gap-3">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="h-16 w-16 rounded-full border border-white/20 object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-white/20 text-sm text-white/60">{member.name?.slice(0, 2).toUpperCase()}</div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      <p className="text-xs text-a2">{member.role}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/60">{member.description}</p>
                  <button className="mt-3 w-full rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 hover:border-red-300 hover:text-red-300" type="button" onClick={() => handleDeleteCrew(member)}>
                    Smazat člena
                  </button>
                </div>
              ))}
              {!crew.length && <p className="text-sm text-white/60">Tým zatím představíme.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Rezervace</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs text-white/70">
                <thead className="text-[11px] uppercase tracking-[0.3em] text-white/40">
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
                <tbody className="divide-y divide-white/5">
                  {reservations.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-white/60">{item.createdAt ? new Date(item.createdAt).toLocaleString('cs-CZ') : ''}</td>
                      <td className="px-3 py-2 text-white/80">{item.eventTitle}</td>
                      <td className="px-3 py-2 text-white/80">{item.name}</td>
                      <td className="px-3 py-2 text-white/60">{item.email}</td>
                      <td className="px-3 py-2 text-white/60">{item.count}</td>
                      <td className="px-3 py-2 text-white/60">{item.price ?? ''}</td>
                      <td className="px-3 py-2 text-white/60">{item.note}</td>
                    </tr>
                  ))}
                  {!reservations.length && (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-white/60">
                        Zatím žádné rezervace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-3">
              <button className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:border-a1/40 hover:text-a1" type="button" onClick={handleExportReservations}>
                Export CSV
              </button>
              <button className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:border-a2/40 hover:text-a2" type="button" onClick={onClose}>
                Zavřít panel
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Recenze</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-white/10 bg-[#101b2f] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{review.name}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${review.approved ? 'bg-a2/20 text-a2' : 'bg-yellow-400/20 text-yellow-200'}`}>
                      {review.approved ? 'Schváleno' : 'Čeká'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/60">{review.message}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 hover:border-a1/40 hover:text-a1" type="button" onClick={() => handleToggleReview(review)}>
                      {review.approved ? 'Skrýt' : 'Schválit'}
                    </button>
                    <button className="flex-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 hover:border-red-300 hover:text-red-300" type="button" onClick={() => handleDeleteReview(review)}>
                      Smazat
                    </button>
                  </div>
                </div>
              ))}
              {!reviews.length && <p className="text-sm text-white/60">Žádné recenze.</p>}
            </div>
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
      const items = sampleEvents
        .map((item) => normalizeEvent(item))
        .filter(Boolean)
        .sort((a, b) => {
          const aDate = ensureDate(a.startDate) ?? new Date(0);
          const bDate = ensureDate(b.startDate) ?? new Date(0);
          return aDate - bDate;
        });
      setEvents(items);
      return undefined;
    }
    const eventsRef = collection(db, 'events');
    return onSnapshot(eventsRef, (snapshot) => {
      const mapped = snapshot.docs
        .map((docSnap) => normalizeEvent({ id: docSnap.id, ...docSnap.data() }))
        .filter(Boolean)
        .sort((a, b) => {
          const aDate = ensureDate(a.startDate) ?? new Date(0);
          const bDate = ensureDate(b.startDate) ?? new Date(0);
          return aDate - bDate;
        });
      setEvents(mapped);
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setReservations(sampleReservations.map((item) => normalizeReservation(item)).filter(Boolean));
      return undefined;
    }
    const reservationRef = collection(db, 'reservations');
    return onSnapshot(reservationRef, (snapshot) => {
      const mapped = snapshot.docs
        .map((docSnap) => normalizeReservation({ id: docSnap.id, ...docSnap.data() }))
        .filter(Boolean)
        .sort((a, b) => {
          const aDate = ensureDate(a.createdAt) ?? new Date(0);
          const bDate = ensureDate(b.createdAt) ?? new Date(0);
          return bDate - aDate;
        });
      setReservations(mapped);
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setGallery(sampleGallery.map((item) => normalizeGalleryItem(item)).filter(Boolean));
      return undefined;
    }
    const galleryRef = collection(db, 'gallery');
    return onSnapshot(galleryRef, (snapshot) => {
      const mapped = snapshot.docs
        .map((docSnap) => normalizeGalleryItem({ id: docSnap.id, ...docSnap.data() }))
        .filter(Boolean)
        .sort((a, b) => {
          const aDate = ensureDate(a.createdAt) ?? new Date(0);
          const bDate = ensureDate(b.createdAt) ?? new Date(0);
          return bDate - aDate;
        });
      setGallery(mapped);
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setPollOptions(samplePollOptions.map((item) => normalizePollOption(item)).filter(Boolean));
      return undefined;
    }
    const pollRef = collection(db, 'pollOptions');
    return onSnapshot(pollRef, (snapshot) => {
      const mapped = snapshot.docs
        .map((docSnap) => normalizePollOption({ id: docSnap.id, ...docSnap.data() }))
        .filter(Boolean)
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setPollOptions(mapped);
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setHeroTags(sampleHeroTags.map((item) => normalizeHeroTag(item)).filter(Boolean));
      return undefined;
    }
    const heroRef = collection(db, 'heroTags');
    return onSnapshot(heroRef, (snapshot) => {
      const mapped = snapshot.docs
        .map((docSnap) => normalizeHeroTag({ id: docSnap.id, ...docSnap.data() }))
        .filter(Boolean)
        .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
      setHeroTags(mapped);
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setCrew(sampleCrew.map((item) => normalizeCrewMember(item)).filter(Boolean));
      return undefined;
    }
    const crewRef = collection(db, 'crew');
    return onSnapshot(crewRef, (snapshot) => {
      const mapped = snapshot.docs
        .map((docSnap) => normalizeCrewMember({ id: docSnap.id, ...docSnap.data() }))
        .filter(Boolean)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCrew(mapped);
    });
  }, [firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) {
      setReviews(sampleReviews.map((item) => normalizeReview(item)).filter(Boolean));
      return undefined;
    }
    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    return onSnapshot(reviewsQuery, (snapshot) => {
      const mapped = snapshot.docs
        .map((docSnap) => normalizeReview({ id: docSnap.id, ...docSnap.data() }))
        .filter(Boolean)
        .sort((a, b) => {
          const aDate = ensureDate(a.createdAt) ?? new Date(0);
          const bDate = ensureDate(b.createdAt) ?? new Date(0);
          return bDate - aDate;
        });
      setReviews(mapped);
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

  const upcomingEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = ensureDate(event.startDate);
        if (!eventDate) return true;
        return eventDate >= now;
      }),
    [events, now],
  );

  const pastEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = ensureDate(event.startDate);
        return eventDate && eventDate < now;
      }),
    [events, now],
  );

  const approvedReviews = useMemo(() => reviews.filter((review) => review.approved), [reviews]);
  const totalVotes = pollOptions.reduce((sum, option) => sum + (option.votes || 0), 0);

  const stats = {
    upcoming: upcomingEvents.length,
    past: pastEvents.length,
    attendees: reservations.reduce((sum, item) => sum + (item.count ?? 0), 0),
    reviews: approvedReviews.length,
  };

  const marqueeImages = useMemo(() => {
    const urls = new Set();
    gallery.forEach((item) => {
      if (item?.imageUrl) {
        urls.add(item.imageUrl);
      }
    });
    events.forEach((event) => {
      (event.photos || []).forEach((photo) => {
        if (photo) {
          urls.add(photo);
        }
      });
    });
    const list = Array.from(urls);
    if (list.length === 0) return [];
    return list.concat(list);
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

  const handleSmoothScroll = (event, anchor) => {
    event.preventDefault();
    const target = document.getElementById(anchor);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };
  return (
    <div style={{ minHeight: '100vh' }}>
      {!firebaseReady && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px' }}>
          <div className="pill" style={{ border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.05)', color: '#ffd166' }}>
            Tento náhled běží bez propojení na Firebase. Data se ukládají pouze v rámci aktuální relace.
          </div>
        </div>
      )}
      <header>
        <div className="brand">
          <div className="logo" aria-hidden="true">PH</div>
          <div>
            <h1>Poznej &amp; Hraj</h1>
            <p className="lead">Zábavné večery plné her, kvízů a nových známostí — přijď, zahraj si, poznej lidi.</p>
          </div>
        </div>
      </header>
      <nav className="topnav">
        <div className="topnav-inner">
          <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')}>O projektu</a>
          <a href="#stats" onClick={(e) => handleSmoothScroll(e, 'stats')}>Statistiky</a>
          <a href="#events" onClick={(e) => handleSmoothScroll(e, 'events')}>Akce</a>
          <a href="#gallery" onClick={(e) => handleSmoothScroll(e, 'gallery')}>Galerie</a>
          <a href="#poll" onClick={(e) => handleSmoothScroll(e, 'poll')}>Anketa</a>
          <a href="#reviews" onClick={(e) => handleSmoothScroll(e, 'reviews')}>Recenze</a>
          <a href="#crew" onClick={(e) => handleSmoothScroll(e, 'crew')}>Crew</a>
        </div>
      </nav>
      <section className="hero-full" id="hero">
        <div className="hero-inner">
          <button
            className="hero-cta"
            type="button"
            style={{ position: 'absolute', top: '16px', right: '16px' }}
            onClick={() => handleOpenReservation('')}
          >
            Rezervuj místo 🔔 Kapacita se rychle plní
          </button>
          <div className="hero">
            <h2>Místo, kde se lidé potkávají přirozeně</h2>
            <p>Žádné trapné ticho. Hry, výzvy a soutěže jsou perfektní ledoborce. Organizujeme večery, na které se chceš vracet.</p>
            <div className="tags">
              {heroTags.map((tag) => (
                <span key={tag.id} className="tag">
                  {tag.label || tag.value || tag.text || ''}
                </span>
              ))}
              {heroTags.length === 0 && <span className="tag">🎮 Herní turnaje</span>}
            </div>
            <div className="socials">
              <div className="ico" title="Instagram">
                <svg viewBox="0 0 24 24"><path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.75a1 1 0 100 2 1 1 0 000-2z" /></svg>
              </div>
              <div className="ico" title="Facebook">
                <svg viewBox="0 0 24 24"><path d="M13 22V12h3l1-4h-4V6a1 1 0 011-1h3V1h-3a5 5 0 00-5 5v2H6v4h3v10h4z" /></svg>
              </div>
              <div style={{ color: '#cfe3ff', opacity: 0.9, fontSize: '14px' }}>📸 Sleduj a sdílej momentky — označ <strong>@poznejahraj</strong></div>
            </div>
          </div>
          <div className="hero-video">
            <iframe
              title="Promo video"
              src="https://www.youtube.com/embed/5jK8L3j4Z_4"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>
      <main>
        <section className="card" id="about">
          <div><strong style={{ fontSize: '16px' }}>O projektu</strong><div className="small-muted">Proč to děláme a jak to funguje</div></div>
          <div style={{ height: '10px' }} />
          <div style={{ color: '#b8c4d1', lineHeight: 1.6 }}>
            <p><strong>Poznej &amp; Hraj</strong> vzniklo z touhy spojovat lidi jinak — ne přes aplikace, ale skrze zážitky, hry a skutečné emoce. Každý večer má svůj příběh, atmosféru a moderátory, kteří pomáhají, aby se každý cítil vítaný.</p>
            <p>Program vede tým moderátorů. Dáváme dohromady mix aktivit: kvízy, mini-hry, výzvy v týmech i úkoly pro dvojice. Díky řízenému programu se i introverti snadno zapojí a seznámení působí přirozeně.</p>
          </div>
        </section>
        <section className="card" id="stats">
          <div><strong style={{ fontSize: '16px' }}>Naše akce v číslech</strong><div className="small-muted">Aktualizuje se automaticky</div></div>
          <div style={{ height: '12px' }} />
          <div className="stats" id="statsBox">
            <div className="stat"><div className="n" id="st-upcoming">{stats.upcoming}</div><div className="l">naplánovaných akcí</div></div>
            <div className="stat"><div className="n" id="st-past">{stats.past}</div><div className="l">předešlých akcí</div></div>
            <div className="stat"><div className="n" id="st-attendees">{stats.attendees}</div><div className="l">účastníků celkem</div></div>
            <div className="stat"><div className="n" id="st-reviews">{stats.reviews}</div><div className="l">recenzí</div></div>
          </div>
        </section>
        <div className="grid" id="events">
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><strong style={{ fontSize: '16px' }}>Nadcházející akce</strong><div className="small-muted">Vyber termín a rezervuj místo</div></div>
              <div className="small-muted" id="events-count">{upcomingEvents.length} akcí</div>
            </div>
            <div style={{ height: '12px' }} />
            <div className="events-list">
              {upcomingEvents.length === 0 && (
                <div className="review"><div className="text">Žádné akce zatím nejsou naplánovány.</div></div>
              )}
              {upcomingEvents.map((event) => {
                const { day, month } = formatDateLabel(event.startDate);
                const dateLabel = formatDateTime(event.startDate);
                const taken = reservationTotals.get(event.id) ?? 0;
                const cap = typeof event.capacity === 'number' ? event.capacity : 0;
                const left = cap ? Math.max(0, cap - taken) : null;
                return (
                  <div className="event" key={event.id}>
                    <div className="ev-left"><span className="date-day">{day}</span><span className="date-month">{month}</span></div>
                    <div style={{ flex: 1 }}>
                      <div className="ev-title">{event.title}</div>
                      <div className="ev-desc">{event.description}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <div className="pill">
                          {dateLabel ? `📅 ${dateLabel}` : '📅 Termín bude upřesněn'}
                          {event.place ? ` • 📍 ${event.place}` : ''}
                        </div>
                        {typeof event.capacity === 'number' && <div className="pill">Kapacita: {event.capacity}</div>}
                        {left != null && (
                          <div className="pill" style={{ color: left > 0 ? '#6bf0c1' : '#ff7a7a' }}>
                            Volná místa: {left} / {event.capacity}
                          </div>
                        )}
                        {event.price != null && <div className="pill" style={{ color: '#b4ffd9' }}>💳 {event.price} Kč</div>}
                      </div>
                    </div>
                    <div className="ev-actions">
                      <button className="btn-join" type="button" onClick={() => handleOpenReservation(event.id)} disabled={left != null && left <= 0}>
                        {left != null && left <= 0 ? 'Obsazeno' : 'Rezervovat'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: '18px' }} />
            <div><strong style={{ fontSize: '16px' }}>Předešlé akce</strong><div className="small-muted">Fotodokumentace ke každé akci</div></div>
            <div style={{ height: '12px' }} />
            <div className="events-list">
              {pastEvents.length === 0 && (
                <div className="review"><div className="text">Archiv je zatím prázdný.</div></div>
              )}
              {pastEvents.map((event) => {
                const { day, month } = formatDateLabel(event.startDate);
                const dateLabel = formatDateTime(event.startDate);
                return (
                  <div className="event" key={event.id}>
                    <div className="ev-left"><span className="date-day">{day}</span><span className="date-month">{month}</span></div>
                    <div style={{ flex: 1 }}>
                      <div className="ev-title">{event.title}</div>
                      <div className="ev-desc">{event.description}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <div className="pill">
                          {dateLabel ? `📅 ${dateLabel}` : '📅 Termín bude upřesněn'}
                          {event.place ? ` • 📍 ${event.place}` : ''}
                        </div>
                        {event.price != null && <div className="pill" style={{ color: '#b4ffd9' }}>💳 {event.price} Kč</div>}
                      </div>
                    </div>
                    <div className="ev-actions">
                      {(event.photos || []).length > 0 ? (
                        <button className="btn-join" type="button" onClick={() => handleShowPhotos(event.id, 0)}>
                          📸 Fotky z akce
                        </button>
                      ) : (
                        <span className="pill">Bez fotek</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: '12px' }} />
            <div className="card" id="gallery" style={{ marginTop: '8px' }}>
              <strong>Naše momentky &amp; vaše #IG</strong>
              <div className="small-muted">📸 Již brzy připojíme náš Instagram feed — sleduj nás na <strong>@poznejahraj</strong>.</div>
              <div className="gallery" id="galleryGrid">
                {gallery.map((item) => (
                  <img key={item.id} src={item.imageUrl} alt={item.name} loading="lazy" />
                ))}
                {gallery.length === 0 && <div className="pill">Galerie bude doplněna.</div>}
              </div>
            </div>
          </section>
          <aside>
            <div className="card" id="poll">
              <strong>Anketa: Téma příštího večera</strong>
              <div className="reviews" id="pollBox">
                <div className="review"><div className="text"><strong>{pollQuestion}</strong></div></div>
                {pollOptions.map((option) => {
                  const ratio = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={option.id} className="review" style={{ minHeight: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div>
                          <div><strong>{option.title}</strong></div>
                          <div className="small-muted">{option.description}</div>
                        </div>
                        <button className="btn-join" type="button" onClick={() => handleVote(option.id)}>Hlasovat</button>
                      </div>
                      <div style={{ marginTop: '8px', background: 'rgba(255,255,255,.06)', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ height: '8px', width: `${ratio}%`, background: 'linear-gradient(90deg,#8b5cf6,#00e5a8)' }} />
                      </div>
                      <small className="small-muted">{option.votes} hlasů ({ratio}%)</small>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card" id="reviews">
              <strong>Recenze</strong>
              <div className="small-muted">Co říkají účastníci</div>
              <div className="reviews" id="reviewsList">
                {approvedReviews.map((review) => (
                  <div key={review.id} className="review">
                    <div className="head">
                      <div className="name">{review.name}</div>
                      <div className="stars">{'★'.repeat(review.stars || review.rating || 5)}</div>
                    </div>
                    <div className="text">{review.message}</div>
                  </div>
                ))}
                {approvedReviews.length === 0 && <div className="review">Zatím bez recenzí.</div>}
              </div>
              <div style={{ height: '8px' }} />
              <ReviewForm onSubmit={handleSubmitReview} disabled={false} />
            </div>
          </aside>
        </div>
        <div className="marquee-wrap">
          <div className="marquee" id="marquee">
            {marqueeImages.map((src, index) => (
              <img key={`${src}-${index}`} src={src} alt="momentka" loading="lazy" />
            ))}
            {marqueeImages.length === 0 && <span className="pill">Galerie bude doplněna.</span>}
          </div>
        </div>
        <section className="card" id="crew">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><strong style={{ fontSize: '16px' }}>The Crew</strong><div className="small-muted">Lidé, kteří za tím stojí</div></div>
            <div className="small-muted" id="crew-count">{crew.length} členů</div>
          </div>
          <div style={{ height: '12px' }} />
          <div className="crew" id="crewList">
            {crew.map((member) => (
              <article key={member.id} className="crew-card">
                {member.photoUrl ? (
                  <img className="crew-avatar" src={member.photoUrl} alt={member.name} />
                ) : (
                  <div className="crew-avatar" style={{ display: 'grid', placeItems: 'center', border: '2px dashed rgba(255,255,255,.2)', color: '#9aa6b2' }}>
                    {member.name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="crew-name">{member.name}</div>
                <div className="crew-role">{member.role}</div>
                <div className="crew-desc">{member.description}</div>
              </article>
            ))}
            {crew.length === 0 && <div className="pill">Tým představíme brzy.</div>}
          </div>
        </section>
        <section className="contact-card" id="feedback">
          <div className="contact-header">
            <div className="contact-icon">💬</div>
            <div className="contact-title">
              <h3>Chceš, abychom uspořádali večer i pro tebe?</h3>
              <p className="small-muted">Máš nápad, přání nebo zpětnou vazbu? Napiš nám – připravíme program na míru a rádi si poslechneme tvůj názor.</p>
            </div>
          </div>
          <div className="contact-form">
            <FeedbackForm />
          </div>
        </section>
      </main>
      <footer>© {new Date().getFullYear()} Poznej &amp; Hraj · Těšíme se na další společnou hru!</footer>
      <button
        type="button"
        onClick={() => (isAdmin ? setIsAdmin(false) : setShowAdminPrompt(true))}
        className="admin-btn"
        style={{ right: '18px', bottom: '18px' }}
      >
        {isAdmin ? 'Odhlásit admina' : 'Admin panel'}
      </button>

      {showAdminPrompt && !isAdmin && (
        <div className="modal-back" style={{ display: 'flex' }}>
          <form className="modal" style={{ maxWidth: '420px' }} onSubmit={handleAdminLogin}>
            <button
              type="button"
              onClick={() => {
                setShowAdminPrompt(false);
                setAdminPassword('');
                setAdminError('');
              }}
              style={{ position: 'sticky', top: 0, float: 'right', background: 'transparent', border: 'none', color: '#9aa6b2', cursor: 'pointer', zIndex: 2 }}
            >
              ✕
            </button>
            <h2>Admin přihlášení</h2>
            <p className="small-muted">Zadej heslo pro vstup do administračního panelu.</p>
            <label>Heslo
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
            {adminError && <div className="pill" style={{ color: '#ff7a7a', marginTop: '8px' }}>{adminError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn-join"
                onClick={() => {
                  setShowAdminPrompt(false);
                  setAdminPassword('');
                  setAdminError('');
                }}
              >
                Zrušit
              </button>
              <button className="btn-join" type="submit" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
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

      <AdminPanel
        isOpen={isAdmin}
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
    </div>
  );
}
