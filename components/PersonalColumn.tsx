"use client";
import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { SUBDOMAIN_META, SUBDOMAIN_ORDER } from "@/lib/domains";
import type { Scope, Subdomain, Swimlane, Task } from "@/lib/types";

const LANES: { id: Swimlane; label: string }[] = [
  { id: "today",     label: "TODAY"     },
  { id: "this-week", label: "THIS WEEK" },
  { id: "backlog",   label: "BACKLOG"   },
];

function Lane({
  swimlane, tasks, ...handlers
}: {
  swimlane: Swimlane;
  tasks: Task[];
  onComplete: (id: string, completionNotes?: string) => void;
  onMoveLane: (id: string, lane: Swimlane) => void;
  onSplit: (t: Task) => void;
  onOpen: (t: Task) => void;
}) {
  // Droppable id matches the format other lanes use so handleDrop can parse it.
  const { setNodeRef, isOver } = useDroppable({
    id: `Personal::${swimlane}`,
    data: { domain: "Personal", swimlane },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border border-line bg-black/[0.015] p-1.5 min-h-[80px]",
        isOver && "ring-2 ring-ink/30 bg-ink/[0.03]",
      )}
    >
      {tasks.length === 0 ? (
        <div className="text-[11px] text-muted px-1 py-2">—</div>
      ) : (
        <div className="grid gap-1.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tasks.map((t) => <TaskCard key={t.id} task={t} {...handlers} />)}
        </div>
      )}
    </div>
  );
}

export function PersonalColumn({
  tasks,
  scope,
  onAdd,
  ...handlers
}: {
  tasks: Task[];
  scope: Scope;
  onAdd: (subdomain: Subdomain) => void;
  onComplete: (id: string, completionNotes?: string) => void;
  onMoveLane: (id: string, lane: Swimlane) => void;
  onSplit: (t: Task) => void;
  onOpen: (t: Task) => void;
}) {
  const visibleLanes = scope === "day" ? LANES.slice(0, 1) : LANES;
  const todayPts = tasks.filter(t => t.swimlane === "today").reduce((s, t) => s + t.points, 0);
  const totalPts = tasks.reduce((s, t) => s + t.points, 0);

  // Counts per subdomain (across visible scope) for the header chips.
  const subCounts: Record<Subdomain, number> = { me: 0, home: 0, boys: 0 };
  for (const t of tasks) {
    const sd = (t.subdomain ?? "me") as Subdomain;
    if (sd in subCounts) subCounts[sd] += t.points;
  }

  return (
    <div className="flex flex-col rounded-lg border border-line bg-surface shadow-card overflow-hidden h-full">
      <div className="border-b border-line bg-white px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="h-2.5 w-2.5 rounded-full bg-domain-me" />
          <div className="text-sm font-semibold">Personal</div>
          <div className="flex items-center gap-1.5 ml-1">
            {SUBDOMAIN_ORDER.map((sd) => {
              const m = SUBDOMAIN_META[sd];
              return (
                <span key={sd} className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium tabular-nums", m.pill)}>
                  {m.label} {subCounts[sd]}
                </span>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] text-muted tabular-nums">
            <span><span className="text-ink font-semibold">{todayPts}</span> today</span>
            <span><span className="text-ink font-semibold">{totalPts}</span> total</span>
            <div className="flex items-center gap-1 ml-1">
              {SUBDOMAIN_ORDER.map(sd => (
                <button
                  key={sd}
                  onClick={() => onAdd(sd)}
                  className={cn(
                    "h-6 px-1.5 rounded-md border border-line text-[10px] font-medium text-muted hover:text-ink hover:border-ink/40 transition inline-flex items-center gap-0.5",
                  )}
                  title={`Add ${SUBDOMAIN_META[sd].label} task`}
                >
                  <Plus className="h-3 w-3" />{SUBDOMAIN_META[sd].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto lane-scroll p-2 space-y-3">
        {visibleLanes.map((lane) => (
          <div key={lane.id}>
            <div className="text-[10px] font-semibold tracking-wider text-muted px-1 mb-1">{lane.label}</div>
            <Lane
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
