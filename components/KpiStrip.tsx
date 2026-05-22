"use client";
import * as React from "react";
import { Users, DollarSign, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_META, DOMAIN_COLORS, isBusiness } from "@/lib/domains";
import type { BusinessKpi, Category, Domain, Scope, Task } from "@/lib/types";

const CATEGORIES: Category[] = ["build", "sell", "admin"];

export function KpiStrip({
  domain,
  tasks,
  scope,
  kpi,
  onKpiChange,
  onAdd,
}: {
  domain: Domain;
  tasks: Task[];
  scope: Scope;
  kpi?: BusinessKpi;
  onKpiChange?: (patch: Partial<Pick<BusinessKpi, "customers" | "revenue">>) => void;
  onAdd: () => void;
}) {
  const todayPts = tasks.filter(t => t.swimlane === "today").reduce((s, t) => s + t.points, 0);
  const totalPts = tasks.reduce((s, t) => s + t.points, 0);
  const c = DOMAIN_COLORS[domain];
  const business = isBusiness(domain);

  return (
    <div className="border-b border-line bg-white">
      {business && (
        <div className="px-3 pt-2 pb-1.5 flex items-center gap-3 border-b border-line/60">
          <div className="flex items-center gap-1 text-[11px] text-muted">
            <Users className="h-3 w-3" />
            <input
              type="number" min={0}
              className="w-12 bg-transparent border-b border-transparent hover:border-line focus:border-ink/40 focus:outline-none text-ink font-semibold tabular-nums text-right"
              value={kpi?.customers ?? 0}
              onChange={(e) => onKpiChange?.({ customers: Number(e.target.value || 0) })}
            />
            <span>cust</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted">
            <DollarSign className="h-3 w-3" />
            <input
              type="number" min={0} step="0.01"
              className="w-16 bg-transparent border-b border-transparent hover:border-line focus:border-ink/40 focus:outline-none text-ink font-semibold tabular-nums text-right"
              value={kpi?.revenue ?? 0}
              onChange={(e) => onKpiChange?.({ revenue: Number(e.target.value || 0) })}
            />
            <span>rev</span>
          </div>
        </div>
      )}

      <div className="px-3 py-2 flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", c.dot)} />
        <div className="text-sm font-semibold">{domain}</div>
        <button
          onClick={onAdd}
          className="ml-auto h-6 w-6 grid place-items-center rounded-md border border-line text-muted hover:text-ink hover:border-ink/40 transition"
          title="Add task"
        ><Plus className="h-3.5 w-3.5" /></button>
      </div>

      <div className="px-3 pb-2 flex items-baseline gap-3 text-[11px] text-muted tabular-nums">
        <span><span className="text-ink font-semibold">{todayPts}</span> today</span>
        <span><span className="text-ink font-semibold">{totalPts}</span> total</span>
      </div>

      {business && scope !== "day" && (
        <div className="px-3 pb-2 flex items-center gap-1.5 text-[10px]">
          {CATEGORIES.map(cat => {
            const pts = tasks.filter(t => t.category === cat).reduce((s, t) => s + t.points, 0);
            const m = CATEGORY_META[cat];
            return (
              <span key={cat} className={cn("px-1.5 py-0.5 rounded-full font-medium tabular-nums", m.pill)}>
                {m.label} {pts}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
