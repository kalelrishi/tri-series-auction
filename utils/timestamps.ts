import {
  serverTimestamp,
  Timestamp,
  type FieldValue,
} from "firebase/firestore";

export type WriteTimestamp = Timestamp | FieldValue;

export function nowServerTimestamp() {
  return serverTimestamp();
}

export function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

export function timestampToDate(value: Timestamp | null | undefined) {
  return value ? value.toDate() : null;
}

export function timestampToIso(value: Timestamp | null | undefined) {
  return timestampToDate(value)?.toISOString() ?? null;
}
