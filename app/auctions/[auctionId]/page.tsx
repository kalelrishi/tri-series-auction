import { ArrowLeft, Gavel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AuctionManagementPageProps = {
  params: Promise<{
    auctionId: string;
  }>;
};

export default async function AuctionManagementPage({
  params,
}: AuctionManagementPageProps) {
  const { auctionId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Button asChild href="/auctions" variant="ghost" className="w-fit">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Auctions
      </Button>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
            <Gavel className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Auction Management
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Auction {auctionId}
            </h2>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
          This route is ready for auction-specific management. Live bidding,
          history, budget deduction, team assignment changes, and captain login
          are intentionally not implemented in this phase.
        </p>
      </Card>
    </div>
  );
}
