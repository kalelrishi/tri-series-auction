import { Clock3, FileClock, Gavel, Trophy } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function HistoryPage() {
  return (
    <PlaceholderPage
      title="History"
      eyebrow="Auction ledger"
      description="A placeholder for completed bids, sold players, unsold outcomes, and audit-friendly auction events."
      stats={[
        { label: "Events", value: "0", icon: FileClock },
        { label: "Sold lots", value: "0", icon: Trophy },
        { label: "Bid rounds", value: "0", icon: Gavel },
        { label: "Last update", value: "None", icon: Clock3 },
      ]}
    />
  );
}
