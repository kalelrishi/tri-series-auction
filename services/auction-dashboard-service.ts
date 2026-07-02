import { getAuction } from "@/services/auctions-service";
import { listPlayers } from "@/services/players-service";
import { listTeams } from "@/services/teams-service";

export async function getAuctionDashboard(auctionId: string) {
  const [auction, teams, players] = await Promise.all([
    getAuction(auctionId),
    listTeams(auctionId),
    listPlayers(),
  ]);

  return {
    auction,
    teams,
    activePlayersCount: players.filter((player) => player.active).length,
  };
}
