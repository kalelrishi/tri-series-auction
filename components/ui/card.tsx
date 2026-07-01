import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/20 backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("space-y-2 p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={cn("text-lg font-semibold tracking-normal text-white", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
