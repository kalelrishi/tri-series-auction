import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";

type PlaceholderAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type PlaceholderStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type PlaceholderPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  actions?: PlaceholderAction[];
  stats: PlaceholderStat[];
};

export function PlaceholderPage({
  title,
  eyebrow,
  description,
  actions = [],
  stats,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="min-h-[320px] rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(14,165,233,0.09)_48%,rgba(15,23,42,0.82))] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <Badge>{eyebrow}</Badge>
          <h2 className="mt-8 max-w-3xl text-4xl font-black tracking-normal text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            {description}
          </p>
          {actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action, index) => (
                <Button
                  key={action.href}
                  asChild
                  href={action.href}
                  variant={index === 0 ? "primary" : "secondary"}
                >
                  <action.icon className="size-4" aria-hidden="true" />
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <Card className="flex flex-col justify-between p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Milestone Scope
            </p>
            <h3 className="mt-4 text-2xl font-bold text-white">
              Foundation only
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Authentication, Firestore, and layout scaffolding are ready for
              integration. Auction logic, bidding, and CRUD stay untouched for
              the next milestones.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-white/10 bg-white/6 p-3">
              <p className="text-slate-400">Auth</p>
              <p className="mt-1 font-semibold text-white">Scaffolded</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/6 p-3">
              <p className="text-slate-400">Firestore</p>
              <p className="mt-1 font-semibold text-white">Service layer</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              Admin-controlled auction state
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              Captain bidding workflow
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              Player and team management
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
