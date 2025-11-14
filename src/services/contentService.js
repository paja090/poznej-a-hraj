// src/services/contentService.js
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

/** Načte data z dokumentu /content/{blockId} */
export async function getContent(blockId) {
  const ref = doc(db, "content", blockId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/** Uloží data do dokumentu /content/{blockId} (merge = true, aby nepřepsal celé) */
export async function updateContent(blockId, data) {
  const ref = doc(db, "content", blockId);
  await setDoc(ref, data, { merge: true });
}
