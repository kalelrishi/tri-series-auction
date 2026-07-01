import { serverTimestamp } from "firebase/firestore";
import { userDoc, usersCollection } from "@/lib/firebase/refs";
import { userSchema } from "@/lib/firebase/schema";
import {
  getCollection,
  getDocument,
  mergeDocument,
  setDocument,
} from "@/services/firestore";
import type { CreateUserInput, UpdateUserInput } from "@/types";
import { validateInput } from "@/utils/validation";

export async function getUser(uid: string) {
  return getDocument(userDoc(uid));
}

export async function listUsers() {
  return getCollection(usersCollection());
}

export async function createUser(uid: string, input: CreateUserInput) {
  const data = validateInput(userSchema, input);
  return setDocument(userDoc(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUser(uid: string, input: UpdateUserInput) {
  const data = userSchema.partial().parse(input);
  return mergeDocument(userDoc(uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
