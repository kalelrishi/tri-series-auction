export const ROOT_COLLECTIONS = {
  users: "users",
  players: "players",
  teams: "teams",
  settings: "settings",
  auctions: "auctions",
} as const;

export const AUCTION_COLLECTIONS = {
  details: "details",
  auctionState: "auctionState",
  auctionPlayers: "auctionPlayers",
  teams: "teams",
  bids: "bids",
  history: "history",
} as const;

export const SINGLE_DOCUMENT_IDS = {
  settings: "app",
  auctionDetails: "main",
  auctionState: "current",
} as const;

export function auctionPath(auctionId: string) {
  return `${ROOT_COLLECTIONS.auctions}/${auctionId}`;
}

export function auctionSubcollectionPath(
  auctionId: string,
  collection: (typeof AUCTION_COLLECTIONS)[keyof typeof AUCTION_COLLECTIONS],
) {
  return `${auctionPath(auctionId)}/${collection}`;
}
