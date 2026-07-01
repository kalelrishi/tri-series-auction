import { Activity, BadgeIndianRupee, Gavel, Radio } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function AuctionPage() {
  return (
    <PlaceholderPage
      title="Auction"
      eyebrow="Live stage"
      description="A placeholder for the real-time auction stage where the admin will present players and captains will bid from their devices."
      stats={[
        { label: "Current lot", value: "None", icon: Gavel },
        { label: "Highest bid", value: "0", icon: BadgeIndianRupee },
        { label: "Connection", value: "Idle", icon: Radio },
        { label: "Phase", value: "Setup", icon: Activity },
      ]}
    />
  );
}
