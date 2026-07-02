import { LiveAuctionClient } from "@/components/auctions/live-auction-client";

type LiveAuctionPageProps = {
  params: Promise<{
    auctionId: string;
  }>;
};

export default async function LiveAuctionPage({
  params,
}: LiveAuctionPageProps) {
  const { auctionId } = await params;

  return <LiveAuctionClient auctionId={auctionId} />;
}
