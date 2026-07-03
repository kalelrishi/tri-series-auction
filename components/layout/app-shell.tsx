"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  History,
  LogOut,
  Menu,
  Radio,
  Settings,
  Shield,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getActiveLiveAuction } from "@/services/auctions-service";
import { cn } from "@/utils/cn";

type AppShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    captainSession,
    loading,
    logoutAdmin,
    logoutCaptain,
    role,
  } = useAuth();
  const [liveAuctionHref, setLiveAuctionHref] = useState<string | null>(null);
  const allNavigationItems = useMemo<NavigationItem[]>(
    () => getNavigationItems(role, liveAuctionHref, captainSession?.auctionId),
    [captainSession?.auctionId, liveAuctionHref, role],
  );
  const currentPage =
    allNavigationItems.find((item) => item.href === pathname)?.label ??
    "Auction";

  useEffect(() => {
    let active = true;

    async function loadLiveAuctionNavItem() {
      try {
        const liveAuction = await getActiveLiveAuction();

        if (active) {
          setLiveAuctionHref(
            liveAuction ? `/auctions/${liveAuction.id}/live` : null,
          );
        }
      } catch {
        if (active) {
          setLiveAuctionHref(null);
        }
      }
    }

    function refreshLiveAuctionNavItem() {
      void loadLiveAuctionNavItem();
    }

    refreshLiveAuctionNavItem();
    window.addEventListener(
      "auction-navigation-refresh",
      refreshLiveAuctionNavItem,
    );

    return () => {
      active = false;
      window.removeEventListener(
        "auction-navigation-refresh",
        refreshLiveAuctionNavItem,
      );
    };
  }, [pathname]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const destination = getRedirectDestination(
      pathname,
      role,
      captainSession?.auctionId,
    );

    if (destination && destination !== pathname) {
      router.replace(destination);
    }
  }, [captainSession?.auctionId, loading, pathname, role, router]);

  async function handleLogout() {
    if (role === "admin") {
      await logoutAdmin();
      router.replace("/login");
      return;
    }

    if (role === "captain") {
      logoutCaptain();
      router.replace("/captain/login");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/80 px-4 py-5 backdrop-blur lg:block">
          <SidebarContent
            items={allNavigationItems}
            onLogout={() => {
              void handleLogout();
            }}
            pathname={pathname}
            role={role}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/82 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="size-10 px-0 lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                    Tri Series
                  </p>
                  <h1 className="truncate text-xl font-bold text-white">
                    {currentPage}
                  </h1>
                </div>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Badge>
                  <Radio className="size-3.5" aria-hidden="true" />
                  Realtime ready
                </Badge>
                <Badge className="border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Firebase
                </Badge>
              </div>
            </div>
          </header>

          <nav className="border-b border-white/10 bg-slate-950/72 px-3 py-2 backdrop-blur lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allNavigationItems.map((item) => {
                const active = item.href === pathname;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-300 transition",
                      active && "bg-emerald-300/15 text-emerald-100",
                    )}
                  >
                    <item.icon className="size-4" aria-hidden={true} />
                    {item.label}
                  </Link>
                );
              })}
              {role !== "guest" ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white"
                >
                  <LogOut className="size-4" aria-hidden={true} />
                  Logout
                </button>
              ) : null}
            </div>
          </nav>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  items,
  onLogout,
  pathname,
  role,
}: {
  items: NavigationItem[];
  onLogout: () => void;
  pathname: string;
  role: "admin" | "captain" | "guest";
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="group flex items-center gap-3 px-2 py-2">
        <div className="grid size-11 place-items-center rounded-lg bg-emerald-400 text-slate-950 shadow-[0_0_36px_rgba(52,211,153,0.28)]">
          <GavelIcon />
        </div>
        <div>
          <p className="text-base font-black leading-tight text-white">
            Tri Series
          </p>
          <p className="text-sm text-slate-400">Cricket Auction</p>
        </div>
      </Link>

      <div className="mt-7 space-y-1">
        {items.map((item) => {
          const active = item.href === pathname;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white",
                active && "bg-white/10 text-white",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md border border-emerald-300/20 bg-emerald-300/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <item.icon
                className={cn("relative size-5", active && "text-emerald-200")}
                aria-hidden={true}
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
        {role !== "guest" ? (
          <button
            type="button"
            onClick={onLogout}
            className="relative flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="relative size-5" aria-hidden={true} />
            <span className="relative">Logout</span>
          </button>
        ) : null}
      </div>

      <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.055] p-4">
        <p className="text-sm font-semibold text-white">Auction Format</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          3 captains, 3 teams, 7 players per squad, 400 points each.
        </p>
      </div>
    </div>
  );
}

function getNavigationItems(
  role: "admin" | "captain" | "guest",
  liveAuctionHref: string | null,
  captainAuctionId?: string,
): NavigationItem[] {
  if (role === "admin") {
    const items: NavigationItem[] = [
      { label: "Dashboard", href: "/admin", icon: Shield },
      { label: "Players", href: "/players", icon: UserRound },
      { label: "Auctions", href: "/auctions", icon: CalendarDays },
      { label: "Teams", href: "/teams", icon: UsersRound },
    ];

    if (liveAuctionHref) {
      items.push({ label: "Live Auction", href: liveAuctionHref, icon: Radio });
    }

    return [
      ...items,
      { label: "History", href: "/history", icon: History },
      { label: "Settings", href: "/settings", icon: Settings },
    ];
  }

  if (role === "captain") {
    const items: NavigationItem[] = [
      { label: "My Team", href: "/captain", icon: Trophy },
    ];

    if (captainAuctionId) {
      items.push({
        label: "Live Auction",
        href: `/auctions/${captainAuctionId}/live`,
        icon: Radio,
      });
    }

    return items;
  }

  return [
    { label: "Admin Login", href: "/login", icon: Shield },
    { label: "Captain Login", href: "/captain/login", icon: Trophy },
  ];
}

function getRedirectDestination(
  pathname: string,
  role: "admin" | "captain" | "guest",
  captainAuctionId?: string,
) {
  const isAdminLogin = pathname === "/login";
  const isCaptainLogin = pathname === "/captain/login";
  const isCaptainDashboard = pathname === "/captain";
  const isCaptainRoute = pathname.startsWith("/captain");
  const isLiveAuctionRoute = /^\/auctions\/[^/]+\/live$/.test(pathname);
  const isGuestOnly = isAdminLogin || isCaptainLogin;

  if (role === "guest") {
    if (isGuestOnly) {
      return null;
    }

    return isCaptainRoute ? "/captain/login" : "/login";
  }

  if (role === "admin") {
    if (isGuestOnly || pathname === "/" || isCaptainRoute) {
      return "/admin";
    }

    return null;
  }

  if (role === "captain") {
    if (isGuestOnly || pathname === "/") {
      return "/captain";
    }

    if (isCaptainDashboard) {
      return null;
    }

    if (
      isLiveAuctionRoute &&
      captainAuctionId &&
      pathname === `/auctions/${captainAuctionId}/live`
    ) {
      return null;
    }

    return "/captain";
  }

  return null;
}

function GavelIcon() {
  return (
    <span className="text-xl font-black leading-none" aria-hidden="true">
      TS
    </span>
  );
}
