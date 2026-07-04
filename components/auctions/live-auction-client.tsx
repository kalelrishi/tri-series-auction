"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Radio,
  RotateCcw,
  UserRound,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  ConsecutiveBidError,
  getLiveAuctionData,
  InsufficientBudgetError,
  markCurrentPlayerSold,
  markCurrentPlayerUnsold,
  nominateNextPlayer,
  placeCaptainBid,
  subscribeToAuctionHistory,
  subscribeToBidActivity,
  subscribeToLiveAuction,
  subscribeToLiveTeams,
  type LiveAuctionData,
} from "@/services/live-auction-service";
import { resetAuctionToDraft } from "@/services/auctions-service";
import type {
  AuctionDocument,
  BidDocument,
  HistoryDocument,
  PlayerDocument,
  TeamDocument,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LiveAuctionState =
  | { status: "loading" }
  | { status: "ready"; data: LiveAuctionData; auctionComplete: boolean }
  | { status: "error"; message: string };

export function LiveAuctionClient({ auctionId }: { auctionId: string }) {
  const { captainSession, role } = useAuth();
  const [state, setState] = useState<LiveAuctionState>({ status: "loading" });
  const [bidActivity, setBidActivity] = useState<BidDocument[]>([]);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidding, setBidding] = useState(false);
  const [completing, setCompleting] = useState<"Sold" | "Unsold" | null>(null);
  const [nominationError, setNominationError] = useState<string | null>(null);
  const [nominating, setNominating] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  useEffect(() => {
    const unsubscribe = subscribeToLiveAuction(auctionId, (auction) => {
      setState((previous) => {
        if (previous.status !== "ready") {
          return previous;
        }

        const currentPlayer =
          previous.data.availablePlayers.find(
            (player) => player.id === auction?.currentPlayerId,
          ) ?? null;

        return {
          ...previous,
          auctionComplete: auction?.status === "Completed",
          data: {
            ...previous.data,
            auction,
            currentPlayer,
          },
        };
      });
    });

    return unsubscribe;
  }, [auctionId]);

  useEffect(() => {
    return subscribeToBidActivity(auctionId, setBidActivity);
  }, [auctionId]);

  useEffect(() => {
    return subscribeToAuctionHistory(auctionId, (history) => {
      setState((previous) =>
        previous.status === "ready"
          ? {
              ...previous,
              data: {
                ...previous.data,
                history,
              },
            }
          : previous,
      );
    });
  }, [auctionId]);

  useEffect(() => {
    return subscribeToLiveTeams(auctionId, (teams) => {
      setState((previous) =>
        previous.status === "ready"
          ? {
              ...previous,
              data: {
                ...previous.data,
                teams,
              },
            }
          : previous,
      );
    });
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
          history: result.history,
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

  async function handleResetAuction() {
    if (!window.confirm("Reset this auction to Draft for development?")) {
      return;
    }

    setResetting(true);
    setNominationError(null);

    try {
      await resetAuctionToDraft(auctionId);
      const data = await getLiveAuctionData(auctionId);
      setState({
        status: "ready",
        data,
        auctionComplete: data.availablePlayers.length === 0,
      });
      window.dispatchEvent(new Event("auction-navigation-refresh"));
    } catch (error) {
      setNominationError(getErrorMessage(error));
    } finally {
      setResetting(false);
    }
  }

  async function handleBid() {
    if (!captainSession) {
      return;
    }

    setBidding(true);
    setBidError(null);

    try {
      await placeCaptainBid(auctionId, captainSession.teamId);
    } catch (error) {
      setBidError(getBidErrorMessage(error));
    } finally {
      setBidding(false);
    }
  }

  async function handleCompletePlayer(status: "Sold" | "Unsold") {
    setCompleting(status);
    setNominationError(null);

    try {
      await (status === "Sold"
        ? markCurrentPlayerSold(auctionId)
        : markCurrentPlayerUnsold(auctionId));
    } catch (error) {
      setNominationError(getErrorMessage(error));
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Button
        asChild
        href={role === "captain" ? "/captain" : `/auctions/${auctionId}`}
        variant="ghost"
        className="w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {role === "captain" ? "My Team" : "Auction Dashboard"}
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
          bidActivity={bidActivity}
          bidError={bidError}
          bidding={bidding}
          captainTeamId={captainSession?.teamId ?? null}
          auctionComplete={state.auctionComplete}
          availablePlayersCount={state.data.availablePlayers.length}
          currentPlayer={state.data.currentPlayer}
          completing={completing}
          history={state.data.history}
          nominationError={nominationError}
          nominating={nominating}
          onNominatePlayer={() => {
            void handleNominatePlayer();
          }}
          onResetAuction={() => {
            void handleResetAuction();
          }}
          onBid={() => {
            void handleBid();
          }}
          onCompletePlayer={(status) => {
            void handleCompletePlayer(status);
          }}
          resetting={resetting}
          role={role}
          teams={state.data.teams}
        />
      ) : null}
    </div>
  );
}

function LiveAuctionOverview({
  auction,
  bidActivity,
  bidError,
  bidding,
  captainTeamId,
  auctionComplete,
  availablePlayersCount,
  completing,
  currentPlayer,
  history,
  nominationError,
  nominating,
  onNominatePlayer,
  onBid,
  onCompletePlayer,
  onResetAuction,
  resetting,
  role,
  teams,
}: {
  auction: AuctionDocument | null;
  bidActivity: BidDocument[];
  bidError: string | null;
  bidding: boolean;
  captainTeamId: string | null;
  auctionComplete: boolean;
  availablePlayersCount: number;
  completing: "Sold" | "Unsold" | null;
  currentPlayer: PlayerDocument | null;
  history: HistoryDocument[];
  nominationError: string | null;
  nominating: boolean;
  onNominatePlayer: () => void;
  onBid: () => void;
  onCompletePlayer: (status: "Sold" | "Unsold") => void;
  onResetAuction: () => void;
  resetting: boolean;
  role: "admin" | "captain" | "guest";
  teams: TeamDocument[];
}) {
  const isAdmin = role === "admin";
  const isCaptain = role === "captain";

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
          {isAdmin ? (
            <div className="flex flex-wrap gap-2">
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
              <Button
                type="button"
                variant="secondary"
                disabled={resetting}
                onClick={onResetAuction}
              >
                {resetting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="size-4" aria-hidden="true" />
                )}
                Reset Auction
              </Button>
            </div>
          ) : null}
        </div>
        {nominationError ? (
          <p className="mt-3 text-sm text-red-200">{nominationError}</p>
        ) : null}
      </div>

      {auctionComplete ? (
        isCaptain && captainTeamId ? (
          <CaptainAuctionCompleteSummary
            team={teams.find((team) => team.id === captainTeamId) ?? null}
          />
        ) : (
          <AuctionCompleteSummary history={history} teams={teams} />
        )
      ) : null}

      {currentPlayer ? (
        <LiveBiddingLayout
          auction={auction}
          bidActivity={bidActivity}
          bidError={bidError}
          bidding={bidding}
          captainTeamId={captainTeamId}
          currentPlayer={currentPlayer}
          isAdmin={isAdmin}
          isCaptain={isCaptain}
          onBid={onBid}
          teams={teams}
        />
      ) : null}
      {isAdmin && currentPlayer && !auctionComplete ? (
        <AdminCompletionControls
          completing={completing}
          hasLeadingTeam={Boolean(auction.leadingTeamId)}
          onCompletePlayer={onCompletePlayer}
        />
      ) : null}
    </Card>
  );
}

function AdminCompletionControls({
  completing,
  hasLeadingTeam,
  onCompletePlayer,
}: {
  completing: "Sold" | "Unsold" | null;
  hasLeadingTeam: boolean;
  onCompletePlayer: (status: "Sold" | "Unsold") => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Button
        type="button"
        disabled={!hasLeadingTeam || Boolean(completing)}
        onClick={() => onCompletePlayer("Sold")}
      >
        {completing === "Sold" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Sold
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={Boolean(completing)}
        onClick={() => onCompletePlayer("Unsold")}
      >
        {completing === "Unsold" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Unsold
      </Button>
      <Button type="button" variant="secondary" disabled>
        End Auction
      </Button>
      {!hasLeadingTeam ? (
        <p className="basis-full text-sm text-slate-400">
          Sold is available after at least one bid.
        </p>
      ) : null}
    </div>
  );
}

function AuctionCompleteSummary({
  history,
  teams,
}: {
  history: HistoryDocument[];
  teams: TeamDocument[];
}) {
  const sold = history.filter((item) => item.status === "Sold");
  const unsold = history.filter((item) => item.status === "Unsold");
  const totalSpent = sold.reduce((sum, item) => sum + (item.finalPrice ?? 0), 0);
  const winningTeams = new Set(
    sold
      .map((item) => item.winningTeamName)
      .filter((teamName): teamName is string => Boolean(teamName)),
  );

  return (
    <Card className="mt-5 border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-lg font-bold text-white">Auction Complete</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoTile label="Players Sold" value={String(sold.length)} />
        <InfoTile label="Players Unsold" value={String(unsold.length)} />
        <InfoTile label="Total Money Spent" value={formatPoints(totalSpent)} />
        <InfoTile label="Winning Teams" value={String(winningTeams.size)} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-md border border-white/10 bg-slate-950/40 p-3"
          >
            <p className="font-semibold text-white">{team.name}</p>
            <p className="mt-1 text-sm text-slate-300">
              Final Budget: {formatPoints(team.budgetRemaining)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CaptainAuctionCompleteSummary({ team }: { team: TeamDocument | null }) {
  const players = team?.players ?? [];
  const purchasedPlayers = players.filter((player) => !player.isCaptain);
  const totalSpent = players.reduce(
    (sum, player) => sum + player.purchasePrice,
    0,
  );

  return (
    <Card className="mt-5 border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-lg font-bold text-white">Auction Completed</p>
      <p className="mt-2 text-sm text-emerald-100">
        Your final squad is locked and available below.
      </p>
      {team ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span
              className="size-8 rounded-md border border-white/15"
              style={{ backgroundColor: team.color }}
              aria-label={`${team.name} team color`}
            />
            <div>
              <p className="font-semibold text-white">{team.name}</p>
              <p className="text-sm text-slate-300">
                Captain: {team.captainName}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoTile label="Final Squad" value={String(players.length)} />
            <InfoTile
              label="Purchased Players"
              value={String(purchasedPlayers.length)}
            />
            <InfoTile label="Total Spent" value={formatPoints(totalSpent)} />
            <InfoTile
              label="Remaining Budget"
              value={formatPoints(team.budgetRemaining)}
            />
          </div>
          <div className="mt-4 grid gap-2">
            {players.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-slate-950/40 p-3 text-sm"
              >
                <span className="min-w-0 truncate text-slate-100">
                  {player.playerName}
                  {player.isCaptain ? " (Captain)" : ""}
                </span>
                <span className="shrink-0 font-semibold text-emerald-100">
                  {formatPoints(player.purchasePrice)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-300">
          Team details are unavailable for this captain session.
        </p>
      )}
    </Card>
  );
}

function LiveBiddingLayout({
  auction,
  bidActivity,
  bidError,
  bidding,
  captainTeamId,
  currentPlayer,
  isAdmin,
  isCaptain,
  onBid,
  teams,
}: {
  auction: AuctionDocument;
  bidActivity: BidDocument[];
  bidError: string | null;
  bidding: boolean;
  captainTeamId: string | null;
  currentPlayer: PlayerDocument;
  isAdmin: boolean;
  isCaptain: boolean;
  onBid: () => void;
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

      {isAdmin ? (
        <AdminBiddingActivity bidActivity={bidActivity} teams={teams} />
      ) : null}
      {isCaptain && captainTeamId ? (
        <CaptainBidPanel
          auction={auction}
          bidError={bidError}
          bidding={bidding}
          onBid={onBid}
          team={teams.find((team) => team.id === captainTeamId) ?? null}
        />
      ) : null}
    </div>
  );
}

function AdminBiddingActivity({
  bidActivity,
  teams,
}: {
  bidActivity: BidDocument[];
  teams: TeamDocument[];
}) {
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
        Bidding Activity
      </p>
      <div className="mt-4 grid gap-3">
        {bidActivity.length === 0 ? (
          <p className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
            No bids yet.
          </p>
        ) : (
          bidActivity.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {teamNames.get(bid.teamId) ?? bid.teamId}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Player: {bid.playerId}
                </p>
              </div>
              <p className="text-sm font-bold text-emerald-100">
                {formatPoints(bid.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function CaptainBidPanel({
  auction,
  bidError,
  bidding,
  onBid,
  team,
}: {
  auction: AuctionDocument;
  bidError: string | null;
  bidding: boolean;
  onBid: () => void;
  team: TeamDocument | null;
}) {
  const nextBid = (auction.currentBid ?? 0) + 5;
  const alreadyLeading = Boolean(team && auction.leadingTeamId === team.id);
  const insufficientBudget = Boolean(
    team && team.budgetRemaining < nextBid,
  );

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
        Captain Bid
      </p>
      <div className="mt-4 grid gap-3">
        <InfoTile
          label="Your Budget"
          value={team ? formatPoints(team.budgetRemaining) : "-"}
        />
        <InfoTile label="Next Bid" value={formatPoints(nextBid)} />
        {bidError ? <p className="text-sm text-red-200">{bidError}</p> : null}
        <Button
          type="button"
          disabled={bidding || alreadyLeading || insufficientBudget || !team}
          onClick={onBid}
        >
          {bidding ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Radio className="size-4" aria-hidden="true" />
          )}
          Bid
        </Button>
        {alreadyLeading ? (
          <p className="text-sm text-red-200">
            You are already the highest bidder.
          </p>
        ) : null}
        {insufficientBudget ? (
          <p className="text-sm text-red-200">Insufficient budget.</p>
        ) : null}
      </div>
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to nominate the next player right now.";
}

function getBidErrorMessage(error: unknown) {
  if (
    error instanceof InsufficientBudgetError ||
    error instanceof ConsecutiveBidError
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to place bid right now.";
}
