import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebaseConfig.js';

export async function sendFeedback(data, file) {
  if (!isFirebaseConfigured || !db || !storage) {
    throw new Error('Firebase není nakonfigurované. Vyplň prosím údaje ve souboru .env.');
  }

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
