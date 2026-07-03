import {
  doc,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  auctionDoc,
  auctionTeamDoc,
  auctionTeamsCollection,
  bidsCollection,
  historyCollection,
  requireFirestore,
  typedQuery,
} from "@/lib/firebase/refs";
import { getAuction } from "@/services/auctions-service";
import {
  addDocument,
  getCollection,
  mergeDocument,
  subscribeToCollection,
  subscribeToDocument,
} from "@/services/firestore";
import { listPlayers } from "@/services/players-service";
import { listTeams } from "@/services/teams-service";
import type {
  AuctionDocument,
  BidDocument,
  HistoryDocument,
  PlayerDocument,
  TeamDocument,
} from "@/types";

const BID_INCREMENT = 5;

export class InsufficientBudgetError extends Error {
  constructor() {
    super("Insufficient budget.");
    this.name = "InsufficientBudgetError";
  }
}

export class ConsecutiveBidError extends Error {
  constructor() {
    super("You are already the highest bidder.");
    this.name = "ConsecutiveBidError";
  }
}

export type LiveAuctionData = {
  auction: AuctionDocument | null;
  availablePlayers: PlayerDocument[];
  currentPlayer: PlayerDocument | null;
  history: HistoryDocument[];
  teams: TeamDocument[];
};

export async function getLiveAuctionData(
  auctionId: string,
): Promise<LiveAuctionData> {
  const [auction, players, teams] = await Promise.all([
    getAuction(auctionId),
    listPlayers(),
    listTeams(auctionId),
  ]);
  const history = await getAuctionHistory(auctionId);
  const assignedPlayerIds = new Set(
    teams.flatMap((team) =>
      (team.players ?? []).map((player) => player.playerId),
    ),
  );
  const completedPlayerIds = new Set(history.map((item) => item.playerId));
  const availablePlayers = players.filter(
    (player) =>
      player.active &&
      !assignedPlayerIds.has(player.id) &&
      !completedPlayerIds.has(player.id),
  );
  const currentPlayer =
    availablePlayers.find((player) => player.id === auction?.currentPlayerId) ??
    null;

  return {
    auction,
    availablePlayers,
    currentPlayer,
    history,
    teams,
  };
}

export async function nominateNextPlayer(auctionId: string) {
  const data = await getLiveAuctionData(auctionId);

  if (!data.auction) {
    throw new Error("Auction was not found.");
  }

  if (data.auction.status !== "Live") {
    throw new Error("Only live auctions can nominate players.");
  }

  if (data.auction.currentPlayerId) {
    throw new Error("A player is already nominated.");
  }

  const nextPlayer = data.availablePlayers[0] ?? null;

  if (!nextPlayer) {
    return {
      ...data,
      auctionComplete: true,
      nominatedPlayer: null,
    };
  }

  await mergeDocument(auctionDoc(auctionId), {
    currentPlayerId: nextPlayer.id,
    currentBid: nextPlayer.basePrice,
    leadingTeamId: null,
    leadingTeamName: null,
  });

  return {
    auction: {
      ...data.auction,
      currentPlayerId: nextPlayer.id,
      currentBid: nextPlayer.basePrice,
      leadingTeamId: null,
      leadingTeamName: null,
    },
    availablePlayers: data.availablePlayers,
    currentPlayer: nextPlayer,
    history: data.history,
    teams: data.teams,
    auctionComplete: false,
    nominatedPlayer: nextPlayer,
  };
}

export async function markCurrentPlayerSold(auctionId: string) {
  return completeCurrentPlayer(auctionId, "Sold");
}

export async function markCurrentPlayerUnsold(auctionId: string) {
  return completeCurrentPlayer(auctionId, "Unsold");
}

async function completeCurrentPlayer(
  auctionId: string,
  status: HistoryDocument["status"],
) {
  const data = await getLiveAuctionData(auctionId);

  if (!data.auction) {
    throw new Error("Auction was not found.");
  }

  if (data.auction.status !== "Live") {
    throw new Error("Only live auctions can complete players.");
  }

  if (!data.currentPlayer || !data.auction.currentPlayerId) {
    throw new Error("No player is currently nominated.");
  }

  if (status === "Sold" && !data.auction.leadingTeamId) {
    throw new Error("A player cannot be sold without a leading team.");
  }

  const nextPlayer =
    data.availablePlayers.find(
      (player) => player.id !== data.auction?.currentPlayerId,
    ) ?? null;
  const round = data.history.length + 1;

  return runTransaction(requireFirestore(), async (transaction) => {
    const auctionRef = auctionDoc(auctionId);
    const auctionSnapshot = await transaction.get(auctionRef);

    if (!auctionSnapshot.exists()) {
      throw new Error("Auction was not found.");
    }

    const auction = auctionSnapshot.data();

    if (auction.currentPlayerId !== data.currentPlayer?.id) {
      throw new Error("Auction state changed. Please try again.");
    }

    let winningTeamId: string | null = null;
    let winningTeamName: string | null = null;
    let finalPrice: number | null = null;

    if (status === "Sold") {
      const teamId = auction.leadingTeamId;

      if (!teamId || !auction.leadingTeamName) {
        throw new Error("A player cannot be sold without a leading team.");
      }

      const teamRef = auctionTeamDoc(auctionId, teamId);
      const teamSnapshot = await transaction.get(teamRef);

      if (!teamSnapshot.exists()) {
        throw new Error("Winning team was not found.");
      }

      const team = teamSnapshot.data();
      const purchasePrice = auction.currentBid ?? data.currentPlayer.basePrice;
      const nextBudget = team.budgetRemaining - purchasePrice;

      if (nextBudget < 0) {
        throw new InsufficientBudgetError();
      }

      const nextPlayers = [
        ...(team.players ?? []),
        {
          playerId: data.currentPlayer.id,
          playerName: data.currentPlayer.name,
          role: data.currentPlayer.role,
          purchasePrice,
          isCaptain: false,
          joinedAt: Timestamp.now(),
        },
      ];

      transaction.set(
        teamRef,
        {
          players: nextPlayers,
          playersCount: nextPlayers.length,
          budgetRemaining: nextBudget,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      winningTeamId = team.id;
      winningTeamName = team.name;
      finalPrice = purchasePrice;
    }

    const historyRef = doc(historyCollection(auctionId));
    transaction.set(historyRef, {
      id: historyRef.id,
      auctionId,
      playerId: data.currentPlayer.id,
      playerName: data.currentPlayer.name,
      playerRole: data.currentPlayer.role,
      status,
      winningTeamId,
      winningTeamName,
      finalPrice,
      round,
      timestamp: serverTimestamp(),
    });

    transaction.set(
      auctionRef,
      nextPlayer
        ? {
            currentPlayerId: nextPlayer.id,
            currentBid: nextPlayer.basePrice,
            leadingTeamId: null,
            leadingTeamName: null,
          }
        : {
            status: "Completed",
            currentPlayerId: null,
            currentBid: null,
            leadingTeamId: null,
            leadingTeamName: null,
            endedAt: serverTimestamp(),
          },
      { merge: true },
    );

    return {
      nextPlayer,
      auctionComplete: !nextPlayer,
    };
  });
}

export async function placeCaptainBid(auctionId: string, teamId: string) {
  const result = await runTransaction(requireFirestore(), async (transaction) => {
    const auctionRef = auctionDoc(auctionId);
    const teamRef = auctionTeamDoc(auctionId, teamId);
    const [auctionSnapshot, teamSnapshot] = await Promise.all([
      transaction.get(auctionRef),
      transaction.get(teamRef),
    ]);

    if (!auctionSnapshot.exists()) {
      throw new Error("Auction was not found.");
    }

    if (!teamSnapshot.exists()) {
      throw new Error("Team was not found.");
    }

    const auction = auctionSnapshot.data();
    const team = teamSnapshot.data();

    if (!auction.currentPlayerId) {
      throw new Error("No player is currently nominated.");
    }

    if (auction.leadingTeamId === team.id) {
      throw new ConsecutiveBidError();
    }

    const nextBid = (auction.currentBid ?? 0) + BID_INCREMENT;

    if (team.budgetRemaining < nextBid) {
      throw new InsufficientBudgetError();
    }

    transaction.set(
      auctionRef,
      {
        currentBid: nextBid,
        leadingTeamId: team.id,
        leadingTeamName: team.name,
      },
      { merge: true },
    );

    return {
      amount: nextBid,
      playerId: auction.currentPlayerId,
      teamId: team.id,
    };
  });

  await addDocument(bidsCollection(auctionId), {
    playerId: result.playerId,
    teamId: result.teamId,
    amount: result.amount,
    timestamp: serverTimestamp(),
  });

  return result;
}

export function subscribeToLiveAuction(
  auctionId: string,
  onNext: (auction: AuctionDocument | null) => void,
  onError?: (error: Error) => void,
) {
  return subscribeToDocument(auctionDoc(auctionId), onNext, onError);
}

export function subscribeToBidActivity(
  auctionId: string,
  onNext: (bids: BidDocument[]) => void,
  onError?: (error: Error) => void,
) {
  return subscribeToCollection(
    typedQuery(bidsCollection(auctionId), [orderBy("timestamp", "desc")]),
    onNext,
    onError,
  );
}

export async function getAuctionHistory(auctionId: string) {
  return getCollection(
    typedQuery(historyCollection(auctionId), [orderBy("timestamp", "desc")]),
  );
}

export function subscribeToAuctionHistory(
  auctionId: string,
  onNext: (history: HistoryDocument[]) => void,
  onError?: (error: Error) => void,
) {
  return subscribeToCollection(
    typedQuery(historyCollection(auctionId), [orderBy("timestamp", "desc")]),
    onNext,
    onError,
  );
}

export function subscribeToLiveTeams(
  auctionId: string,
  onNext: (teams: TeamDocument[]) => void,
  onError?: (error: Error) => void,
) {
  return subscribeToCollection(
    typedQuery(auctionTeamsCollection(auctionId), [orderBy("name", "asc")]),
    onNext,
    onError,
  );
}
