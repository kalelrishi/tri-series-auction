import { AuctionDashboardClient } from "@/components/auctions/auction-dashboard-client";

type AuctionManagementPageProps = {
  params: Promise<{
    auctionId: string;
  }>;
};

export default async function AuctionManagementPage({
  params,
}: AuctionManagementPageProps) {
  const { auctionId } = await params;

  return <AuctionDashboardClient auctionId={auctionId} />;
}
