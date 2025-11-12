import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebaseConfig.js';

function assertFirebaseConfig() {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
  ];

  const missing = requiredKeys.filter((key) => !import.meta.env[key]);
  if (missing.length) {
    throw new Error(
      `Chybí Firebase konfigurace: ${missing.join(', ')}. Zkontroluj prosím .env soubor.`,
    );
  }
}

export async function sendFeedback(data, file) {
  assertFirebaseConfig();

  const payload = {
    name: data.name?.trim() || '',
    email: data.email?.trim() || '',
    message: data.message?.trim() || '',
    photoURL: '',
    timestamp: serverTimestamp(),
  };

  if (!payload.email || !payload.message) {
    throw new Error('E-mail a zpráva jsou povinné.');
  }

  // 🔹 1️⃣ Pokud je soubor, nahraj ho do Storage
  if (file) {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const storageRef = ref(storage, `feedback-images/${safeName}`);
    const uploaded = await uploadBytes(storageRef, file);
    payload.photoURL = await getDownloadURL(uploaded.ref);
  }

  // 🔹 2️⃣ Ulož do Firestore
  const feedbackCollection = collection(db, 'feedback');
  const documentRef = await addDoc(feedbackCollection, payload);

  // 🔹 3️⃣ Odeslat i na Formspree
  try {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('message', payload.message);
    if (payload.photoURL) formData.append('photoURL', payload.photoURL);

    const response = await fetch('https://formspree.io/f/xovyawqv', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('⚠️ Formspree chyba:', errData);
    } else {
      console.log('✅ Odesláno do Formspree');
    }
  } catch (err) {
    console.error('❌ Nepodařilo se odeslat do Formspree:', err);
  }

  return { id: documentRef.id, ...payload };
}
