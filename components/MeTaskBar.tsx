"use client";
import { Plus, Scissors } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Compact task list for the Me column. The Me column's main panel is the
 * scorecard, so personal tasks need their own slim home above it.
 */
export function MeTaskBar({
  tasks,
  onComplete,
  onOpen,
  onSplit,
  onAdd,
}: {
  tasks: Task[];
  onComplete: (id: string) => void;
  onOpen: (t: Task) => void;
  onSplit: (t: Task) => void;
  onAdd: () => void;
}) {
  const todayPts = tasks.filter(t => t.swimlane === "today").reduce((s, t) => s + t.points, 0);
  const totalPts = tasks.reduce((s, t) => s + t.points, 0);

  return (
    <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <span className="h-2.5 w-2.5 rounded-full bg-domain-me" />
        <div className="text-sm font-semibold">Me — Tasks</div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted tabular-nums">
          <span><span className="text-ink font-semibold">{todayPts}</span> today</span>
          <span><span className="text-ink font-semibold">{totalPts}</span> total</span>
          <button
            onClick={onAdd}
            className="h-6 w-6 grid place-items-center rounded-md border border-line text-muted hover:text-ink hover:border-ink/40 transition"
            title="Add task"
          ><Plus className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="max-h-[180px] overflow-y-auto lane-scroll p-1.5 space-y-1">
        {tasks.length === 0 ? (
          <div className="text-[11px] text-muted px-2 py-2">No personal tasks.</div>
        ) : tasks.map(t => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-2 rounded-md border border-line bg-black/[0.015] px-2 py-1.5 hover:bg-white transition",
              t.swimlane === "today" && "ring-1 ring-domain-me/20",
            )}
          >
            <Checkbox checked={false} onCheckedChange={() => onComplete(t.id)} />
            <button
              onClick={() => onOpen(t)}
              className="flex-1 text-left text-sm leading-snug line-clamp-1"
              title={t.title}
            >
              {t.title}
            </button>
            <span className="text-[10px] text-muted tabular-nums shrink-0">{t.points}p</span>
            <Button
              size="icon" variant="ghost"
              onClick={(e) => { e.stopPropagation(); onSplit(t); }}
              className="opacity-0 group-hover:opacity-100"
              title="Split into parts"
            ><Scissors className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
