import { orderBy } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import {
  playerDoc,
  playersCollection,
  typedQuery,
} from "@/lib/firebase/refs";
import { playerSchema } from "@/lib/firebase/schema";
import {
  addDocument,
  getCollection,
  getDocument,
  mergeDocument,
} from "@/services/firestore";
import type { CreatePlayerInput, UpdatePlayerInput } from "@/types";
import { validateInput } from "@/utils/validation";

export async function getPlayer(playerId: string) {
  return getDocument(playerDoc(playerId));
}

export async function listPlayers() {
  return getCollection(typedQuery(playersCollection(), [orderBy("name", "asc")]));
}

export async function createPlayer(input: CreatePlayerInput) {
  const data = validateInput(playerSchema, input);
  return addDocument(playersCollection(), {
    ...omitUndefinedProperties(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePlayer(
  playerId: string,
  input: UpdatePlayerInput,
) {
  const data = playerSchema.partial().parse(input);
  return mergeDocument(playerDoc(playerId), {
    ...omitUndefinedProperties(data),
    updatedAt: serverTimestamp(),
  });
}

function omitUndefinedProperties<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as {
    [K in keyof T as undefined extends T[K] ? K : K]: Exclude<T[K], undefined>;
  };
}
