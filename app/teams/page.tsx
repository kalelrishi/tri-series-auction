import { BadgeIndianRupee, Shield, Trophy, Users } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function TeamsPage() {
  return (
    <PlaceholderPage
      title="Teams"
      eyebrow="Squad rooms"
      description="A placeholder for the three auction teams, captain assignments, point balances, and squad composition."
      stats={[
        { label: "Teams", value: "3", icon: Shield },
        { label: "Captains", value: "3", icon: Trophy },
        { label: "Budget each", value: "400", icon: BadgeIndianRupee },
        { label: "Squad size", value: "7", icon: Users },
      ]}
    />
  );
}
