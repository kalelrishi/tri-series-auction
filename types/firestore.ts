import type { FieldValue, Timestamp } from "firebase/firestore";

export type FirestoreTimestamp = Timestamp | FieldValue;

export type UserRole = "admin" | "captain";

export type PlayerRole = "Batter" | "Bowler" | "All-Rounder" | "Wicket Keeper";

export type AuctionStatus = "draft" | "running" | "paused" | "completed";

export type BaseDocument = {
  id: string;
};

export type AuditedTimestamps = {
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type UserDocument = BaseDocument &
  AuditedTimestamps & {
    name: string;
    email: string;
    role: UserRole;
    teamId: string | null;
  };

export type PlayerDocument = BaseDocument &
  AuditedTimestamps & {
    name: string;
    nickname?: string;
    role: PlayerRole;
    battingStyle?: string;
    bowlingStyle?: string;
    basePrice: number;
    photoUrl: string;
    phone?: string;
    active: boolean;
  };

export type SettingsDocument = BaseDocument & {
  defaultBudget: number;
  defaultPlayersPerTeam: number;
  defaultTeamCount: number;
  defaultBidIncrement: number;
};

export type AuctionDetailsDocument = BaseDocument & {
  name: string;
  date: FirestoreTimestamp;
  status: AuctionStatus;
  budgetPerTeam: number;
  playersPerTeam: number;
  teamCount: number;
  createdBy: string;
  createdAt: FirestoreTimestamp;
};

export type AuctionStateDocument = BaseDocument & {
  currentPlayerId: string | null;
  currentPlayerIndex: number;
  highestBid: number;
  highestBidder: string | null;
  auctionRunning: boolean;
  timer: number;
  status: AuctionStatus;
};

export type AuctionPlayerDocument = BaseDocument & {
  playerId: string;
};

export type AuctionTeamDocument = BaseDocument & {
  name: string;
  captainId: string;
  budgetTotal: number;
  budgetRemaining: number;
  playerIds: string[];
};

export type BidDocument = BaseDocument & {
  playerId: string;
  teamId: string;
  amount: number;
  timestamp: FirestoreTimestamp;
};

export type HistoryDocument = BaseDocument & {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  soldPrice: number;
  timestamp: FirestoreTimestamp;
};

export type CreateUserInput = Omit<UserDocument, "id" | "createdAt" | "updatedAt">;
export type UpdateUserInput = Partial<CreateUserInput>;

export type CreatePlayerInput = Omit<
  PlayerDocument,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdatePlayerInput = Partial<CreatePlayerInput>;

export type UpsertSettingsInput = Omit<SettingsDocument, "id">;

export type CreateAuctionDetailsInput = Omit<
  AuctionDetailsDocument,
  "id" | "createdAt"
>;
export type UpdateAuctionDetailsInput = Partial<
  Omit<AuctionDetailsDocument, "id" | "createdAt">
>;

export type UpsertAuctionStateInput = Omit<AuctionStateDocument, "id">;
export type UpdateAuctionStateInput = Partial<UpsertAuctionStateInput>;

export type CreateAuctionPlayerInput = Omit<AuctionPlayerDocument, "id">;
export type CreateAuctionTeamInput = Omit<AuctionTeamDocument, "id">;
export type UpdateAuctionTeamInput = Partial<CreateAuctionTeamInput>;
export type CreateBidInput = Omit<BidDocument, "id" | "timestamp">;
export type CreateHistoryInput = Omit<HistoryDocument, "id" | "timestamp">;

export type CollectionDocumentMap = {
  users: UserDocument;
  players: PlayerDocument;
  settings: SettingsDocument;
  auctionDetails: AuctionDetailsDocument;
  auctionState: AuctionStateDocument;
  auctionPlayers: AuctionPlayerDocument;
  auctionTeams: AuctionTeamDocument;
  bids: BidDocument;
  history: HistoryDocument;
};
