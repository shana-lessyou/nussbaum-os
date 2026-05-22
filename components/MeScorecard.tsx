"use client";
import * as React from "react";
import { Droplets, Pill, Moon, Footprints, Dumbbell, DollarSign, Flame } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import type { DailyRow } from "@/lib/types";

const SAVERS: Array<{ key: keyof DailyRow; label: string }> = [
  { key: "savers_silence",       label: "Silence" },
  { key: "savers_affirmation",   label: "Affirmation" },
  { key: "savers_visualization", label: "Visualization" },
  { key: "savers_exercise",      label: "Exercise" },
  { key: "savers_read",          label: "Read" },
  { key: "savers_scribe",        label: "Scribe" },
];

function StatTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-white px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function MeScorecard({
  daily,
  onPatch,
}: {
  daily: DailyRow | null;
  onPatch: (patch: Partial<DailyRow>) => Promise<void>;
}) {
  function set<K extends keyof DailyRow>(key: K, value: DailyRow[K]) {
    onPatch({ [key]: value } as Partial<DailyRow>);
  }
  const d = daily;

  return (
    <div className="rounded-lg border border-line bg-amber-50/40 shadow-card overflow-hidden h-full flex flex-col">
      <div className="px-3 py-2 border-b border-line bg-white">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-domain-me" />
          <div className="text-sm font-semibold">Me — Daily Scorecard</div>
        </div>
        <div className="text-[11px] text-muted">Be Mom First · {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
      </div>

      <div className="flex-1 overflow-y-auto lane-scroll p-3 space-y-3">
        <section>
          <h3 className="text-[10px] font-semibold tracking-wider text-muted mb-1.5">SAVERS</h3>
          <div className="grid grid-cols-3 gap-1.5 rounded-md border border-line bg-white p-2">
            {SAVERS.map(({ key, label }) => (
              <Checkbox
                key={key}
                size="sm"
                checked={!!d?.[key]}
                onCheckedChange={(v) => set(key, v as never)}
                label={label}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-line bg-white p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted mb-1">
              <Droplets className="h-3 w-3" /> Water
            </div>
            <div className="flex items-center gap-2">
              <button className="h-7 w-7 rounded-md border border-line bg-white hover:bg-black/5"
                onClick={() => set("water", Math.max(0, (d?.water ?? 0) - 1))}>−</button>
              <div className="text-base font-semibold tabular-nums w-8 text-center">{d?.water ?? 0}</div>
              <button className="h-7 w-7 rounded-md border border-line bg-white hover:bg-black/5"
                onClick={() => set("water", (d?.water ?? 0) + 1)}>+</button>
              <span className="text-[11px] text-muted ml-1">cups</span>
            </div>
          </div>
          <div className="rounded-md border border-line bg-white p-2 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted mb-1">
              <Pill className="h-3 w-3" /> Supplements
            </div>
            <div className="mt-auto">
              <Checkbox checked={!!d?.supplements} onCheckedChange={(v) => set("supplements", v)} label="Taken" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-line bg-white p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted mb-1">
              <Footprints className="h-3 w-3" /> Steps
            </div>
            <Input
              type="number" min={0}
              className="h-7 text-sm"
              value={d?.steps ?? 0}
              onChange={(e) => set("steps", Number(e.target.value || 0))}
            />
          </div>
          <div className="rounded-md border border-line bg-white p-2 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted mb-1">
              <Dumbbell className="h-3 w-3" /> Resistance
            </div>
            <div className="mt-auto">
              <Checkbox checked={!!d?.resistance} onCheckedChange={(v) => set("resistance", v)} label="Done" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <StatTile icon={Flame}      label="Calories" value={Math.round(d?.calories_total ?? 0)} />
          <StatTile icon={DollarSign} label="Spending" value={`$${Number(d?.spending_total ?? 0).toFixed(0)}`} />
        </section>

        <section>
          <h3 className="text-[10px] font-semibold tracking-wider text-muted mb-1.5">MACROS (g)</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["protein_g", "carbs_g", "fat_g"] as const).map((k) => (
              <div key={k} className="rounded-md border border-line bg-white p-2">
                <div className="text-[10px] uppercase tracking-wider text-muted">{k.replace("_g","")}</div>
                <Input
                  type="number"
                  className="h-7 mt-0.5 px-1 text-sm"
                  value={d?.[k] ?? ""}
                  onChange={(e) => set(k, e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-line bg-white p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <Moon className="h-3 w-3" /> Sleep (hrs)
            </div>
            <Input
              type="number" step="0.25" min={0}
              className="h-7 mt-1 text-sm"
              value={d?.sleep_hrs ?? ""}
              onChange={(e) => set("sleep_hrs", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div className="rounded-md border border-line bg-white p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted">Notes</div>
            <Input
              className="h-7 mt-1 text-sm"
              value={d?.notes ?? ""}
              onChange={(e) => set("notes", e.target.value || null)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
