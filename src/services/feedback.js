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

  if (file) {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const storageRef = ref(storage, `feedback-images/${safeName}`);
    const uploaded = await uploadBytes(storageRef, file);
    payload.photoURL = await getDownloadURL(uploaded.ref);
  }

  const feedbackCollection = collection(db, 'feedback');
  const documentRef = await addDoc(feedbackCollection, payload);

  return { id: documentRef.id, ...payload };
}
