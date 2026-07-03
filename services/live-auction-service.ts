import { auctionDoc } from "@/lib/firebase/refs";
import { getAuction } from "@/services/auctions-service";
import { mergeDocument } from "@/services/firestore";
import { listPlayers } from "@/services/players-service";
import { listTeams } from "@/services/teams-service";
import type { AuctionDocument, PlayerDocument, TeamDocument } from "@/types";

export type LiveAuctionData = {
  auction: AuctionDocument | null;
  availablePlayers: PlayerDocument[];
  currentPlayer: PlayerDocument | null;
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
  const assignedPlayerIds = new Set(
    teams.flatMap((team) =>
      (team.players ?? []).map((player) => player.playerId),
    ),
  );
  const availablePlayers = players.filter(
    (player) => player.active && !assignedPlayerIds.has(player.id),
  );
  const currentPlayer =
    availablePlayers.find((player) => player.id === auction?.currentPlayerId) ??
    null;

  return {
    auction,
    availablePlayers,
    currentPlayer,
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
    teams: data.teams,
    auctionComplete: false,
    nominatedPlayer: nextPlayer,
  };
}
