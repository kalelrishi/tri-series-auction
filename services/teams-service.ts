import { orderBy, serverTimestamp } from "firebase/firestore";
import { teamsCollection, typedQuery } from "@/lib/firebase/refs";
import { createTeamSchema, teamSchema } from "@/lib/firebase/schema";
import { addDocument, getCollection } from "@/services/firestore";
import type { CreateTeamInput } from "@/types";
import { validateInput } from "@/utils/validation";

export async function listTeams() {
  return getCollection(typedQuery(teamsCollection(), [orderBy("name", "asc")]));
}

export async function createTeam(input: CreateTeamInput) {
  const data = validateInput(createTeamSchema, input);
  const team = validateInput(teamSchema, {
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
        joinedAt: serverTimestamp(),
      },
    ],
    playersCount: 1,
  });

  return addDocument(teamsCollection(), {
    ...team,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
