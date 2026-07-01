import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type QueryConstraint,
  type Unsubscribe,
  type WithFieldValue,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env values.");
  }

  return db;
}

export function createConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: WithFieldValue<T>): DocumentData {
      const { id: _ignored, ...data } = modelObject as T;
      void _ignored;
      return data;
    },
    fromFirestore(snapshot) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as T;
    },
  };
}

export function typedCollection<T extends { id: string }>(path: string) {
  return collection(requireDb(), path).withConverter(createConverter<T>());
}

export async function getById<T extends { id: string }>(
  collectionPath: string,
  id: string,
) {
  const snapshot = await getDoc(
    doc(requireDb(), collectionPath, id).withConverter(createConverter<T>()),
  );

  return snapshot.exists() ? snapshot.data() : null;
}

export async function listAll<T extends { id: string }>(
  collectionPath: string,
  constraints: QueryConstraint[] = [orderBy("createdAt", "desc")],
) {
  const snapshot = await getDocs(
    query(typedCollection<T>(collectionPath), ...constraints),
  );

  return snapshot.docs.map((item) => item.data());
}

export async function createRecord<T extends { id: string }>(
  collectionPath: string,
  data: Omit<T, "id">,
) {
  return addDoc(typedCollection<T>(collectionPath), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as WithFieldValue<T>);
}

export async function upsertRecord<T extends { id: string }>(
  collectionPath: string,
  id: string,
  data: Partial<Omit<T, "id">>,
) {
  return setDoc(
    doc(requireDb(), collectionPath, id).withConverter(createConverter<T>()),
    {
      ...data,
      updatedAt: serverTimestamp(),
    } as PartialWithFieldValue<T>,
    { merge: true },
  );
}

export function subscribeToCollection<T extends { id: string }>(
  collectionPath: string,
  onNext: (items: T[]) => void,
  constraints: QueryConstraint[] = [],
): Unsubscribe {
  return onSnapshot(query(typedCollection<T>(collectionPath), ...constraints), (snapshot) => {
    onNext(snapshot.docs.map((item) => item.data()));
  });
}
