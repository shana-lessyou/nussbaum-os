"use client";
import { cn } from "@/lib/utils";
import type { Scope } from "@/lib/types";

const OPTIONS: { value: Scope; label: string; hint?: string }[] = [
  { value: "day",   label: "Day",   hint: "today" },
  { value: "week",  label: "Week",  hint: "+ this week" },
  { value: "month", label: "Month", hint: "+ backlog" },
];

export function ScopeToggle({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <div className="flex flex-col items-center">
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
      <div className="grid grid-cols-3 gap-0 mt-0.5 text-[9px] tracking-wide text-muted/70 w-full text-center">
        {OPTIONS.map((o) => (
          <div key={o.value} className={cn(value === o.value && "text-ink/70")}>{o.hint}</div>
        ))}
      </div>
    </div>
  );
}
