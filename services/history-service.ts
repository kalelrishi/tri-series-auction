import { listAuctions } from "@/services/auctions-service";
import { getAuctionHistory } from "@/services/live-auction-service";
import { listTeams } from "@/services/teams-service";
import type { AuctionDocument, HistoryDocument, TeamDocument } from "@/types";

export type AuctionReport = {
  auction: AuctionDocument;
  history: HistoryDocument[];
  teams: TeamDocument[];
  playersSold: number;
  playersUnsold: number;
  totalSpending: number;
};

export async function listAuctionReports(): Promise<AuctionReport[]> {
  const auctions = await listAuctions();
  const reports = await Promise.all(
    auctions.map(async (auction) => {
      const [history, teams] = await Promise.all([
        getAuctionHistory(auction.id),
        listTeams(auction.id),
      ]);
      const sold = history.filter((item) => item.status === "Sold");

      return {
        auction,
        history,
        teams,
        playersSold: sold.length,
        playersUnsold: history.filter((item) => item.status === "Unsold").length,
        totalSpending: sold.reduce(
          (sum, item) => sum + (item.finalPrice ?? 0),
          0,
        ),
      };
    }),
  );

  return reports;
}
