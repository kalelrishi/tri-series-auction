import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from "firebase/firestore";

type DocumentWithId = {
  id: string;
};

export function createFirestoreConverter<
  TDocument extends DocumentWithId,
>(): FirestoreDataConverter<TDocument> {
  return {
    toFirestore(modelObject: WithFieldValue<TDocument>): DocumentData {
      const { id: _id, ...data } = modelObject as TDocument;
      void _id;
      return data;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions,
    ): TDocument {
      return {
        id: snapshot.id,
        ...snapshot.data(options),
      } as TDocument;
    },
  };
}
