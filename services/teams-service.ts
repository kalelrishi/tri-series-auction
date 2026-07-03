import { orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import {
  auctionTeamDoc,
  auctionTeamsCollection,
  typedQuery,
} from "@/lib/firebase/refs";
import { createTeamSchema, teamSchema } from "@/lib/firebase/schema";
import { getAuction } from "@/services/auctions-service";
import { listPlayers } from "@/services/players-service";
import {
  addDocument,
  getCollection,
  mergeDocument,
  removeDocument,
} from "@/services/firestore";
import type { CreateTeamInput } from "@/types";
import { validateInput } from "@/utils/validation";

type UpdateTeamInput = {
  name: string;
  color: string;
};

export class DuplicateTeamCaptainError extends Error {
  constructor() {
    super("This player is already captain of another team.");
    this.name = "DuplicateTeamCaptainError";
  }
}

export class TeamManagementLockedError extends Error {
  constructor() {
    super("Team management is locked because the auction has already started.");
    this.name = "TeamManagementLockedError";
  }
}

export async function listTeams(auctionId: string) {
  return getCollection(
    typedQuery(auctionTeamsCollection(auctionId), [orderBy("name", "asc")]),
  );
}

export async function listAvailableTeamCaptains(
  auctionId: string,
  currentTeamId?: string,
) {
  const [teams, players] = await Promise.all([
    listTeams(auctionId),
    listPlayers(),
  ]);
  const unavailableCaptainIds = new Set(
    teams
      .filter((team) => team.id !== currentTeamId)
      .map((team) => team.captainId),
  );

  return players.filter(
    (player) => player.active && !unavailableCaptainIds.has(player.id),
  );
}

export async function createTeam(auctionId: string, input: CreateTeamInput) {
  const inputValidation = createTeamSchema.safeParse(input);

  if (!inputValidation.success) {
    throw inputValidation.error;
  }

  const data = inputValidation.data;
  await assertTeamManagementOpen(auctionId);
  await assertCaptainAvailable(auctionId, data.captainId);
  const teamCandidate = {
    name: data.name,
    captainId: data.captainId,
    captainName: data.captainName,
    color: data.color,
    budgetTotal: data.budgetTotal,
    budgetRemaining: data.budgetTotal,
    players: [
      {
        playerId: data.captainId,
        playerName: data.captainName,
        role: data.captainRole,
        purchasePrice: 0,
        isCaptain: true,
        joinedAt: Timestamp.now(),
      },
    ],
    playersCount: 1,
  };
  const teamValidation = teamSchema.safeParse(teamCandidate);

  if (!teamValidation.success) {
    throw teamValidation.error;
  }

  const team = validateInput(teamSchema, teamCandidate);

  return addDocument(auctionTeamsCollection(auctionId), {
    ...team,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTeam(
  auctionId: string,
  teamId: string,
  input: UpdateTeamInput,
) {
  await assertTeamManagementOpen(auctionId);
  const data = teamSchema.pick({ name: true, color: true }).parse(input);

  return mergeDocument(auctionTeamDoc(auctionId, teamId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTeam(auctionId: string, teamId: string) {
  await assertTeamManagementOpen(auctionId);
  return removeDocument(auctionTeamDoc(auctionId, teamId));
}

async function assertTeamManagementOpen(auctionId: string) {
  const auction = await getAuction(auctionId);

  if (!auction) {
    throw new Error("Auction was not found.");
  }

  if (auction.status !== "Draft") {
    throw new TeamManagementLockedError();
  }
}

async function assertCaptainAvailable(
  auctionId: string,
  captainId: string,
  currentTeamId?: string,
) {
  const teams = await listTeams(auctionId);
  const duplicate = teams.some(
    (team) => team.id !== currentTeamId && team.captainId === captainId,
  );

  if (duplicate) {
    throw new DuplicateTeamCaptainError();
  }
}
