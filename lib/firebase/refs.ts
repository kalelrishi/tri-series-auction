import {
  collection,
  doc,
  query,
  type CollectionReference,
  type DocumentReference,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createFirestoreConverter } from "@/lib/firebase/converters";
import {
  AUCTION_COLLECTIONS,
  ROOT_COLLECTIONS,
  SINGLE_DOCUMENT_IDS,
  auctionSubcollectionPath,
} from "@/lib/firebase/paths";
import type {
  AuctionDetailsDocument,
  AuctionPlayerDocument,
  AuctionStateDocument,
  AuctionTeamDocument,
  BidDocument,
  HistoryDocument,
  PlayerDocument,
  SettingsDocument,
  UserDocument,
} from "@/types";

export function requireFirestore() {
  if (!db) {
    throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env values.");
  }

  return db;
}

export function typedCollection<TDocument extends { id: string }>(
  path: string,
): CollectionReference<TDocument> {
  return collection(requireFirestore(), path).withConverter(
    createFirestoreConverter<TDocument>(),
  );
}

export function typedDoc<TDocument extends { id: string }>(
  path: string,
  id: string,
): DocumentReference<TDocument> {
  return doc(requireFirestore(), path, id).withConverter(
    createFirestoreConverter<TDocument>(),
  );
}

export function typedQuery<TDocument extends { id: string }>(
  collectionRef: CollectionReference<TDocument>,
  constraints: QueryConstraint[] = [],
) {
  return query(collectionRef, ...constraints);
}

export function usersCollection() {
  return typedCollection<UserDocument>(ROOT_COLLECTIONS.users);
}

export function userDoc(uid: string) {
  return typedDoc<UserDocument>(ROOT_COLLECTIONS.users, uid);
}

export function playersCollection() {
  return typedCollection<PlayerDocument>(ROOT_COLLECTIONS.players);
}

export function playerDoc(playerId: string) {
  return typedDoc<PlayerDocument>(ROOT_COLLECTIONS.players, playerId);
}

export function settingsDoc() {
  return typedDoc<SettingsDocument>(
    ROOT_COLLECTIONS.settings,
    SINGLE_DOCUMENT_IDS.settings,
  );
}

export function auctionDetailsDoc(auctionId: string) {
  return typedDoc<AuctionDetailsDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.details),
    SINGLE_DOCUMENT_IDS.auctionDetails,
  );
}

export function auctionStateDoc(auctionId: string) {
  return typedDoc<AuctionStateDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.auctionState),
    SINGLE_DOCUMENT_IDS.auctionState,
  );
}

export function auctionPlayersCollection(auctionId: string) {
  return typedCollection<AuctionPlayerDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.auctionPlayers),
  );
}

export function auctionPlayerDoc(auctionId: string, auctionPlayerId: string) {
  return typedDoc<AuctionPlayerDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.auctionPlayers),
    auctionPlayerId,
  );
}

export function auctionTeamsCollection(auctionId: string) {
  return typedCollection<AuctionTeamDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.teams),
  );
}

export function auctionTeamDoc(auctionId: string, teamId: string) {
  return typedDoc<AuctionTeamDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.teams),
    teamId,
  );
}

export function bidsCollection(auctionId: string) {
  return typedCollection<BidDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.bids),
  );
}

export function bidDoc(auctionId: string, bidId: string) {
  return typedDoc<BidDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.bids),
    bidId,
  );
}

export function historyCollection(auctionId: string) {
  return typedCollection<HistoryDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.history),
  );
}

export function historyDoc(auctionId: string, historyId: string) {
  return typedDoc<HistoryDocument>(
    auctionSubcollectionPath(auctionId, AUCTION_COLLECTIONS.history),
    historyId,
  );
}
