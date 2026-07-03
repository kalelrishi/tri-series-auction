"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Radio, UserRound, XCircle } from "lucide-react";
import {
  getLiveAuctionData,
  nominateNextPlayer,
  type LiveAuctionData,
} from "@/services/live-auction-service";
import type { AuctionDocument, PlayerDocument, TeamDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LiveAuctionState =
  | { status: "loading" }
  | { status: "ready"; data: LiveAuctionData; auctionComplete: boolean }
  | { status: "error"; message: string };

export function LiveAuctionClient({ auctionId }: { auctionId: string }) {
  const [state, setState] = useState<LiveAuctionState>({ status: "loading" });
  const [nominationError, setNominationError] = useState<string | null>(null);
  const [nominating, setNominating] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLiveAuction() {
      try {
        const data = await getLiveAuctionData(auctionId);

        if (active) {
          setState({
            status: "ready",
            data,
            auctionComplete: data.availablePlayers.length === 0,
          });
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

    void loadLiveAuction();

    return () => {
      active = false;
    };
  }, [auctionId]);

  async function handleNominatePlayer() {
    setNominating(true);
    setNominationError(null);

    try {
      const result = await nominateNextPlayer(auctionId);
      setState({
        status: "ready",
        data: {
          auction: result.auction,
          availablePlayers: result.availablePlayers,
          currentPlayer: result.currentPlayer,
          teams: result.teams,
        },
        auctionComplete: result.auctionComplete,
      });
    } catch (error) {
      setNominationError(getErrorMessage(error));
    } finally {
      setNominating(false);
    }
  }

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
        <LiveAuctionOverview
          auction={state.data.auction}
          auctionComplete={state.auctionComplete}
          availablePlayersCount={state.data.availablePlayers.length}
          currentPlayer={state.data.currentPlayer}
          nominationError={nominationError}
          nominating={nominating}
          onNominatePlayer={() => {
            void handleNominatePlayer();
          }}
          teams={state.data.teams}
        />
      ) : null}
    </div>
  );
}

function LiveAuctionOverview({
  auction,
  auctionComplete,
  availablePlayersCount,
  currentPlayer,
  nominationError,
  nominating,
  onNominatePlayer,
  teams,
}: {
  auction: AuctionDocument | null;
  auctionComplete: boolean;
  availablePlayersCount: number;
  currentPlayer: PlayerDocument | null;
  nominationError: string | null;
  nominating: boolean;
  onNominatePlayer: () => void;
  teams: TeamDocument[];
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
          <p className="mt-2 text-sm text-slate-400">
            {availablePlayersCount} active unassigned players available
          </p>
        </div>
        <span className="w-fit rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
          {auction.status}
        </span>
      </div>

      <div className="mt-6 rounded-md border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Radio className="size-5 text-cyan-200" aria-hidden="true" />
            <div>
              <p className="text-sm text-slate-400">Current Stage</p>
              <p className="mt-1 text-lg font-bold text-white">
                {auctionComplete
                  ? "Auction Complete"
                  : currentPlayer
                    ? "Player nominated"
                    : "No player nominated."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            disabled={
              nominating ||
              auction.status !== "Live" ||
              auctionComplete ||
              Boolean(currentPlayer)
            }
            onClick={onNominatePlayer}
          >
            {nominating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserRound className="size-4" aria-hidden="true" />
            )}
            {nominating ? "Nominating..." : "Nominate Player"}
          </Button>
        </div>
        {nominationError ? (
          <p className="mt-3 text-sm text-red-200">{nominationError}</p>
        ) : null}
      </div>

      {auctionComplete ? (
        <Card className="mt-5 border-emerald-300/20 bg-emerald-300/10 p-5">
          <p className="text-lg font-bold text-white">Auction Complete</p>
          <p className="mt-2 text-sm text-emerald-100">
            No active unassigned players remain for nomination.
          </p>
        </Card>
      ) : null}

      {currentPlayer ? (
        <LiveBiddingLayout
          auction={auction}
          currentPlayer={currentPlayer}
          teams={teams}
        />
      ) : null}
    </Card>
  );
}

function LiveBiddingLayout({
  auction,
  currentPlayer,
  teams,
}: {
  auction: AuctionDocument;
  currentPlayer: PlayerDocument;
  teams: TeamDocument[];
}) {
  const leadingTeam = auction.leadingTeamName ?? "No bids yet";

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Current Player
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          {currentPlayer.name}
        </h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile label="Role" value={currentPlayer.role} />
          <InfoTile
            label="Base Price"
            value={formatPoints(currentPlayer.basePrice)}
          />
          <InfoTile
            label="Current Bid"
            value={
              auction.currentBid === null || auction.currentBid === undefined
                ? "-"
                : formatPoints(auction.currentBid)
            }
          />
          <InfoTile label="Leading Team" value={leadingTeam} />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Team Bids
        </p>
        <div className="mt-4 grid gap-3">
          {teams.length === 0 ? (
            <p className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
              No teams available for this auction.
            </p>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-4 shrink-0 rounded-sm border border-white/20"
                    style={{ backgroundColor: team.color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {team.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Remaining: {formatPoints(team.budgetRemaining)}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="secondary" disabled>
                  Bid
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatPoints(points: number) {
  return new Intl.NumberFormat("en-IN").format(points);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to nominate the next player right now.";
}
