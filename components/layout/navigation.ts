import {
  Gavel,
  History,
  Home,
  Settings,
  Shield,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";

export const navigationItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Admin", href: "/admin", icon: Shield },
  { label: "Captain", href: "/captain", icon: Trophy },
  { label: "Players", href: "/players", icon: UserRound },
  { label: "Teams", href: "/teams", icon: UsersRound },
  { label: "Auction", href: "/auction", icon: Gavel },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;
