import { orderBy, serverTimestamp } from "firebase/firestore";
import {
  auctionDoc,
  auctionsCollection,
  typedQuery,
} from "@/lib/firebase/refs";
import { auctionSchema, createAuctionSchema } from "@/lib/firebase/schema";
import {
  addDocument,
  getCollection,
  getDocument,
  mergeDocument,
} from "@/services/firestore";
import type { CreateAuctionInput } from "@/types";
import { validateInput } from "@/utils/validation";

export class AuctionStartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuctionStartError";
  }
}

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

export async function startAuction(auctionId: string) {
  const auction = await getAuction(auctionId);

  if (!auction) {
    throw new AuctionStartError("Auction was not found.");
  }

  if (auction.status === "Live") {
    throw new AuctionStartError("This auction is already live.");
  }

  if (auction.status === "Completed") {
    throw new AuctionStartError("Completed auctions cannot be started again.");
  }

  if (auction.status !== "Draft") {
    throw new AuctionStartError("Only draft auctions can be started.");
  }

  return mergeDocument(auctionDoc(auctionId), {
    status: "Live",
    startedAt: serverTimestamp(),
  });
}
