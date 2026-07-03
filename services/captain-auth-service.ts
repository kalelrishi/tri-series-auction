import { listAuctions } from "@/services/auctions-service";
import { listTeams } from "@/services/teams-service";
import type { AuctionDocument, TeamDocument } from "@/types";

export type CaptainSession = {
  role: "captain";
  auctionId: string;
  auctionName: string;
  teamId: string;
  teamName: string;
  captainName: string;
  accessCode: string;
};

export async function findCaptainSessionByAccessCode(
  accessCode: string,
): Promise<CaptainSession | null> {
  const normalizedCode = normalizeAccessCode(accessCode);

  if (!normalizedCode) {
    return null;
  }

  const auctions = await listAuctions();

  for (const auction of auctions) {
    const teams = await listTeams(auction.id);
    const team = teams.find(
      (item) => normalizeAccessCode(item.captainAccessCode) === normalizedCode,
    );

    if (team) {
      return toCaptainSession(auction, team);
    }
  }

  return null;
}

export async function isCaptainAccessCodeAvailable(accessCode: string) {
  return !(await findCaptainSessionByAccessCode(accessCode));
}

function toCaptainSession(
  auction: AuctionDocument,
  team: TeamDocument,
): CaptainSession {
  return {
    role: "captain",
    auctionId: auction.id,
    auctionName: auction.name,
    teamId: team.id,
    teamName: team.name,
    captainName: team.captainName,
    accessCode: team.captainAccessCode,
  };
}

function normalizeAccessCode(accessCode: string | undefined) {
  return accessCode?.trim().toUpperCase() ?? "";
}
