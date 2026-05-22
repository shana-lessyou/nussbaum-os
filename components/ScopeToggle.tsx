"use client";
import { cn } from "@/lib/utils";
import type { Scope } from "@/lib/types";

const OPTIONS: { value: Scope; label: string }[] = [
  { value: "day",   label: "Day" },
  { value: "week",  label: "Week" },
  { value: "month", label: "Month" },
];

export function ScopeToggle({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-white p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 px-3 text-xs rounded-[5px] font-medium transition",
            value === o.value ? "bg-ink text-white" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
