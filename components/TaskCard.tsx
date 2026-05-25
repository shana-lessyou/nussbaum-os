"use client";
import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { ChevronUp, ChevronDown, Scissors, Phone, Laptop, Wrench, Headphones } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { cn, minutesFor } from "@/lib/utils";
import type { Method, Swimlane, Task } from "@/lib/types";
import { CATEGORY_META, DOMAIN_COLORS, SUBDOMAIN_META, isBusiness } from "@/lib/domains";
import type { Subdomain } from "@/lib/types";

const METHOD_ICON: Record<Method, React.ComponentType<{ className?: string }>> = {
  phys: Wrench,
  phone: Phone,
  comp: Laptop,
  "hands-free": Headphones,
};

const LANE_ORDER: Swimlane[] = ["today", "this-week", "backlog"];

export function TaskCard({
  task,
  onComplete,
  onMoveLane,
  onSplit,
  onOpen,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onMoveLane: (id: string, lane: Swimlane) => void;
  onSplit: (task: Task) => void;
  onOpen: (task: Task) => void;
}) {
  const [leaving, setLeaving] = React.useState(false);
  const MethodIcon = METHOD_ICON[task.method] ?? Laptop;
  const c = DOMAIN_COLORS[task.domain];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const laneIdx = LANE_ORDER.indexOf(task.swimlane);
  const canUp   = laneIdx > 0;
  const canDown = laneIdx < LANE_ORDER.length - 1;

  function complete() {
    setLeaving(true);
    setTimeout(() => onComplete(task.id), 220);
  }

  const showCategory = isBusiness(task.domain) && task.category;
  const catMeta = showCategory ? CATEGORY_META[task.category!] : null;
  const subMeta =
    task.domain === "Personal" && task.subdomain && task.subdomain in SUBDOMAIN_META
      ? SUBDOMAIN_META[task.subdomain as Subdomain]
      : null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={cn(
        "group relative rounded-lg border border-line bg-white p-2.5 pl-3 shadow-card overflow-hidden",
        "ring-1 ring-transparent hover:ring-2 transition",
        c.ring,
        leaving && "card-done",
        isDragging && "opacity-50",
      )}
    >
      {catMeta && (
        <span className={cn("absolute left-0 top-0 bottom-0 w-1", catMeta.bar)} aria-hidden />
      )}
      <div className="flex items-start gap-2">
        <div onPointerDown={(e) => e.stopPropagation()}>
          <Checkbox checked={false} onCheckedChange={() => complete()} />
        </div>
        <button
          onClick={() => onOpen(task)}
          className="flex-1 text-left text-sm leading-snug font-medium line-clamp-2"
          {...listeners}
        >
          {task.title}
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          {subMeta && (
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium", subMeta.pill)}>
              {subMeta.label}
            </span>
          )}
          <MethodIcon className="h-3 w-3" />
          <span className="tabular-nums">
            {task.points} pt{task.points === 1 ? "" : "s"} · {minutesFor(task.points)} min
          </span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <Button
            size="icon" variant="ghost"
            disabled={!canUp}
            onClick={(e) => { e.stopPropagation(); onMoveLane(task.id, LANE_ORDER[laneIdx - 1]); }}
            title="Promote"
          ><ChevronUp className="h-3.5 w-3.5" /></Button>
          <Button
            size="icon" variant="ghost"
            disabled={!canDown}
            onClick={(e) => { e.stopPropagation(); onMoveLane(task.id, LANE_ORDER[laneIdx + 1]); }}
            title="Demote"
          ><ChevronDown className="h-3.5 w-3.5" /></Button>
          <Button
            size="icon" variant="ghost"
            onClick={(e) => { e.stopPropagation(); onSplit(task); }}
            title="Split into parts"
          ><Scissors className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}
