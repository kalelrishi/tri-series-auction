"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Play,
  Radio,
  RotateCcw,
  UsersRound,
  XCircle,
} from "lucide-react";
import { getAuctionDashboard } from "@/services/auction-dashboard-service";
import {
  resetAuctionToDraft,
  startAuction,
} from "@/services/auctions-service";
import type { AuctionDocument, TeamDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

type AuctionDashboardState =
  | { status: "loading" }
  | {
      status: "ready";
      auction: AuctionDocument | null;
      teams: TeamDocument[];
      activePlayersCount: number;
    }
  | { status: "error"; message: string };

type ReadinessItem = {
  label: string;
  passed: boolean;
  reason: string;
};

export function AuctionDashboardClient({ auctionId }: { auctionId: string }) {
  const router = useRouter();
  const [state, setState] = useState<AuctionDashboardState>({
    status: "loading",
  });
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function refreshDashboard() {
    const dashboard = await getAuctionDashboard(auctionId);
    setState({
      status: "ready",
      ...dashboard,
    });
  }

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const dashboard = await getAuctionDashboard(auctionId);

        if (active) {
          setState({
            status: "ready",
            ...dashboard,
          });
        }
      } catch {
        if (active) {
          setState({
            status: "error",
            message: "Unable to load this auction dashboard right now.",
          });
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [auctionId]);

  if (state.status === "loading") {
    return (
      <DashboardFrame>
        <Card className="flex min-h-56 items-center justify-center p-8 text-slate-300">
          <Loader2 className="mr-3 size-5 animate-spin text-cyan-200" />
          Loading auction dashboard...
        </Card>
      </DashboardFrame>
    );
  }

  if (state.status === "error") {
    return (
      <DashboardFrame>
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <XCircle className="size-10 text-red-300" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold text-white">
            Dashboard unavailable
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            {state.message}
          </p>
        </Card>
      </DashboardFrame>
    );
  }

  const { auction, teams, activePlayersCount } = state;

  return (
    <DashboardFrame>
      <AuctionOverview auction={auction} />
      <div className="flex justify-end">
        <Button asChild href={`/auctions/${auctionId}/teams`} variant="secondary">
          <UsersRound className="size-4" aria-hidden="true" />
          Manage Teams
        </Button>
      </div>
      <TeamsSection teams={teams} maxPlayers={auction?.maxPlayersPerTeam ?? 7} />
      <ReadinessSection
        activePlayersCount={activePlayersCount}
        auction={auction}
        onStart={async () => {
          setStarting(true);
          setStartError(null);

          try {
            await startAuction(auctionId);
            window.dispatchEvent(new Event("auction-navigation-refresh"));
            router.push(`/auctions/${auctionId}/live`);
          } catch (error) {
            setStartError(getErrorMessage(error));
          } finally {
            setStarting(false);
          }
        }}
        onResetToDraft={async () => {
          if (!window.confirm("Reset this auction to Draft for development?")) {
            return;
          }

          setResetting(true);
          setStartError(null);

          try {
            await resetAuctionToDraft(auctionId);
            await refreshDashboard();
            window.dispatchEvent(new Event("auction-navigation-refresh"));
          } catch (error) {
            setStartError(getErrorMessage(error));
          } finally {
            setResetting(false);
          }
        }}
        onContinue={() => {
          router.push(`/auctions/${auctionId}/live`);
        }}
        resetting={resetting}
        startError={startError}
        starting={starting}
        teams={teams}
      />
    </DashboardFrame>
  );
}

function DashboardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Button asChild href="/auctions" variant="ghost" className="w-fit">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Auctions
      </Button>
      {children}
    </div>
  );
}

function AuctionOverview({ auction }: { auction: AuctionDocument | null }) {
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
            Auction Dashboard
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-white">
            {auction.name}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{formatDate(auction.date)}</p>
        </div>
        <span
          className={cn(
            "w-fit rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
            getStatusBadgeClasses(auction.status),
          )}
        >
          {auction.status}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoTile label="Date" value={formatDate(auction.date)} />
        <InfoTile label="Status" value={auction.status} />
        <InfoTile
          label="Starting Budget"
          value={formatPoints(auction.startingBudget)}
        />
        <InfoTile
          label="Max Players Per Team"
          value={String(auction.maxPlayersPerTeam)}
        />
      </div>
    </Card>
  );
}

function TeamsSection({
  maxPlayers,
  teams,
}: {
  maxPlayers: number;
  teams: TeamDocument[];
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {teams.length === 0 ? (
        <Card className="p-6 text-center md:col-span-2 xl:col-span-3">
          <p className="text-lg font-semibold text-white">No teams yet</p>
          <p className="mt-2 text-sm text-slate-400">
            Create exactly 3 teams before starting this auction.
          </p>
        </Card>
      ) : (
        teams.map((team) => (
          <Card key={team.id} className="overflow-hidden">
            <div
              className="h-2"
              style={{ backgroundColor: team.color }}
              aria-hidden="true"
            />
            <div className="p-5">
              <h3 className="truncate text-xl font-bold text-white">
                {team.name}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Captain: {team.captainName || "Not assigned"}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <InfoTile
                  label="Players"
                  value={`${team.playersCount ?? team.players?.length ?? 0} / ${maxPlayers}`}
                />
                <InfoTile
                  label="Remaining Budget"
                  value={formatPoints(team.budgetRemaining)}
                />
              </div>
            </div>
          </Card>
        ))
      )}
    </section>
  );
}

function ReadinessSection({
  activePlayersCount,
  auction,
  onContinue,
  onResetToDraft,
  onStart,
  resetting,
  startError,
  starting,
  teams,
}: {
  activePlayersCount: number;
  auction: AuctionDocument | null;
  onContinue: () => void;
  onResetToDraft: () => Promise<void>;
  onStart: () => Promise<void>;
  resetting: boolean;
  startError: string | null;
  starting: boolean;
  teams: TeamDocument[];
}) {
  const readiness = useMemo(
    () => getReadinessItems(auction, teams, activePlayersCount),
    [activePlayersCount, auction, teams],
  );
  const allReady = readiness.every((item) => item.passed);
  const statusBlockReason = getStartStatusBlockReason(auction);
  const disabledReason =
    statusBlockReason ?? readiness.find((item) => !item.passed)?.reason;
  const canStart = allReady && !statusBlockReason;
  const isLive = auction?.status === "Live";
  const isCompleted = auction?.status === "Completed";

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Auction Readiness
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Start checklist
          </h3>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          {isLive ? (
            <Button type="button" onClick={onContinue}>
              <Radio className="size-4" aria-hidden="true" />
              Continue Live Auction
            </Button>
          ) : null}
          {!isLive && !isCompleted ? (
            <Button type="button" disabled={!canStart || starting} onClick={onStart}>
              {starting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
              {starting ? "Starting..." : "Start Auction"}
            </Button>
          ) : null}
          {isCompleted ? (
            <p className="max-w-sm text-sm text-slate-300">
              This auction is completed.
            </p>
          ) : null}
          {!isLive && !isCompleted && !canStart && disabledReason ? (
            <p className="max-w-sm text-sm text-red-200">{disabledReason}</p>
          ) : null}
          {startError ? (
            <p className="max-w-sm text-sm text-red-200">{startError}</p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={resetting}
            onClick={() => {
              void onResetToDraft();
            }}
          >
            {resetting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="size-4" aria-hidden="true" />
            )}
            Reset Auction to Draft
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {readiness.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-4"
          >
            {item.passed ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-300" />
            ) : (
              <XCircle className="size-5 shrink-0 text-red-300" />
            )}
            <span className="text-sm font-semibold text-white">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function getReadinessItems(
  auction: AuctionDocument | null,
  teams: TeamDocument[],
  activePlayersCount: number,
): ReadinessItem[] {
  return [
    {
      label: "Auction exists",
      passed: Boolean(auction),
      reason: "Auction record is missing.",
    },
    {
      label: "Exactly 3 teams",
      passed: teams.length === 3,
      reason: "Create exactly 3 teams before starting.",
    },
    {
      label: "Every team has a captain",
      passed:
        teams.length > 0 &&
        teams.every(
          (team) =>
            Boolean(team.captainId) &&
            Boolean(team.captainName) &&
            team.players?.some((player) => player.isCaptain),
        ),
      reason: "Every team must have a captain.",
    },
    {
      label: "Starting budget initialized",
      passed: Boolean(auction && auction.startingBudget > 0),
      reason: "Set a starting budget greater than 0.",
    },
    {
      label: "At least 21 active players",
      passed: activePlayersCount >= 21,
      reason: "At least 21 active players are required.",
    },
  ];
}

function getStartStatusBlockReason(auction: AuctionDocument | null) {
  if (!auction) {
    return null;
  }

  if (auction.status === "Live") {
    return "This auction is already live.";
  }

  if (auction.status === "Completed") {
    return "Completed auctions cannot be started again.";
  }

  if (auction.status !== "Draft") {
    return "Only draft auctions can be started.";
  }

  return null;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function getStatusBadgeClasses(status: AuctionDocument["status"]) {
  if (status === "Live") {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-200";
  }

  if (status === "Completed") {
    return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  }

  return "border-cyan-300/25 bg-cyan-300/10 text-cyan-200";
}

function formatDate(value: AuctionDocument["date"]) {
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate().toLocaleDateString();
  }

  return "Date not set";
}

function formatPoints(points: number) {
  return new Intl.NumberFormat("en-IN").format(points);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to start this auction right now.";
}
