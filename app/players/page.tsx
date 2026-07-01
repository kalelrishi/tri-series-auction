import { Search, Star, UserRound, Users } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function PlayersPage() {
  return (
    <PlaceholderPage
      title="Players"
      eyebrow="Player pool"
      description="A placeholder for the tournament player registry, auction base values, roles, and availability status."
      stats={[
        { label: "Registered players", value: "21", icon: Users },
        { label: "Featured lot", value: "TBD", icon: Star },
        { label: "Filters", value: "Planned", icon: Search },
        { label: "Profiles", value: "Planned", icon: UserRound },
      ]}
    />
  );
}
