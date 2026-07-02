import { orderBy, serverTimestamp } from "firebase/firestore";
import { auctionTeamsCollection, typedQuery } from "@/lib/firebase/refs";
import { createTeamSchema, teamSchema } from "@/lib/firebase/schema";
import { listPlayers } from "@/services/players-service";
import { addDocument, getCollection } from "@/services/firestore";
import type { CreateTeamInput } from "@/types";
import { validateInput } from "@/utils/validation";
import { Timestamp } from "firebase/firestore";
export class DuplicateTeamCaptainError extends Error {
  constructor() {
    super("This player is already captain of another team.");
    this.name = "DuplicateTeamCaptainError";
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
  console.info("[createTeam] auctionId:", auctionId);
  console.info("[createTeam] Firestore path:", `auctions/${auctionId}/teams`);
  console.info("[createTeam] input:", input);

  const inputValidation = createTeamSchema.safeParse(input);
  console.info("[createTeam] input validation:", inputValidation.success);

  if (!inputValidation.success) {
    console.error("[createTeam] input validation error:", inputValidation.error);
    throw inputValidation.error;
  }

  const data = inputValidation.data;
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
  console.info("[createTeam] team validation:", teamValidation.success);

  if (!teamValidation.success) {
    console.error("[createTeam] team validation error:", teamValidation.error);
    throw teamValidation.error;
  }

  const team = validateInput(teamSchema, teamCandidate);

  try {
    return await addDocument(auctionTeamsCollection(auctionId), {
      ...team,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[createTeam] Firestore write failed:", error);
    throw error;
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
