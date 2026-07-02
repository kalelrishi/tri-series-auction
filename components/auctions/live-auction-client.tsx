"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Radio, XCircle } from "lucide-react";
import { getAuction } from "@/services/auctions-service";
import type { AuctionDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LiveAuctionState =
  | { status: "loading" }
  | { status: "ready"; auction: AuctionDocument | null }
  | { status: "error"; message: string };

export function LiveAuctionClient({ auctionId }: { auctionId: string }) {
  const [state, setState] = useState<LiveAuctionState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadAuction() {
      try {
        const auction = await getAuction(auctionId);

        if (active) {
          setState({ status: "ready", auction });
        }
      } catch {
        if (active) {
          setState({
            status: "error",
            message: "Unable to load the live auction right now.",
          });
        }
      }
    }

    void loadAuction();

    return () => {
      active = false;
    };
  }, [auctionId]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Button
        asChild
        href={`/auctions/${auctionId}`}
        variant="ghost"
        className="w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Auction Dashboard
      </Button>

      {state.status === "loading" ? (
        <Card className="flex min-h-56 items-center justify-center p-8 text-slate-300">
          <Loader2 className="mr-3 size-5 animate-spin text-cyan-200" />
          Loading live auction...
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <XCircle className="size-10 text-red-300" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold text-white">
            Live auction unavailable
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            {state.message}
          </p>
        </Card>
      ) : null}

      {state.status === "ready" ? (
        <LiveAuctionOverview auction={state.auction} />
      ) : null}
    </div>
  );
}

function LiveAuctionOverview({
  auction,
}: {
  auction: AuctionDocument | null;
}) {
  if (!auction) {
    return (
      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-200">
          Auction Missing
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">
          Auction was not found
        </h2>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Live Auction
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-white">
            {auction.name}
          </h2>
        </div>
        <span className="w-fit rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
          {auction.status}
        </span>
      </div>

      <div className="mt-6 rounded-md border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center gap-3">
          <Radio className="size-5 text-cyan-200" aria-hidden="true" />
          <div>
            <p className="text-sm text-slate-400">Current Stage</p>
            <p className="mt-1 text-lg font-bold text-white">
              Waiting for first nomination
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
