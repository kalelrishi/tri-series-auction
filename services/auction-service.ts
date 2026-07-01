import { orderBy, serverTimestamp } from "firebase/firestore";
import {
  auctionDetailsDoc,
  auctionPlayerDoc,
  auctionPlayersCollection,
  auctionStateDoc,
  auctionTeamDoc,
  auctionTeamsCollection,
  bidDoc,
  bidsCollection,
  historyCollection,
  historyDoc,
  typedQuery,
} from "@/lib/firebase/refs";
import {
  auctionDetailsSchema,
  auctionPlayerSchema,
  auctionStateSchema,
  auctionTeamSchema,
  bidSchema,
  historySchema,
} from "@/lib/firebase/schema";
import {
  addDocument,
  getCollection,
  getDocument,
  mergeDocument,
  setDocument,
  subscribeToCollection,
  subscribeToDocument,
} from "@/services/firestore";
import type {
  CreateAuctionDetailsInput,
  CreateAuctionPlayerInput,
  CreateAuctionTeamInput,
  CreateBidInput,
  CreateHistoryInput,
  UpdateAuctionDetailsInput,
  UpdateAuctionStateInput,
  UpdateAuctionTeamInput,
  UpsertAuctionStateInput,
} from "@/types";
import { validateInput } from "@/utils/validation";

export async function getAuctionDetails(auctionId: string) {
  return getDocument(auctionDetailsDoc(auctionId));
}

export async function createAuctionDetails(
  auctionId: string,
  input: CreateAuctionDetailsInput,
) {
  const data = validateInput(auctionDetailsSchema, input);
  return setDocument(auctionDetailsDoc(auctionId), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateAuctionDetails(
  auctionId: string,
  input: UpdateAuctionDetailsInput,
) {
  const data = auctionDetailsSchema.partial().parse(input);
  return mergeDocument(auctionDetailsDoc(auctionId), data);
}

export function subscribeAuctionDetails(
  auctionId: string,
  onNext: Parameters<typeof subscribeToDocument>[1],
) {
  return subscribeToDocument(auctionDetailsDoc(auctionId), onNext);
}

export async function getAuctionState(auctionId: string) {
  return getDocument(auctionStateDoc(auctionId));
}

export async function upsertAuctionState(
  auctionId: string,
  input: UpsertAuctionStateInput,
) {
  const data = validateInput(auctionStateSchema, input);
  return setDocument(auctionStateDoc(auctionId), data);
}

export async function updateAuctionState(
  auctionId: string,
  input: UpdateAuctionStateInput,
) {
  const data = auctionStateSchema.partial().parse(input);
  return mergeDocument(auctionStateDoc(auctionId), data);
}

export function subscribeAuctionState(
  auctionId: string,
  onNext: Parameters<typeof subscribeToDocument>[1],
) {
  return subscribeToDocument(auctionStateDoc(auctionId), onNext);
}

export async function listAuctionPlayers(auctionId: string) {
  return getCollection(auctionPlayersCollection(auctionId));
}

export async function addAuctionPlayer(
  auctionId: string,
  input: CreateAuctionPlayerInput,
) {
  const data = validateInput(auctionPlayerSchema, input);
  return addDocument(auctionPlayersCollection(auctionId), data);
}

export async function setAuctionPlayer(
  auctionId: string,
  auctionPlayerId: string,
  input: CreateAuctionPlayerInput,
) {
  const data = validateInput(auctionPlayerSchema, input);
  return setDocument(auctionPlayerDoc(auctionId, auctionPlayerId), data);
}

export async function listAuctionTeams(auctionId: string) {
  return getCollection(auctionTeamsCollection(auctionId));
}

export async function getAuctionTeam(auctionId: string, teamId: string) {
  return getDocument(auctionTeamDoc(auctionId, teamId));
}

export async function createAuctionTeam(
  auctionId: string,
  teamId: string,
  input: CreateAuctionTeamInput,
) {
  const data = validateInput(auctionTeamSchema, input);
  return setDocument(auctionTeamDoc(auctionId, teamId), data);
}

export async function updateAuctionTeam(
  auctionId: string,
  teamId: string,
  input: UpdateAuctionTeamInput,
) {
  const data = auctionTeamSchema.partial().parse(input);
  return mergeDocument(auctionTeamDoc(auctionId, teamId), data);
}

export async function listBids(auctionId: string) {
  return getCollection(
    typedQuery(bidsCollection(auctionId), [orderBy("timestamp", "desc")]),
  );
}

export async function getBid(auctionId: string, bidId: string) {
  return getDocument(bidDoc(auctionId, bidId));
}

export async function createBid(auctionId: string, input: CreateBidInput) {
  const data = validateInput(bidSchema, input);
  return addDocument(bidsCollection(auctionId), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

export function subscribeBids(
  auctionId: string,
  onNext: Parameters<typeof subscribeToCollection>[1],
) {
  return subscribeToCollection(
    typedQuery(bidsCollection(auctionId), [orderBy("timestamp", "desc")]),
    onNext,
  );
}

export async function listHistory(auctionId: string) {
  return getCollection(
    typedQuery(historyCollection(auctionId), [orderBy("timestamp", "desc")]),
  );
}

export async function getHistoryItem(auctionId: string, historyId: string) {
  return getDocument(historyDoc(auctionId, historyId));
}

export async function createHistoryItem(
  auctionId: string,
  input: CreateHistoryInput,
) {
  const data = validateInput(historySchema, input);
  return addDocument(historyCollection(auctionId), {
    ...data,
    timestamp: serverTimestamp(),
  });
}
