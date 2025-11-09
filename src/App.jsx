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
import HeroSection from './components/HeroSection.jsx';
import Reveal from './components/Reveal.jsx';
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

function NewsletterSignup({ className = '' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;
    setStatus('loading');
    setResponseMessage('');
    try {
      const result = await fetch('https://formspree.io/f/xovyawqv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, _subject: 'Poznej & Hraj – newsletter' }),
      });
      if (!result.ok) {
        throw new Error('Odeslání se nezdařilo. Zkus to prosím znovu.');
      }
      setEmail('');
      setStatus('success');
      setResponseMessage('✅ Děkujeme, brzy ti napíšeme!');
    } catch (err) {
      setStatus('error');
      setResponseMessage(err.message || 'Odeslání se nezdařilo.');
    }
  };

  return (
    <Reveal
      as="section"
      id="newsletter"
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/30 backdrop-blur ${className}`}
      offset={40}
      duration={0.6}
      margin="-80px"
    >
      <div
        className="animate-gradient absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.35),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(0,229,168,0.28),_transparent_45%)]"
        aria-hidden="true"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-white/40">Buď v obraze!</p>
          <h2 className="text-3xl font-semibold text-white drop-shadow-[0_0_18px_rgba(139,92,246,0.45)] md:text-4xl">
            Získej pozvánky na nové akce, novinky a speciální herní večery Poznej &amp; Hraj.
          </h2>
          <p className="max-w-xl text-sm text-white/70">
            Přihlášením získáš exkluzivní pozvánky, early bird místa a zákulisní novinky. Žádný spam – jen večery plné herních zážitků.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0d172e]/70 p-6 shadow-xl backdrop-blur">
          <label htmlFor="newsletter-email" className="text-sm font-medium text-white">
            Tvůj e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="např. tvoje@email.cz"
            className="rounded-xl border border-white/10 bg-[#101828] px-4 py-3 text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] px-6 py-3 text-sm font-semibold text-[#071022] shadow-[0_12px_28px_rgba(0,229,168,0.35)] transition-transform hover:-translate-y-1"
          >
            {status === 'loading' ? 'Odesílám…' : 'Přihlásit se k odběru'}
          </button>
          {responseMessage && (
            <p className={`text-sm ${status === 'success' ? 'text-a2' : 'text-rose-300'}`}>{responseMessage}</p>
          )}
        </form>
      </div>
    </Reveal>
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
  const [navShrunk, setNavShrunk] = useState(false);
  const [eventTab, setEventTab] = useState('upcoming');
  const [eventLimit, setEventLimit] = useState(3);
  const [communityTab, setCommunityTab] = useState('poll');
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

  useEffect(() => {
    const handleScroll = () => {
      setNavShrunk(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = useMemo(
    () => [
      { id: 'about', label: 'O projektu' },
      { id: 'events', label: 'Akce' },
      { id: 'gallery', label: 'Galerie' },
      { id: 'community', label: 'Komunita' },
      { id: 'crew', label: 'Tým' },
      { id: 'contact', label: 'Kontakt' },
      { id: 'newsletter', label: 'Buď v obraze!' },
    ],
    [],
  );

  const upcomingList = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .slice()
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

  const pastList = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .slice()
      .filter((event) => {
        const date = ensureDate(event.startDate);
        if (!date) return false;
        return date < now;
      })
      .sort((a, b) => {
        const aDate = ensureDate(a.startDate) ?? new Date(0);
        const bDate = ensureDate(b.startDate) ?? new Date(0);
        return bDate - aDate;
      });
  }, [events]);

  const reservationTotals = useMemo(() => {
    const map = new Map();
    reservations.forEach((item) => {
      if (!item?.eventId) return;
      const current = map.get(item.eventId) ?? 0;
      map.set(item.eventId, current + (item.count ?? 0));
    });
    return map;
  }, [reservations]);

  const approvedReviews = useMemo(() => reviews.filter((review) => review.approved), [reviews]);

  const stats = useMemo(() => {
    const attendees = reservations.reduce((total, item) => total + (item.count ?? 0), 0);
    return {
      upcoming: upcomingList.length,
      past: pastList.length,
      attendees,
      reviews: approvedReviews.length,
    };
  }, [approvedReviews, pastList, reservations, upcomingList]);

  const statsItems = useMemo(
    () => [
      {
        id: 'upcoming',
        label: 'Nadcházející akce',
        value: stats.upcoming,
        icon: '📅',
      },
      {
        id: 'past',
        label: 'Proběhlé večery',
        value: stats.past,
        icon: '🕰️',
      },
      {
        id: 'attendees',
        label: 'Účastníků celkem',
        value: stats.attendees,
        icon: '🧑‍🤝‍🧑',
      },
      {
        id: 'reviews',
        label: 'Recenzí od hráčů',
        value: stats.reviews,
        icon: '⭐',
      },
    ],
    [stats.attendees, stats.past, stats.reviews, stats.upcoming],
  );

  const displayedEvents = useMemo(() => {
    const source = eventTab === 'upcoming' ? upcomingList : pastList;
    return source.slice(0, Math.max(1, eventLimit));
  }, [eventTab, eventLimit, upcomingList, pastList]);

  const hasMoreEvents = useMemo(() => {
    const source = eventTab === 'upcoming' ? upcomingList : pastList;
    return source.length > displayedEvents.length;
  }, [displayedEvents.length, eventTab, pastList, upcomingList]);

  const marqueeImages = useMemo(() => {
    const seen = new Set();
    const images = [];
    const push = (url) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      images.push(url);
    };
    gallery.forEach((item) => push(item.imageUrl));
    events.forEach((event) => {
      (event.photos || []).forEach((url) => push(url));
    });
    return images;
  }, [events, gallery]);

  const totalVotes = useMemo(
    () => pollOptions.reduce((total, option) => total + (option.votes || 0), 0),
    [pollOptions],
  );

  const handleSmoothScroll = (event, targetId) => {
    event.preventDefault();
    const element = document.getElementById(targetId);
    if (!element) return;
    const offset = 80;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleOpenReservation = (eventId = '') => {
    setSelectedEventId(eventId);
    setShowReservation(true);
  };

  const handleCloseReservation = () => {
    setShowReservation(false);
  };

  const handleShowPhotos = (eventId, startIndex = 0) => {
    const eventItem = events.find((item) => item.id === eventId);
    if (!eventItem || !(eventItem.photos?.length)) return;
    setLightboxState({ open: true, photos: eventItem.photos, index: Math.max(0, startIndex) });
  };

  const handleOpenGallery = (index) => {
    const photos = gallery.map((item) => item.imageUrl).filter(Boolean);
    if (!photos.length) return;
    const clampedIndex = Math.min(Math.max(index, 0), photos.length - 1);
    setLightboxState({ open: true, photos, index: clampedIndex });
  };

  const handleCloseLightbox = () => {
    setLightboxState((prev) => ({ ...prev, open: false }));
  };

  const handleNavigateLightbox = (nextIndex) => {
    setLightboxState((prev) => {
      if (!prev.photos.length) return prev;
      const total = prev.photos.length;
      const normalized = ((nextIndex % total) + total) % total;
      return { ...prev, index: normalized };
    });
  };

  const handleVote = async (optionId) => {
    const option = pollOptions.find((item) => item.id === optionId);
    if (!option) return;
    try {
      if (firebaseReady) {
        await updateDoc(doc(db, 'pollOptions', optionId), { votes: increment(1) });
      } else {
        setPollOptions((prev) =>
          prev.map((item) => (item.id === optionId ? { ...item, votes: (item.votes || 0) + 1 } : item)),
        );
      }
    } catch (err) {
      console.error('Hlasování selhalo', err);
    }
  };

  const handleSubmitReview = async ({ name, rating, message }) => {
    const reviewData = {
      name,
      stars: rating,
      rating,
      message,
      approved: false,
    };
    if (firebaseReady) {
      await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        createdAt: serverTimestamp(),
      });
    } else {
      setReviews((prev) => [
        ...prev,
        normalizeReview({
          ...reviewData,
          id: `preview-review-${Date.now()}`,
          createdAt: new Date(),
        }),
      ]);
    }
  };

  const handleCreateReservation = async (reservation) => {
    const formspreePayload = {
      _subject: `Rezervace: ${reservation.eventTitle}`,
      type: 'reservation',
      event: reservation.eventTitle,
      name: reservation.name,
      email: reservation.email,
      phone: reservation.phone,
      count: reservation.count,
      guests: reservation.guests.join('; '),
      note: reservation.note,
      price: reservation.price ?? '',
      gender: reservation.gender ?? '',
      age: reservation.age ?? '',
      status: reservation.status ?? '',
      expectation: reservation.expectation ?? '',
    };

    try {
      if (firebaseReady) {
        await addDoc(collection(db, 'reservations'), {
          ...reservation,
          guests: reservation.guests,
          createdAt: serverTimestamp(),
        });
      } else {
        setReservations((prev) => [
          ...prev,
          normalizeReservation({
            ...reservation,
            id: `preview-reservation-${Date.now()}`,
            createdAt: new Date(),
          }),
        ]);
      }
    } catch (err) {
      console.error('Rezervaci se nepodařilo uložit', err);
      throw err;
    } finally {
      try {
        await fetch('https://formspree.io/f/xovyawqv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formspreePayload),
        });
      } catch (err) {
        console.warn('Formspree submit failed', err);
      }
    }
  };

  const handleAdminLogin = (event) => {
    event.preventDefault();
    if (adminPassword.trim() === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminPrompt(false);
      setAdminPassword('');
      setAdminError('');
    } else {
      setAdminError('Špatné heslo, zkus to prosím znovu.');
    }
  };

  return (
    <div className="bg-poznej min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-4 pb-24 pt-10 md:px-8">
        {!firebaseReady && (
          <div className="rounded-3xl border border-amber-300/30 bg-amber-200/10 px-6 py-4 text-sm text-amber-200 shadow-lg shadow-black/30">
            Tento náhled běží bez propojení na Firebase. Data se ukládají pouze v rámci aktuální relace.
          </div>
        )}
        <header className="sticky top-6 z-40 flex flex-col gap-4">
          <div
            className={`flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 px-6 transition-all duration-300 backdrop-blur ${
              navShrunk ? 'py-4 shadow-2xl shadow-black/40' : 'py-6 shadow-[0_25px_60px_rgba(7,16,34,0.65)]'
            }`}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#00e5a8] text-xl font-bold text-[#071022] shadow-[0_15px_30px_rgba(0,229,168,0.35)]">
                  PH
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-white/40">Poznej &amp; Hraj</p>
                  <h1 className="text-2xl font-semibold text-white md:text-3xl">Komunitní večery plné her a nových přátel</h1>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenReservation('')}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] px-6 py-3 text-sm font-semibold text-[#071022] shadow-[0_15px_32px_rgba(0,229,168,0.35)] transition-transform hover:-translate-y-1"
              >
                Rezervovat místo
              </button>
            </div>
          </div>
          <nav
            className={`flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 transition-all duration-300 backdrop-blur ${
              navShrunk ? 'py-2 shadow-lg shadow-black/30' : 'py-3 shadow-xl shadow-black/30'
            }`}
          >
            <div className="flex flex-wrap gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(event) => handleSmoothScroll(event, link.id)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={() => (isAdmin ? setIsAdmin(false) : setShowAdminPrompt(true))}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:border-a1/50 hover:text-white"
            >
              {isAdmin ? 'Odhlásit admina' : 'Admin panel'}
            </button>
          </nav>
        </header>
        <main className="flex flex-col gap-16">
          <HeroSection heroTags={heroTags} onReserve={() => handleOpenReservation('')} />
          <Reveal
            as="section"
            id="about"
            className="card grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            offset={40}
            duration={0.6}
            margin="-80px"
          >
            <div className="space-y-4">
              <span className="text-sm uppercase tracking-[0.4em] text-white/40">O projektu</span>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Hry jako nejlepší způsob, jak se poznat</h2>
              <p className="text-base text-white/70">
                <strong>Poznej &amp; Hraj</strong> vzniklo z touhy spojovat lidi jinak — ne přes aplikace, ale skrze společné zážitky. Každý večer má svůj příběh, atmosféru a moderátory, kteří se postarají, aby se všichni cítili vítaně.
              </p>
              <p className="text-base text-white/70">
                Kombinujeme kvízy, mini-hry, týmové výzvy i chill zóny. Díky promyšlenému flow se do akce zapojí i introverti a seznamování je přirozené a bez tlaku.
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0c1424]/70 p-6 shadow-glass">
              <h3 className="text-lg font-semibold text-white">Co tě čeká?</h3>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-a1/30 text-a1">🎲</span>Tematické večery s průvodci a vymazleným programem.</li>
                <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-a2/30 text-a2">🤝</span>Ice-breaker hry a týmové výzvy pro navázání nových kontaktů.</li>
                <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white">📸</span>Fotokoutky, afterparty a komunitní skupiny pro další akce.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal
            as="section"
            id="events"
            className="card flex flex-col gap-10"
            offset={40}
            duration={0.6}
            margin="-80px"
          >
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/40">Místa máme aktuálně…</p>
                <h2 className="text-3xl font-semibold text-white md:text-4xl">Přehled akcí a kapacit</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statsItems.map((item, index) => (
                  <Reveal
                    as="article"
                    key={item.id}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass"
                    offset={24}
                    duration={0.4}
                    delay={index * 0.05}
                    margin="-80px"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-a1/15 via-transparent to-a2/25 opacity-80" aria-hidden="true" />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0e1830]/80 text-xl text-a2 shadow-[0_12px_24px_rgba(0,229,168,0.25)]">
                        <span aria-hidden="true">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white drop-shadow-[0_0_18px_rgba(0,229,168,0.25)]">{item.value}</p>
                        <p className="text-sm text-white/70">{item.label}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex rounded-full border border-white/10 bg-[#0e1830]/70 p-1 text-sm font-semibold">
                  {[
                    { id: 'upcoming', label: 'Nadcházející' },
                    { id: 'past', label: 'Minulé' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEventTab(tab.id)}
                      className={`rounded-full px-4 py-2 transition-all ${
                        eventTab === tab.id ? 'bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-[#071022]' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-white/60">
                  {eventTab === 'upcoming'
                    ? 'Rezervace se rychle plní – zajisti si místo co nejdřív.'
                    : 'Prohlédni si atmosféru z minulých večerů a nech se inspirovat.'}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {displayedEvents.map((event, index) => {
                  const { day, month } = formatDateLabel(event.startDate);
                  const cover = event.photos?.[0] || gallery[0]?.imageUrl || '';
                  const taken = reservationTotals.get(event.id) ?? 0;
                  const capacity = typeof event.capacity === 'number' ? event.capacity : null;
                  const available = capacity != null ? Math.max(0, capacity - taken) : null;
                  return (
                    <Reveal
                      as="article"
                      key={event.id}
                      className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-glass"
                      offset={28}
                      duration={0.45}
                      delay={index * 0.05}
                      margin="-80px"
                    >
                      {cover && (
                        <div className="relative h-44 overflow-hidden">
                          <img src={cover} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent" aria-hidden="true" />
                        </div>
                      )}
                      <div className="relative flex flex-col gap-4 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 items-center gap-4">
                            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0e1830]/80 text-sm">
                              <span className="text-lg font-bold text-a2">{day}</span>
                              <span className="text-xs uppercase text-white/60">{month}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                              <p className="text-sm text-white/60">{event.description}</p>
                            </div>
                          </div>
                          {event.photos?.length ? (
                            <button
                              type="button"
                              onClick={() => handleShowPhotos(event.id, 0)}
                              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/70 transition-all hover:border-a2/50 hover:text-white"
                            >
                              Fotky
                            </button>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                            📅 {formatDateTime(event.startDate) || 'Brzy oznámíme'}
                          </span>
                          {event.place && (
                            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">📍 {event.place}</span>
                          )}
                          {capacity != null && (
                            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">Kapacita {capacity}</span>
                          )}
                          {available != null && (
                            <span
                              className={`rounded-full border px-3 py-1 ${
                                available > 0 ? 'border-a2/30 bg-a2/10 text-a2' : 'border-rose-300/30 bg-rose-400/10 text-rose-200'
                              }`}
                            >
                              Volná místa {available}
                            </span>
                          )}
                          {event.price != null && (
                            <span className="rounded-full border border-a1/30 bg-a1/10 px-3 py-1 text-a1 font-semibold">{event.price} Kč</span>
                          )}
                        </div>
                        {!!event.tags?.length && (
                          <div className="flex flex-wrap gap-2 text-xs text-white/60">
                            {event.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">#{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => handleOpenReservation(event.id)}
                            disabled={available === 0 && eventTab === 'upcoming'}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] px-5 py-2 text-sm font-semibold text-[#071022] shadow-[0_12px_26px_rgba(0,229,168,0.3)] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {eventTab === 'upcoming' ? (available === 0 ? 'Obsazeno' : 'Rezervovat') : 'Chci další edici'}
                          </button>
                          {event.website && (
                            <a href={event.website} className="text-sm text-white/60 hover:text-white" target="_blank" rel="noreferrer">
                              Detail akce ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
              {!displayedEvents.length && (
                <p className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/60">
                  Zatím žádné akce v této kategorii. Sleduj náš Instagram @poznejahraj a dozvíš se o dalších termínech jako první.
                </p>
              )}
              {hasMoreEvents && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setEventLimit((prev) => prev + 2)}
                    className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 transition-all hover:border-a1/40 hover:text-white"
                  >
                    Zobrazit další
                  </button>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal
            as="section"
            id="gallery"
            className="card space-y-6"
            offset={40}
            duration={0.6}
            margin="-80px"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-sm uppercase tracking-[0.4em] text-white/40">Galerie</span>
                <h2 className="text-3xl font-semibold text-white">Momentky z našich večerů</h2>
              </div>
              <p className="text-sm text-white/60">Klikni na fotku a otevři lightbox. Přidej své snímky po přihlášení do adminu.</p>
            </div>
            {marqueeImages.length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="marquee-track flex gap-4 p-4">
                  {marqueeImages.map((src, index) => (
                    <img key={`${src}-${index}`} src={src} alt="momentka" className="h-32 w-auto rounded-2xl border border-white/10 object-cover" loading="lazy" />
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item, index) => (
                <Reveal
                  as="button"
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenGallery(index)}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-glass"
                  fromScale={0.96}
                  offset={0}
                  duration={0.4}
                  delay={index * 0.03}
                  margin="-80px"
                >
                  <img src={item.imageUrl} alt={item.name} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="absolute bottom-4 left-4 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur">
                    {item.name || 'momentka'}
                  </span>
                </Reveal>
              ))}
              {!gallery.length && (
                <p className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-5 text-sm text-white/60">
                  Galerie se plní. Přidej svou fotku po přihlášení do adminu.
                </p>
              )}
            </div>
          </Reveal>
          <Reveal
            as="section"
            id="community"
            className="card space-y-8"
            offset={40}
            duration={0.6}
            margin="-80px"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/40">Komunita</p>
                <h2 className="text-3xl font-semibold text-white">Hlasování a recenze od návštěvníků</h2>
              </div>
              <div className="inline-flex rounded-full border border-white/10 bg-[#0e1830]/70 p-1 text-sm font-semibold">
                {[
                  { id: 'poll', label: 'Anketa' },
                  { id: 'reviews', label: 'Recenze' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCommunityTab(tab.id)}
                    className={`rounded-full px-4 py-2 transition-all ${
                      communityTab === tab.id
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] text-[#071022]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {communityTab === 'poll' ? (
              <div className="space-y-5">
                <div className="rounded-3xl border border-white/10 bg-[#0c1424]/70 p-6 shadow-glass">
                  <h3 className="text-xl font-semibold text-white">{pollQuestion}</h3>
                  <p className="mt-2 text-sm text-white/60">Celkem {totalVotes} hlasů</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {pollOptions.map((option) => {
                    const votes = option.votes || 0;
                    const ratio = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                    return (
                      <Reveal
                        as="article"
                        key={option.id}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass"
                        offset={20}
                        duration={0.35}
                        margin="-80px"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-a1/15 via-transparent to-a2/20 opacity-80" aria-hidden="true" />
                        <div className="relative flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-semibold text-white">{option.title}</h4>
                              {option.description && <p className="text-sm text-white/60">{option.description}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleVote(option.id)}
                              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:border-a2/40 hover:text-white"
                            >
                              Hlasovat
                            </button>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8]" style={{ width: `${ratio}%` }} />
                          </div>
                          <p className="text-xs text-white/60">{votes} hlasů · {ratio}%</p>
                        </div>
                      </Reveal>
                    );
                  })}
                  {!pollOptions.length && (
                    <p className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-5 text-sm text-white/60">
                      Anketa bude brzy zveřejněna.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  {approvedReviews.map((review) => {
                    const rating = review.stars || review.rating || 5;
                    return (
                      <div key={review.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{review.name}</p>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('cs-CZ') : 'Nová recenze'}</p>
                          </div>
                          <div className="flex items-center gap-1 text-a2">
                            {Array.from({ length: 5 }).map((_, star) => (
                              <span key={star} className={star < rating ? '' : 'text-white/30'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-white/70">{review.message}</p>
                      </div>
                    );
                  })}
                  {!approvedReviews.length && (
                    <p className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-5 text-sm text-white/60">
                      Buď první, kdo napíše recenzi na Poznej &amp; Hraj!
                    </p>
                  )}
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0c1424]/70 p-6 shadow-glass">
                  <h3 className="text-lg font-semibold text-white">Napiš vlastní zkušenost</h3>
                  <ReviewForm onSubmit={handleSubmitReview} disabled={false} />
                </div>
              </div>
            )}
          </Reveal>
          <Reveal
            as="section"
            id="crew"
            className="card space-y-6"
            offset={40}
            duration={0.6}
            margin="-80px"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-sm uppercase tracking-[0.4em] text-white/40">The Crew</span>
                <h2 className="text-3xl font-semibold text-white">Tým, který stojí za atmosférou</h2>
              </div>
              <p className="text-sm text-white/60">{crew.length} členů komunity připravuje herní večery na míru.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {crew.map((member, index) => (
                <Reveal
                  as="article"
                  key={member.id}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass"
                  offset={24}
                  duration={0.4}
                  delay={index * 0.05}
                  margin="-80px"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-a1/15 via-transparent to-a2/20 opacity-80" aria-hidden="true" />
                  <div className="relative flex flex-col items-start gap-4">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="h-20 w-20 rounded-full border border-white/10 object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-white/20 text-lg text-white/60">
                        {member.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-a2">{member.role}</p>
                    </div>
                    {member.description && <p className="text-sm text-white/70">{member.description}</p>}
                  </div>
                </Reveal>
              ))}
              {!crew.length && (
                <p className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-5 text-sm text-white/60">
                  Tým představíme brzy.
                </p>
              )}
            </div>
          </Reveal>
          <Reveal
            as="section"
            id="contact"
            className="card grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            offset={40}
            duration={0.6}
            margin="-80px"
          >
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.4em] text-white/40">Chceš vlastní akci?</p>
              <h2 className="bg-gradient-to-r from-[#8b5cf6] via-[#9f7aff] to-[#00e5a8] bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                Chceš, abychom uspořádali herní večer i pro tebe?
              </h2>
              <p className="text-base text-white/70">
                Napiš nám své nápady, přání nebo zpětnou vazbu. Připravíme program na míru a ozveme se ti s detaily.
              </p>
              <p className="text-sm text-white/60">
                Preferuješ e-mail? Piš na <a href="mailto:poznejahraj@seznam.cz" className="text-a2 underline">poznejahraj@seznam.cz</a>.
              </p>
            </div>
            <FeedbackForm />
          </Reveal>
          <NewsletterSignup className="shadow-[0_30px_80px_rgba(7,16,34,0.55)]" />
        </main>
        <footer className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-white/60 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} Poznej &amp; Hraj. Vidíme se na dalším herním večeru!</span>
            <span className="text-white/40">Made with ❤️ pro komunitu hráčů.</span>
          </div>
        </footer>
      </div>

      {showAdminPrompt && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/80 px-4 py-8 backdrop-blur">
          <form
            onSubmit={handleAdminLogin}
            className="relative w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-[#0c1424] p-8 text-white shadow-2xl shadow-black/60"
          >
            <button
              type="button"
              onClick={() => {
                setShowAdminPrompt(false);
                setAdminPassword('');
                setAdminError('');
              }}
              className="absolute right-4 top-4 text-white/50 transition hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold text-white">Admin přihlášení</h2>
            <p className="text-sm text-white/60">Zadej heslo pro vstup do administračního panelu.</p>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              Heslo
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-a1 focus:outline-none focus:ring-2 focus:ring-a1/40"
              />
            </label>
            {adminError && (
              <p className="rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{adminError}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAdminPrompt(false);
                  setAdminPassword('');
                  setAdminError('');
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition-all hover:border-white/40 hover:text-white"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#00e5a8] px-5 py-2 text-sm font-semibold text-[#071022] shadow-[0_12px_26px_rgba(139,92,246,0.35)]"
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
