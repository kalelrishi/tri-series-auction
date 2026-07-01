import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
