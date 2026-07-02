import { orderBy, serverTimestamp } from "firebase/firestore";
import {
  auctionDoc,
  auctionsCollection,
  typedQuery,
} from "@/lib/firebase/refs";
import { auctionSchema, createAuctionSchema } from "@/lib/firebase/schema";
import { addDocument, getCollection, getDocument } from "@/services/firestore";
import type { CreateAuctionInput } from "@/types";
import { validateInput } from "@/utils/validation";

export async function listAuctions() {
  return getCollection(
    typedQuery(auctionsCollection(), [orderBy("createdAt", "desc")]),
  );
}

export async function getAuction(auctionId: string) {
  return getDocument(auctionDoc(auctionId));
}

export async function createAuction(input: CreateAuctionInput) {
  const data = validateInput(createAuctionSchema, input);
  const auction = validateInput(auctionSchema, {
    ...data,
    status: "Draft",
    currentPlayerId: null,
    currentTurnTeamId: null,
    startedAt: null,
    endedAt: null,
    createdAt: serverTimestamp(),
  });

  return addDocument(auctionsCollection(), auction);
}
