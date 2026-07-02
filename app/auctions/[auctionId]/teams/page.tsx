import { TeamsClient } from "@/components/teams/teams-client";

type AuctionTeamsPageProps = {
  params: Promise<{
    auctionId: string;
  }>;
};

export default async function AuctionTeamsPage({
  params,
}: AuctionTeamsPageProps) {
  const { auctionId } = await params;

  return <TeamsClient auctionId={auctionId} />;
}
