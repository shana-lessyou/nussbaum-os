"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  label,
  size = "md",
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
  label?: React.ReactNode;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer select-none", className)}>
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onCheckedChange(!checked)}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onCheckedChange(!checked); } }}
        className={cn(
          "grid place-items-center rounded border transition shrink-0",
          box,
          checked ? "bg-ink border-ink text-white" : "bg-white border-line hover:border-ink/40",
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
