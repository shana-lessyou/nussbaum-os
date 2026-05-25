"use client";
import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { KpiStrip } from "./KpiStrip";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import type { BusinessKpi, Domain, Scope, Swimlane, Task } from "@/lib/types";

const LANES: { id: Swimlane; label: string }[] = [
  { id: "today",     label: "TODAY"     },
  { id: "this-week", label: "THIS WEEK" },
  { id: "backlog",   label: "BACKLOG"   },
];

function Lane({
  domain, swimlane, tasks, ...handlers
}: {
  domain: Domain;
  swimlane: Swimlane;
  tasks: Task[];
  onComplete: (id: string, completionNotes?: string) => void;
  onMoveLane: (id: string, lane: Swimlane) => void;
  onSplit: (t: Task) => void;
  onOpen: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${domain}::${swimlane}`,
    data: { domain, swimlane },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border border-line bg-black/[0.015] p-1.5 space-y-1.5 min-h-[80px]",
        isOver && "ring-2 ring-ink/30 bg-ink/[0.03]",
      )}
    >
      {tasks.length === 0 ? (
        <div className="text-[11px] text-muted px-1 py-2">—</div>
      ) : tasks.map((t) => (
        <TaskCard key={t.id} task={t} {...handlers} />
      ))}
    </div>
  );
}

export function DomainColumn({
  domain,
  tasks,
  scope,
  kpi,
  onAdd,
  onKpiChange,
  ...handlers
}: {
  domain: Domain;
  tasks: Task[];
  scope: Scope;
  kpi?: BusinessKpi;
  onAdd: (domain: Domain) => void;
  onKpiChange?: (patch: Partial<Pick<BusinessKpi, "customers" | "revenue">>) => void;
  onComplete: (id: string, completionNotes?: string) => void;
  onMoveLane: (id: string, lane: Swimlane) => void;
  onSplit: (t: Task) => void;
  onOpen: (t: Task) => void;
}) {
  const visibleLanes = scope === "day" ? LANES.slice(0, 1) : LANES;

  return (
    <div className="flex flex-col rounded-lg border border-line bg-surface shadow-card overflow-hidden h-full">
      <KpiStrip
        domain={domain}
        tasks={tasks}
        scope={scope}
        kpi={kpi}
        onKpiChange={onKpiChange}
        onAdd={() => onAdd(domain)}
      />
      <div className="flex-1 overflow-y-auto lane-scroll p-2 space-y-3">
        {visibleLanes.map((lane) => (
          <div key={lane.id}>
            <div className="text-[10px] font-semibold tracking-wider text-muted px-1 mb-1">{lane.label}</div>
            <Lane
              domain={domain}
              swimlane={lane.id}
              tasks={tasks.filter(t => t.swimlane === lane.id)}
              {...handlers}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
