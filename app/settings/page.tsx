import { Bell, KeyRound, Settings, ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      eyebrow="Tournament setup"
      description="A placeholder for Firebase-backed configuration, auth role mapping, auction rules, and notification preferences."
      stats={[
        { label: "Auth roles", value: "Planned", icon: KeyRound },
        { label: "Rules", value: "Draft", icon: Settings },
        { label: "Notifications", value: "Off", icon: Bell },
        { label: "Security", value: "Ready", icon: ShieldCheck },
      ]}
    />
  );
}
