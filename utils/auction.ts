export const AUCTION_LIMITS = {
  captainCount: 3,
  teamCount: 3,
  playersPerTeam: 7,
  startingPoints: 400,
} as const;

export function formatPoints(points: number) {
  return new Intl.NumberFormat("en-IN").format(points);
}

export function getRemainingSlots(currentPlayerCount: number) {
  return Math.max(AUCTION_LIMITS.playersPerTeam - currentPlayerCount, 0);
}
