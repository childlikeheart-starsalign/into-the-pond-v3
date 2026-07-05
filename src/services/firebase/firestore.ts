import { addDoc, collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { assertClientSafeUserPayload } from "@/shared/firestore/economyFieldRegistry";
import { firestore } from "@/src/services/firebase/client";

export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  payload: T,
) {
  if (collectionName === "users") {
    assertClientSafeUserPayload(payload);
  }
  return addDoc(collection(firestore, collectionName), payload);
}

export async function setDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  payload: T,
) {
  if (collectionName === "users") {
    assertClientSafeUserPayload(payload);
    if (__DEV__) {
      console.debug("[Firestore] client-safe users write", {
        documentId,
        keys: Object.keys(payload),
      });
    }
  }
  return setDoc(doc(firestore, collectionName, documentId), payload, { merge: true });
}

export async function getDocument<T = unknown>(collectionName: string, documentId: string) {
  const snapshot = await getDoc(doc(firestore, collectionName, documentId));
  return snapshot.exists() ? (snapshot.data() as T) : null;
}

export async function listCollection<T = unknown>(collectionName: string) {
  const snapshot = await getDocs(collection(firestore, collectionName));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as object) })) as T[];
}
