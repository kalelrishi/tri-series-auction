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
    ...data,
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
    ...data,
    updatedAt: serverTimestamp(),
  });
}
