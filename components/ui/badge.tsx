import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

export function Badge({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200",
        className,
      )}
      {...props}
    />
  );
}
