"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy, XCircle } from "lucide-react";
import {
  listAuctionReports,
  type AuctionReport,
} from "@/services/history-service";
import { Card } from "@/components/ui/card";

type HistoryState =
  | { status: "loading" }
  | { status: "ready"; reports: AuctionReport[] }
  | { status: "error"; message: string };

export function HistoryClient() {
  const [state, setState] = useState<HistoryState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        const reports = await listAuctionReports();

        if (active) {
          setState({ status: "ready", reports });
        }
      } catch {
        if (active) {
          setState({
            status: "error",
            message: "Unable to load auction history right now.",
          });
        }
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <Card className="flex min-h-56 items-center justify-center p-8 text-slate-300">
        <Loader2 className="mr-3 size-5 animate-spin text-cyan-200" />
        Loading history...
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
        <XCircle className="size-10 text-red-300" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-white">
          History unavailable
        </p>
        <p className="mt-2 text-sm text-slate-400">{state.message}</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Auction Ledger
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-normal text-white">
          History
        </h2>
      </div>

      {state.reports.length === 0 ? (
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <Trophy className="size-10 text-slate-500" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold text-white">
            No auction history yet
          </p>
        </Card>
      ) : (
        state.reports.map((report) => (
          <AuctionReportCard key={report.auction.id} report={report} />
        ))
      )}
    </div>
  );
}

function AuctionReportCard({ report }: { report: AuctionReport }) {
  const sold = report.history.filter((item) => item.status === "Sold");
  const unsold = report.history.filter((item) => item.status === "Unsold");

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">
            {report.auction.name}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Status: {report.auction.status}
          </p>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <InfoTile label="Sold" value={String(report.playersSold)} />
          <InfoTile label="Unsold" value={String(report.playersUnsold)} />
          <InfoTile
            label="Total Spending"
            value={formatPoints(report.totalSpending)}
          />
        </div>
      </div>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Sold Players
          </p>
          <div className="mt-3 grid gap-2">
            {sold.length === 0 ? (
              <EmptyText>No sold players.</EmptyText>
            ) : (
              sold.map((item) => (
                <HistoryRow
                  key={item.id}
                  left={`${item.round}. ${item.playerName}`}
                  right={`${item.winningTeamName ?? "-"} - ${formatPoints(item.finalPrice ?? 0)}`}
                  sub={item.playerRole}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-200">
            Unsold Players
          </p>
          <div className="mt-3 grid gap-2">
            {unsold.length === 0 ? (
              <EmptyText>No unsold players.</EmptyText>
            ) : (
              unsold.map((item) => (
                <HistoryRow
                  key={item.id}
                  left={`${item.round}. ${item.playerName}`}
                  right="Unsold"
                  sub={item.playerRole}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Final Team Squads
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {report.teams.map((team) => {
            const spent = team.budgetTotal - team.budgetRemaining;

            return (
              <div
                key={team.id}
                className="rounded-md border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="font-bold text-white">{team.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Remaining: {formatPoints(team.budgetRemaining)}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Spent: {formatPoints(spent)}
                </p>
                <div className="mt-3 grid gap-2">
                  {(team.players ?? []).map((player) => (
                    <div
                      key={player.playerId}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="text-slate-200">{player.playerName}</span>
                      <span className="text-slate-400">
                        {formatPoints(player.purchasePrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Card>
  );
}

function HistoryRow({
  left,
  right,
  sub,
}: {
  left: string;
  right: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <div className="flex justify-between gap-3">
        <p className="font-semibold text-white">{left}</p>
        <p className="text-sm text-emerald-100">{right}</p>
      </div>
      <p className="mt-1 text-sm text-slate-400">{sub}</p>
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
      {children}
    </p>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatPoints(points: number) {
  return new Intl.NumberFormat("en-IN").format(points);
}
