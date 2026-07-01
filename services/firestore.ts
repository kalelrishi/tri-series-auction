import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  type CollectionReference,
  type DocumentReference,
  type PartialWithFieldValue,
  type Query,
  type Unsubscribe,
  type WithFieldValue,
} from "firebase/firestore";

type DocumentWithId = {
  id: string;
};

export async function getDocument<TDocument extends DocumentWithId>(
  ref: DocumentReference<TDocument>,
) {
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getCollection<TDocument extends DocumentWithId>(
  ref: CollectionReference<TDocument> | Query<TDocument>,
) {
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((item) => item.data());
}

export async function addDocument<TDocument extends DocumentWithId>(
  ref: CollectionReference<TDocument>,
  data: WithFieldValue<Omit<TDocument, "id">>,
) {
  return addDoc(ref, data as WithFieldValue<TDocument>);
}

export async function setDocument<TDocument extends DocumentWithId>(
  ref: DocumentReference<TDocument>,
  data: WithFieldValue<Omit<TDocument, "id">>,
) {
  return setDoc(ref, data as WithFieldValue<TDocument>);
}

export async function mergeDocument<TDocument extends DocumentWithId>(
  ref: DocumentReference<TDocument>,
  data: PartialWithFieldValue<Omit<TDocument, "id">>,
) {
  return setDoc(ref, data as PartialWithFieldValue<TDocument>, { merge: true });
}

export async function updateDocument<TDocument extends DocumentWithId>(
  ref: DocumentReference<TDocument>,
  data: PartialWithFieldValue<Omit<TDocument, "id">>,
) {
  return updateDoc(ref, data as PartialWithFieldValue<TDocument>);
}

export async function removeDocument<TDocument extends DocumentWithId>(
  ref: DocumentReference<TDocument>,
) {
  return deleteDoc(ref);
}

export function subscribeToDocument<TDocument extends DocumentWithId>(
  ref: DocumentReference<TDocument>,
  onNext: (document: TDocument | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    ref,
    (snapshot) => {
      onNext(snapshot.exists() ? snapshot.data() : null);
    },
    onError,
  );
}

export function subscribeToCollection<TDocument extends DocumentWithId>(
  ref: CollectionReference<TDocument> | Query<TDocument>,
  onNext: (documents: TDocument[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    ref,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => item.data()));
    },
    onError,
  );
}
