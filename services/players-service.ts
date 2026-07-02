import { orderBy } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import {
  playerDoc,
  playersCollection,
  typedQuery,
} from "@/lib/firebase/refs";
import { ROOT_COLLECTIONS } from "@/lib/firebase/paths";
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
  console.info("[createPlayer] payload before validation:", input);

  const validation = playerSchema.safeParse(input);
  console.info("[createPlayer] schema validation result:", validation);

  const data = validateInput(playerSchema, input);
  const collectionPath = ROOT_COLLECTIONS.players;
  console.info("[createPlayer] Firestore write path:", collectionPath);

  try {
    return await addDocument(playersCollection(), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[createPlayer] Firestore write failed:", error);
    throw error;
  }
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
