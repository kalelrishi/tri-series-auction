"use client";

import { useEffect, useState } from "react";
import { Loader2, Radio, Trophy, Users, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getCaptainDashboardData,
  subscribeToCaptainDashboardData,
  type CaptainDashboardData,
} from "@/services/captain-dashboard-service";
import { Card } from "@/components/ui/card";

type DashboardState =
  | { status: "loading" }
  | { status: "ready"; data: CaptainDashboardData }
  | { status: "error"; message: string };

export function CaptainDashboardClient() {
  const { captainSession } = useAuth();
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    if (!captainSession) {
      return;
    }

    setState({ status: "loading" });

    const unsubscribe = subscribeToCaptainDashboardData(
      captainSession.auctionId,
      captainSession.teamId,
      (data) => {
        setState({ status: "ready", data });
      },
      () => {
        setState({
          status: "error",
          message: "Unable to load captain dashboard right now.",
        });
      },
    );

    void getCaptainDashboardData(
      captainSession.auctionId,
      captainSession.teamId,
    )
      .then((data) => {
        setState((previous) =>
          previous.status === "loading" ? { status: "ready", data } : previous,
        );
      })
      .catch(() => {
        setState((previous) =>
          previous.status === "loading"
            ? {
                status: "error",
                message: "Unable to load captain dashboard right now.",
              }
            : previous,
        );
      });

    return unsubscribe;
  }, [captainSession]);

  if (!captainSession || state.status === "loading") {
    return (
      <Card className="flex min-h-56 items-center justify-center p-8 text-slate-300">
        <Loader2 className="mr-3 size-5 animate-spin text-cyan-200" />
        Loading captain dashboard...
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
        <XCircle className="size-10 text-red-300" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-white">
          Dashboard unavailable
        </p>
        <p className="mt-2 text-sm text-slate-400">{state.message}</p>
      </Card>
    );
  }

  const { auction, currentPlayer, team } = state.data;
  const players = team?.players ?? [];
  const purchasedPlayers = players.filter((player) => !player.isCaptain);
  const totalSpent = players.reduce(
    (sum, player) => sum + player.purchasePrice,
    0,
  );
  const auctionCompleted = auction?.status === "Completed";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Captain Dashboard
        </p>
        <div className="mt-2 flex items-center gap-3">
          {team?.color ? (
            <span
              className="size-9 rounded-md border border-white/15"
              style={{ backgroundColor: team.color }}
              aria-label={`${team.name} team color`}
            />
          ) : null}
          <h2 className="text-3xl font-black tracking-normal text-white">
            {team?.name ?? captainSession.teamName}
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Captain: {team?.captainName ?? captainSession.captainName}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={<Trophy className="size-5 text-emerald-200" />}
          label="Budget Remaining"
          value={formatPoints(team?.budgetRemaining ?? 0)}
        />
        <InfoCard
          icon={<Users className="size-5 text-cyan-200" />}
          label="Players"
          value={`${team?.playersCount ?? team?.players?.length ?? 0} / ${auction?.maxPlayersPerTeam ?? 7}`}
        />
        <InfoCard
          icon={<Radio className="size-5 text-emerald-200" />}
          label="Auction Status"
          value={auction?.status ?? "Unknown"}
        />
        <InfoCard
          icon={<Radio className="size-5 text-cyan-200" />}
          label="Total Spent"
          value={formatPoints(totalSpent)}
        />
      </section>

      {auctionCompleted ? (
        <Card className="border-emerald-300/20 bg-emerald-300/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Auction Completed
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoTile
              label="Final Squad"
              value={String(players.length)}
            />
            <InfoTile
              label="Purchased Players"
              value={String(purchasedPlayers.length)}
            />
            <InfoTile
              label="Remaining Budget"
              value={formatPoints(team?.budgetRemaining ?? 0)}
            />
          </div>
        </Card>
      ) : (
        <InfoCard
          icon={<Radio className="size-5 text-cyan-200" />}
          label="Leading Team"
          value={auction?.leadingTeamName ?? "No bids yet"}
        />
      )}

      <Card className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
          {auctionCompleted ? "Final Auction State" : "Live Auction"}
        </p>
        {auctionCompleted ? (
          <p className="mt-4 text-sm text-slate-300">
            The auction has ended. Your final squad is available below.
          </p>
        ) : currentPlayer ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile label="Current Player" value={currentPlayer.name} />
            <InfoTile label="Role" value={currentPlayer.role} />
            <InfoTile
              label="Base Price"
              value={formatPoints(currentPlayer.basePrice)}
            />
            <InfoTile
              label="Current Bid"
              value={
                auction?.currentBid === null || auction?.currentBid === undefined
                  ? "-"
                  : formatPoints(auction.currentBid)
              }
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No player nominated.</p>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Final Squad
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {players.map((player) => (
            <div
              key={player.playerId}
              className="rounded-md border border-white/10 bg-white/[0.04] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {player.playerName}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {player.role}
                    {player.isCaptain ? " · Captain" : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-emerald-100">
                  {formatPoints(player.purchasePrice)}
                </p>
              </div>
            </div>
          ))}
          {players.length === 0 ? (
            <p className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
              No players assigned yet.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-sm text-slate-400">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </Card>
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
