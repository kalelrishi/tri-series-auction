import { BadgeIndianRupee, Radio, Shield, Trophy } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function CaptainDashboardPage() {
  return (
    <PlaceholderPage
      title="Captain Dashboard"
      eyebrow="Bid console"
      description="A future captain workspace for watching the current player, placing bids, and tracking team balance during the live auction."
      stats={[
        { label: "Team points", value: "400", icon: BadgeIndianRupee },
        { label: "Squad slots", value: "0/7", icon: Shield },
        { label: "Live feed", value: "Ready", icon: Radio },
        { label: "Role", value: "Captain", icon: Trophy },
      ]}
    />
  );
}
