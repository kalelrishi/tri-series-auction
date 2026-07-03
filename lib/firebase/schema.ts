import { z } from "zod";
import type { FirestoreTimestamp } from "@/types";

export const userRoleSchema = z.enum(["admin", "captain"]);

export const playerRoleSchema = z.enum([
  "Batter",
  "Bowler",
  "All-Rounder",
  "Wicket Keeper",
]);

export const auctionStatusSchema = z.enum([
  "draft",
  "running",
  "paused",
  "completed",
]);

export const auctionDocumentStatusSchema = z.enum([
  "Draft",
  "Ready",
  "Live",
  "Completed",
]);

export const userSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: userRoleSchema,
  teamId: z.string().trim().min(1).nullable(),
});

export const playerSchema = z.object({
  name: z.string().trim().min(1),
  nickname: z.string().trim().optional(),
  role: playerRoleSchema,
  battingStyle: z.string().trim().optional(),
  bowlingStyle: z.string().trim().optional(),
  basePrice: z.number().int().nonnegative(),
  photoUrl: z.string().trim().url().or(z.literal("")),
  phone: z.string().trim().optional(),
  active: z.boolean(),
});

export const teamSchema = z.object({
  name: z.string().trim().min(1),
  captainId: z.string().trim().min(1),
  captainName: z.string().trim().min(1),
  color: z.string().trim().min(1),
  budgetTotal: z.number().int().nonnegative(),
  budgetRemaining: z.number().int().nonnegative(),
  players: z.array(
    z.object({
      playerId: z.string().trim().min(1),
      playerName: z.string().trim().min(1),
      role: playerRoleSchema,
      purchasePrice: z.number().int().nonnegative(),
      isCaptain: z.boolean(),
      joinedAt: z.custom<FirestoreTimestamp>(),
    }),
  ),
  playersCount: z.number().int().nonnegative(),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(1),
  captainId: z.string().trim().min(1),
  captainName: z.string().trim().min(1),
  captainRole: playerRoleSchema,
  color: z.string().trim().min(1),
  budgetTotal: z.number().int().nonnegative(),
});

export const auctionSchema = z.object({
  name: z.string().trim().min(1),
  date: z.custom<FirestoreTimestamp>(),
  status: auctionDocumentStatusSchema,
  startingBudget: z.number().int().positive(),
  maxPlayersPerTeam: z.number().int().positive(),
  currentPlayerId: z.string().trim().min(1).nullable(),
  currentBid: z.number().int().nonnegative().nullable(),
  leadingTeamId: z.string().trim().min(1).nullable(),
  leadingTeamName: z.string().trim().min(1).nullable(),
  currentTurnTeamId: z.string().trim().min(1).nullable(),
  startedAt: z.custom<FirestoreTimestamp>().nullable(),
  endedAt: z.custom<FirestoreTimestamp>().nullable(),
  createdAt: z.custom<FirestoreTimestamp>(),
});

export const createAuctionSchema = z.object({
  name: z.string().trim().min(1),
  date: z.custom<FirestoreTimestamp>(),
  startingBudget: z.number().int().positive(),
  maxPlayersPerTeam: z.number().int().positive(),
});

export const settingsSchema = z.object({
  defaultBudget: z.number().int().positive(),
  defaultPlayersPerTeam: z.number().int().positive(),
  defaultTeamCount: z.number().int().positive(),
  defaultBidIncrement: z.number().int().positive(),
});

export const auctionDetailsSchema = z.object({
  name: z.string().trim().min(1),
  date: z.custom<FirestoreTimestamp>(),
  status: auctionStatusSchema,
  budgetPerTeam: z.number().int().positive(),
  playersPerTeam: z.number().int().positive(),
  teamCount: z.number().int().positive(),
  createdBy: z.string().trim().min(1),
});

export const auctionStateSchema = z.object({
  currentPlayerId: z.string().trim().min(1).nullable(),
  currentPlayerIndex: z.number().int().nonnegative(),
  highestBid: z.number().int().nonnegative(),
  highestBidder: z.string().trim().min(1).nullable(),
  auctionRunning: z.boolean(),
  timer: z.number().int().nonnegative(),
  status: auctionStatusSchema,
});

export const auctionPlayerSchema = z.object({
  playerId: z.string().trim().min(1),
});

export const auctionTeamSchema = teamSchema;

export const bidSchema = z.object({
  playerId: z.string().trim().min(1),
  teamId: z.string().trim().min(1),
  amount: z.number().int().positive(),
});

export const historySchema = z.object({
  playerId: z.string().trim().min(1),
  playerName: z.string().trim().min(1),
  teamId: z.string().trim().min(1),
  teamName: z.string().trim().min(1),
  soldPrice: z.number().int().nonnegative(),
});
