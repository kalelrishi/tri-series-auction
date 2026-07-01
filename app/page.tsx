import { Activity, Shield, Trophy, Users } from "lucide-react";
import { FirebaseHealthcheck } from "@/components/firebase-healthcheck";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function HomePage() {
  return (
    <PlaceholderPage
      title="Tri Series Cricket Auction"
      eyebrow="Milestone 1"
      description="Production foundation for a real-time cricket auction platform with admin control, captain bidding, and team management ready for future milestones."
      actions={[
        { label: "Open Admin", href: "/admin", icon: Shield },
        { label: "Captain View", href: "/captain", icon: Trophy },
      ]}
      stats={[
        { label: "Captain accounts", value: "3", icon: Users },
        { label: "Teams", value: "3", icon: Shield },
        { label: "Players per team", value: "7", icon: Trophy },
        { label: "Points per team", value: "400", icon: Activity },
      ]}
    >
      <FirebaseHealthcheck />
    </PlaceholderPage>
  );
}
