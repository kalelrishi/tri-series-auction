import type { AuctionEvent, AuctionState, Bid, Player, Team } from "@/types";

export const COLLECTIONS = {
  auctionEvents: "auctionEvents",
  auctionState: "auctionState",
  bids: "bids",
  players: "players",
  teams: "teams",
  users: "users",
} as const;

export type CollectionMap = {
  [COLLECTIONS.auctionEvents]: AuctionEvent;
  [COLLECTIONS.auctionState]: AuctionState;
  [COLLECTIONS.bids]: Bid;
  [COLLECTIONS.players]: Player;
  [COLLECTIONS.teams]: Team;
};
