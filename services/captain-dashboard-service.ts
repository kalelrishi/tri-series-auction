import { getLiveAuctionData } from "@/services/live-auction-service";
import { listTeams } from "@/services/teams-service";
import type { AuctionDocument, PlayerDocument, TeamDocument } from "@/types";

export type CaptainDashboardData = {
  auction: AuctionDocument | null;
  currentPlayer: PlayerDocument | null;
  team: TeamDocument | null;
};

export async function getCaptainDashboardData(
  auctionId: string,
  teamId: string,
): Promise<CaptainDashboardData> {
  const [liveData, teams] = await Promise.all([
    getLiveAuctionData(auctionId),
    listTeams(auctionId),
  ]);

  return {
    auction: liveData.auction,
    currentPlayer: liveData.currentPlayer,
    team: teams.find((team) => team.id === teamId) ?? null,
  };
}
