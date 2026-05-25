"use client";
import * as React from "react";
import {
  DndContext, PointerSensor, useSensor, useSensors,
  type DragEndEvent, closestCenter,
} from "@dnd-kit/core";
import { LogOut } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {
  completeTask, deleteTask, fetchBusinessKpis, fetchDaily, fetchTasks,
  insertTask, moveTask, updateTask, upsertBusinessKpi, upsertDaily,
} from "@/lib/queries";
import type {
  BusinessDomain, BusinessKpi, DailyRow, Domain, Scope, Subdomain, Swimlane, Task,
} from "@/lib/types";
import { DAILY_CAPACITY } from "@/lib/domains";
import { DomainColumn } from "./DomainColumn";
import { MeScorecard } from "./MeScorecard";
import { PersonalColumn } from "./PersonalColumn";
import { QuickCapture } from "./QuickCapture";
import { ScopeToggle } from "./ScopeToggle";
import { TaskDetail, type TaskDraft } from "./TaskDetail";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

const SCOPE_DAYS: Record<Scope, number> = { day: 1, week: 7, month: 30 };

export function Board() {
  const sb = React.useMemo(() => createSupabaseBrowser(), []);
  const [tasks, setTasks]     = React.useState<Task[]>([]);
  const [daily, setDaily]     = React.useState<DailyRow | null>(null);
  const [kpis, setKpis]       = React.useState<BusinessKpi[]>([]);
  const [scope, setScope]     = React.useState<Scope>("day");
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [creating, setCreating] = React.useState<TaskDraft | null>(null);
  const [loading, setLoading] = React.useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const reload = React.useCallback(async () => {
    const [t, d, k] = await Promise.all([
      fetchTasks(sb, scope),
      fetchDaily(sb),
      fetchBusinessKpis(sb),
    ]);
    setTasks(t); setDaily(d); setKpis(k); setLoading(false);
  }, [sb, scope]);

  React.useEffect(() => { reload().catch(console.error); }, [reload]);

  const visibleTasks = React.useMemo(() => {
    if (scope === "day")  return tasks.filter(t => t.swimlane === "today");
    if (scope === "week") return tasks.filter(t => t.swimlane !== "backlog");
    return tasks;
  }, [tasks, scope]);

  function tasksFor(domain: Domain): Task[] {
    return visibleTasks.filter(t => t.domain === domain);
  }
  function kpiFor(domain: BusinessDomain): BusinessKpi | undefined {
    return kpis.find(k => k.domain === domain);
  }

  // ---- Top-line aggregates ----
  const totalTodayPts = tasks.filter(t => t.swimlane === "today").reduce((s, t) => s + t.points, 0);
  const totalScopePts = visibleTasks.reduce((s, t) => s + t.points, 0);
  const avgPerDay     = totalScopePts / SCOPE_DAYS[scope];
  const capFlag       =
    totalTodayPts > DAILY_CAPACITY            ? "over" :
    totalTodayPts >= DAILY_CAPACITY * 0.8     ? "warn" : "ok";

  // ---- Mutations (optimistic) ----
  async function handleComplete(id: string, completionNotes?: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await completeTask(sb, id, completionNotes); } catch (e) { console.error(e); reload(); }
  }
  async function handleMoveLane(id: string, swimlane: Swimlane) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, swimlane } : t));
    try { await moveTask(sb, id, { swimlane }); } catch (e) { console.error(e); reload(); }
  }
  async function handleDrop(e: DragEndEvent) {
    if (!e.over) return;
    const id = String(e.active.id);
    const dropData = e.over.data.current as { domain: Domain; swimlane: Swimlane } | undefined;
    if (!dropData) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, domain: dropData.domain, swimlane: dropData.swimlane } : t));
    try { await moveTask(sb, id, { domain: dropData.domain, swimlane: dropData.swimlane }); }
    catch (err) { console.error(err); reload(); }
  }
  async function handleSplit(task: Task) {
    try {
      const res = await fetch("/api/split", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
    } catch (e) { console.error(e); alert("Split failed: " + (e as Error).message); }
  }
  async function handleSaveDetail(patch: Partial<Task>) {
    if (!editing) return;
    setTasks(prev => prev.map(t => t.id === editing.id ? { ...t, ...patch } as Task : t));
    await updateTask(sb, editing.id, patch);
  }
  async function handleCreate(draft: TaskDraft) {
    if (!draft.title || !draft.domain) return;
    const inserted = await insertTask(sb, {
      domain: draft.domain,
      subdomain: draft.subdomain ?? (draft.domain === "Personal" ? "me" : null),
      title: draft.title,
      notes: draft.notes ?? null,
      points: draft.points ?? 1,
      method: draft.method ?? "comp",
      swimlane: draft.swimlane ?? "today",
      category: draft.category ?? null,
      created_by: "Shana",
    });
    setTasks(prev => [...prev, inserted]);
  }
  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTask(sb, id);
  }
  async function handlePatchDaily(patch: Partial<DailyRow>) {
    setDaily(prev => ({ ...(prev ?? {} as DailyRow), ...patch }));
    try { await upsertDaily(sb, patch); } catch (e) { console.error(e); reload(); }
  }
  async function handleKpiChange(domain: BusinessDomain, patch: Partial<Pick<BusinessKpi, "customers" | "revenue">>) {
    setKpis(prev => {
      const existing = prev.find(k => k.domain === domain);
      if (existing) return prev.map(k => k.domain === domain ? { ...k, ...patch } : k);
      return [...prev, { domain, customers: 0, revenue: 0, notes: null, date: "", user_id: "", ...patch } as BusinessKpi];
    });
    try { await upsertBusinessKpi(sb, domain, patch); }
    catch (e) { console.error(e); reload(); }
  }
  async function signOut() { await sb.auth.signOut(); location.href = "/login"; }

  if (loading) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-line bg-white">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-ink text-white grid place-items-center text-xs font-bold">N</div>
          <div>
            <div className="text-sm font-semibold leading-tight">Nussbaum OS</div>
            <div className="text-[11px] text-muted leading-tight">Be Mom First</div>
          </div>
        </div>

        <div className="ml-4 hidden md:flex items-center gap-3 text-[12px] text-muted tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full",
              capFlag === "over" ? "bg-red-500" : capFlag === "warn" ? "bg-amber-500" : "bg-emerald-500")} />
            <span className="text-ink font-semibold">{totalTodayPts}</span>
            <span>/ {DAILY_CAPACITY} pts today</span>
          </span>
          {scope !== "day" && (
            <>
              <span><span className="text-ink font-semibold">{totalScopePts}</span> pts in {scope}</span>
              <span><span className="text-ink font-semibold">{avgPerDay.toFixed(1)}</span> pts/day avg</span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ScopeToggle value={scope} onChange={setScope} />
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDrop}>
        <main className="flex-1 p-3 md:p-4 overflow-x-auto">
          {/* 4 columns: 3 business (small) + Personal (~2/3 of width).
              Personal column = scorecard strip on top, tasks below, capture at bottom. */}
          <div className="grid gap-3 md:gap-4 min-w-[1200px] lg:min-w-0 lg:grid-cols-[2fr_2fr_2fr_3fr] h-[calc(100vh-58px-24px)]">
            {(["Capacera", "Praxemy", "LYMP"] as BusinessDomain[]).map((domain) => (
              <DomainColumn
                key={domain}
                domain={domain}
                tasks={tasksFor(domain)}
                scope={scope}
                kpi={kpiFor(domain)}
                onKpiChange={(patch) => handleKpiChange(domain, patch)}
                onAdd={(d) => setCreating({ domain: d, swimlane: "today", points: 1, method: "comp" })}
                onComplete={handleComplete}
                onMoveLane={handleMoveLane}
                onSplit={handleSplit}
                onOpen={(t) => setEditing(t)}
              />
            ))}

            <div className="flex flex-col gap-3 min-h-0">
              <MeScorecard daily={daily} onPatch={handlePatchDaily} />
              <div className="flex-1 min-h-0">
                <PersonalColumn
                  tasks={tasksFor("Personal")}
                  scope={scope}
                  onAdd={(sub: Subdomain) => setCreating({
                    domain: "Personal", subdomain: sub,
                    swimlane: "today", points: 1, method: "comp",
                  })}
                  onComplete={handleComplete}
                  onMoveLane={handleMoveLane}
                  onSplit={handleSplit}
                  onOpen={(t) => setEditing(t)}
                />
              </div>
              <QuickCapture onLogged={reload} />
            </div>
          </div>
        </main>
      </DndContext>

      {editing && (
        <TaskDetail
          mode="edit"
          task={editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveDetail}
          onDelete={handleDelete}
        />
      )}
      {creating && (
        <TaskDetail
          mode="create"
          task={null}
          defaults={creating}
          onClose={() => setCreating(null)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

