export type UserRole = "admin" | "captain";

export type PlayerRole =
  | "batter"
  | "bowler"
  | "all-rounder"
  | "wicket-keeper";

export type AuctionStatus = "setup" | "live" | "paused" | "completed";

export type PlayerAuctionStatus = "available" | "sold" | "unsold";

export type BaseModel = {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AppUser = BaseModel & {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  teamId?: string;
};

export type Team = BaseModel & {
  name: string;
  captainId: string;
  pointsTotal: number;
  pointsRemaining: number;
  playerIds: string[];
};

export type Player = BaseModel & {
  name: string;
  role: PlayerRole;
  basePoints: number;
  status: PlayerAuctionStatus;
  soldToTeamId?: string;
  soldForPoints?: number;
};

export type Bid = BaseModel & {
  playerId: string;
  teamId: string;
  captainId: string;
  points: number;
};

export type AuctionState = BaseModel & {
  status: AuctionStatus;
  currentPlayerId?: string;
  highestBidId?: string;
  activeTeamId?: string;
};

export type AuctionEventType =
  | "auction_started"
  | "auction_paused"
  | "player_opened"
  | "bid_placed"
  | "player_sold"
  | "player_unsold"
  | "auction_completed";

export type AuctionEvent = BaseModel & {
  type: AuctionEventType;
  message: string;
  playerId?: string;
  teamId?: string;
  points?: number;
};
