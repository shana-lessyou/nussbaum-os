"use client";
import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DOMAIN_ORDER, SUBDOMAIN_ORDER, isBusiness } from "@/lib/domains";
import type { Category, Domain, Method, Subdomain, Swimlane, Task } from "@/lib/types";

const METHODS: Method[]      = ["phys", "phone", "comp", "hands-free"];
const SWIMLANES: Swimlane[]  = ["today", "this-week", "backlog"];
const CATEGORIES: Category[] = ["build", "sell", "admin"];

export type TaskDraft = Partial<Task> & { title?: string; domain?: Domain };

export function TaskDetail({
  task,
  mode,
  defaults,
  onClose,
  onSave,
  onCreate,
  onDelete,
}: {
  task: Task | null;            // null when creating
  mode: "edit" | "create";
  defaults?: TaskDraft;         // initial values when creating
  onClose: () => void;
  onSave?: (patch: Partial<Task>) => Promise<void>;
  onCreate?: (draft: TaskDraft) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [form, setForm] = React.useState<TaskDraft>({});

  React.useEffect(() => {
    if (mode === "edit" && task) {
      setForm({
        title: task.title,
        notes: task.notes ?? "",
        points: task.points,
        method: task.method,
        domain: task.domain,
        subdomain: task.subdomain ?? undefined,
        swimlane: task.swimlane,
        category: task.category ?? undefined,
      });
    } else if (mode === "create") {
      setForm({
        title: "",
        notes: "",
        points: 1,
        method: "comp",
        swimlane: "today",
        ...defaults,
      });
    }
  }, [task?.id, mode]);

  const businessDomain = !!form.domain && isBusiness(form.domain);
  const personalDomain = form.domain === "Personal";

  async function submit() {
    if (mode === "create") { await onCreate?.(form); }
    else                   { await onSave?.(form); }
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={mode === "create" ? "New task" : "Task details"}
      footer={
        <>
          {mode === "edit" && task && (
            <Button variant="ghost" onClick={() => onDelete?.(task.id).then(onClose)} className="text-red-600">Delete</Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!form.title?.trim()}>
            {mode === "create" ? "Add" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted">Title</label>
          <Input
            autoFocus
            value={form.title ?? ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What needs to happen?"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Notes</label>
          <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted">Domain</label>
            <select
              className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value as Domain })}
            >
              {DOMAIN_ORDER.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Swimlane</label>
            <select
              className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
              value={form.swimlane}
              onChange={(e) => setForm({ ...form, swimlane: e.target.value as Swimlane })}
            >
              {SWIMLANES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Points (1 = 20 min)</label>
            <Input type="number" min={0} value={form.points ?? 1}
              onChange={(e) => setForm({ ...form, points: parseInt(e.target.value || "0", 10) })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Method</label>
            <select
              className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as Method })}
            >
              {METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {businessDomain && (
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted">Category</label>
              <select
                className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: (e.target.value || null) as Category | null })}
              >
                <option value="">— none —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          )}
          {personalDomain && (
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted">Who</label>
              <select
                className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm"
                value={(form.subdomain as string) ?? "me"}
                onChange={(e) => setForm({ ...form, subdomain: e.target.value as Subdomain })}
              >
                {SUBDOMAIN_ORDER.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
