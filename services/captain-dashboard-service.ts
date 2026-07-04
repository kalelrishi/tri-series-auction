import {
  getLiveAuctionData,
  subscribeToLiveAuction,
  subscribeToLiveTeams,
} from "@/services/live-auction-service";
import { listPlayers } from "@/services/players-service";
import { listTeams } from "@/services/teams-service";
import type { AuctionDocument, PlayerDocument, TeamDocument } from "@/types";

export type CaptainDashboardData = {
  auction: AuctionDocument | null;
  currentPlayer: PlayerDocument | null;
  team: TeamDocument | null;
};

export async function getCaptainDashboardData(
  auctionId: string,
  teamId: string,
): Promise<CaptainDashboardData> {
  const [liveData, teams] = await Promise.all([
    getLiveAuctionData(auctionId),
    listTeams(auctionId),
  ]);

  return {
    auction: liveData.auction,
    currentPlayer: liveData.currentPlayer,
    team: teams.find((team) => team.id === teamId) ?? null,
  };
}

export function subscribeToCaptainDashboardData(
  auctionId: string,
  teamId: string,
  onNext: (data: CaptainDashboardData) => void,
  onError?: (error: Error) => void,
) {
  let auction: AuctionDocument | null | undefined;
  let currentPlayer: PlayerDocument | null = null;
  let players: PlayerDocument[] = [];
  let teams: TeamDocument[] | undefined;
  let disposed = false;

  function emitIfReady() {
    if (disposed || auction === undefined || teams === undefined) {
      return;
    }

    onNext({
      auction,
      currentPlayer,
      team: teams.find((team) => team.id === teamId) ?? null,
    });
  }

  const unsubscribeAuction = subscribeToLiveAuction(
    auctionId,
    (nextAuction) => {
      auction = nextAuction;
      currentPlayer =
        players.find((player) => player.id === nextAuction?.currentPlayerId) ??
        null;
      emitIfReady();
    },
    onError,
  );

  const unsubscribeTeams = subscribeToLiveTeams(
    auctionId,
    (nextTeams) => {
      teams = nextTeams;
      emitIfReady();
    },
    onError,
  );

  void listPlayers()
    .then((nextPlayers) => {
      if (disposed) {
        return;
      }

      players = nextPlayers;
      currentPlayer =
        players.find((player) => player.id === auction?.currentPlayerId) ??
        null;
      emitIfReady();
    })
    .catch((error: unknown) => {
      if (onError && error instanceof Error) {
        onError(error);
      }
    });

  return () => {
    disposed = true;
    unsubscribeAuction();
    unsubscribeTeams();
  };
}
