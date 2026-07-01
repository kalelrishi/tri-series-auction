import { z } from "zod";

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

export const userSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: userRoleSchema,
  teamId: z.string().trim().min(1).nullable(),
});

export const playerSchema = z.object({
  name: z.string().trim().min(1),
  role: playerRoleSchema,
  basePrice: z.number().int().nonnegative(),
  photoUrl: z.string().trim().url().or(z.literal("")),
  active: z.boolean(),
});

export const settingsSchema = z.object({
  defaultBudget: z.number().int().positive(),
  defaultPlayersPerTeam: z.number().int().positive(),
  defaultTeamCount: z.number().int().positive(),
  defaultBidIncrement: z.number().int().positive(),
});

export const auctionDetailsSchema = z.object({
  name: z.string().trim().min(1),
  date: z.unknown(),
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

export const auctionTeamSchema = z.object({
  name: z.string().trim().min(1),
  captainId: z.string().trim().min(1),
  budgetTotal: z.number().int().nonnegative(),
  budgetRemaining: z.number().int().nonnegative(),
  playerIds: z.array(z.string().trim().min(1)),
});

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
