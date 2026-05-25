"use client";
import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { ChevronUp, ChevronDown, Scissors, Phone, Laptop, Wrench, Headphones } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { cn, minutesFor } from "@/lib/utils";
import type { Method, Subdomain, Swimlane, Task } from "@/lib/types";
import { CATEGORY_META, DOMAIN_COLORS, SUBDOMAIN_META, isBusiness } from "@/lib/domains";

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
  onComplete: (id: string, completionNotes?: string) => void;
  onMoveLane: (id: string, lane: Swimlane) => void;
  onSplit: (task: Task) => void;
  onOpen: (task: Task) => void;
}) {
  const [leaving, setLeaving]       = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [note, setNote]             = React.useState("");
  const noteRef = React.useRef<HTMLInputElement>(null);

  const MethodIcon = METHOD_ICON[task.method] ?? Laptop;
  const c = DOMAIN_COLORS[task.domain];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const laneIdx = LANE_ORDER.indexOf(task.swimlane);
  const canUp   = laneIdx > 0;
  const canDown = laneIdx < LANE_ORDER.length - 1;

  function startCompleting() {
    setCompleting(true);
    // Focus the note input shortly after it mounts.
    setTimeout(() => noteRef.current?.focus(), 0);
  }
  function finish(noteText?: string) {
    setLeaving(true);
    setTimeout(() => onComplete(task.id, noteText?.trim() || undefined), 220);
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
        completing && "ring-2 ring-emerald-400 bg-emerald-50/40",
        leaving && "card-done",
        isDragging && "opacity-50",
      )}
    >
      {catMeta && (
        <span className={cn("absolute left-0 top-0 bottom-0 w-1", catMeta.bar)} aria-hidden />
      )}

      <div className="flex items-start gap-2">
        <div onPointerDown={(e) => e.stopPropagation()}>
          <Checkbox
            checked={completing}
            onCheckedChange={() => {
              if (!completing) startCompleting();
              else { setCompleting(false); setNote(""); }
            }}
          />
        </div>
        <button
          onClick={() => onOpen(task)}
          className={cn(
            "flex-1 text-left text-sm leading-snug font-medium line-clamp-2",
            completing && "line-through text-muted",
          )}
          {...listeners}
        >
          {task.title}
        </button>
      </div>

      {completing ? (
        <div className="mt-2 space-y-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <input
            ref={noteRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")  { e.preventDefault(); finish(note); }
              if (e.key === "Escape") { e.preventDefault(); setCompleting(false); setNote(""); }
            }}
            placeholder="Optional note for archive…"
            className="h-7 w-full rounded-md border border-line bg-white px-2 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="primary" onClick={() => finish(note)}>
              {note.trim() ? "Save & complete" : "Complete"}
            </Button>
            <Button size="sm" variant="ghost"
              onClick={() => { setCompleting(false); setNote(""); }}
            >Cancel</Button>
            <span className="text-[10px] text-muted ml-auto">Enter to save · Esc to cancel</span>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
