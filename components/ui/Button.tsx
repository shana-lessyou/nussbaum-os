"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "subtle" | "outline";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90",
  ghost:   "text-ink hover:bg-black/5",
  subtle:  "bg-black/[0.04] text-ink hover:bg-black/[0.08]",
  outline: "border border-line bg-white text-ink hover:bg-black/[0.03]",
};
const sizes: Record<Size, string> = {
  sm:   "h-7 px-2 text-xs rounded-md",
  md:   "h-9 px-3 text-sm rounded-md",
  icon: "h-7 w-7 grid place-items-center rounded-md",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ className, variant = "subtle", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
