import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: false;
  variant?: "primary" | "secondary" | "ghost";
};

type LinkButtonProps = ComponentPropsWithoutRef<typeof Link> & {
  asChild: true;
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary:
    "bg-emerald-400 text-slate-950 shadow-[0_0_28px_rgba(52,211,153,0.22)] hover:bg-emerald-300",
  secondary:
    "border border-white/10 bg-white/8 text-slate-100 hover:border-emerald-300/50 hover:bg-emerald-300/10",
  ghost: "text-slate-300 hover:bg-white/8 hover:text-white",
};

export function Button(props: ButtonProps | LinkButtonProps) {
  if (props.asChild) {
    const { className, variant = "primary", asChild: _asChild, ...rest } = props;
    void _asChild;
    return <Link className={getButtonClasses(variant, className)} {...rest} />;
  }

  const {
    className,
    variant = "primary",
    asChild: _asChild,
    type = "button",
    ...rest
  } = props;
  void _asChild;

  return (
    <button
      className={getButtonClasses(variant, className)}
      type={type}
      {...rest}
    />
  );
}

function getButtonClasses(
  variant: NonNullable<ButtonProps["variant"]>,
  className?: string,
) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className,
  );
}
