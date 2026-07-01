import { Crown, Gauge, Shield, Users } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function AdminDashboardPage() {
  return (
    <PlaceholderPage
      title="Admin Dashboard"
      eyebrow="Auction control room"
      description="A future command center for starting lots, managing player flow, confirming sales, and monitoring captain activity in real time."
      stats={[
        { label: "Auction admin", value: "1", icon: Crown },
        { label: "Captains online", value: "0/3", icon: Users },
        { label: "Auction status", value: "Setup", icon: Gauge },
        { label: "Rules", value: "Locked", icon: Shield },
      ]}
    />
  );
}
