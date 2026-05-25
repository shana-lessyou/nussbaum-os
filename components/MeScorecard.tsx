"use client";
import * as React from "react";
import { Droplets, Pill, Moon, Footprints, Dumbbell, DollarSign, Flame } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { DailyRow } from "@/lib/types";

const SAVERS: Array<{ key: keyof DailyRow; label: string }> = [
  { key: "savers_silence",       label: "Silence" },
  { key: "savers_affirmation",   label: "Affirmation" },
  { key: "savers_visualization", label: "Visualization" },
  { key: "savers_exercise",      label: "Exercise" },
  { key: "savers_read",          label: "Read" },
  { key: "savers_scribe",        label: "Scribe" },
];

function Tile({
  icon: Icon, label, children, className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-line bg-white px-2 py-1.5 min-w-[88px]", className)}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
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
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="rounded-lg border border-line bg-amber-50/40 shadow-card p-2.5 space-y-2">
      {/* Title + SAVERS row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-domain-me" />
          <div className="text-sm font-semibold">Daily Scorecard</div>
          <div className="text-[11px] text-muted">{dateLabel}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap pl-3 border-l border-line">
          {SAVERS.map(({ key, label }) => (
            <Checkbox
              key={key}
              size="sm"
              checked={!!d?.[key]}
              onCheckedChange={(v) => set(key, v as never)}
              label={<span className="text-xs">{label}</span>}
            />
          ))}
        </div>
      </div>

      {/* Tiles */}
      <div className="flex items-stretch gap-2 flex-wrap">
        <Tile icon={Droplets} label="Water">
          <div className="flex items-center gap-1.5">
            <button className="h-6 w-6 rounded-md border border-line hover:bg-black/5"
              onClick={() => set("water", Math.max(0, (d?.water ?? 0) - 1))}>−</button>
            <div className="text-sm font-semibold tabular-nums w-6 text-center">{d?.water ?? 0}</div>
            <button className="h-6 w-6 rounded-md border border-line hover:bg-black/5"
              onClick={() => set("water", (d?.water ?? 0) + 1)}>+</button>
          </div>
        </Tile>

        <Tile icon={Pill} label="Supps">
          <Checkbox checked={!!d?.supplements} onCheckedChange={(v) => set("supplements", v)} />
        </Tile>

        <Tile icon={Footprints} label="Steps">
          <Input type="number" min={0} className="h-6 text-sm px-1"
            value={d?.steps ?? 0}
            onChange={(e) => set("steps", Number(e.target.value || 0))}
          />
        </Tile>

        <Tile icon={Dumbbell} label="Resist">
          <Checkbox checked={!!d?.resistance} onCheckedChange={(v) => set("resistance", v)} />
        </Tile>

        <Tile icon={Flame} label="Calories">
          <div className="text-sm font-semibold tabular-nums">{Math.round(d?.calories_total ?? 0)}</div>
        </Tile>

        <Tile icon={DollarSign} label="Spent">
          <div className="text-sm font-semibold tabular-nums">${Number(d?.spending_total ?? 0).toFixed(0)}</div>
        </Tile>

        <Tile label="Protein">
          <Input type="number" className="h-6 text-sm px-1"
            value={d?.protein_g ?? ""}
            onChange={(e) => set("protein_g", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Tile>
        <Tile label="Carbs">
          <Input type="number" className="h-6 text-sm px-1"
            value={d?.carbs_g ?? ""}
            onChange={(e) => set("carbs_g", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Tile>
        <Tile label="Fat">
          <Input type="number" className="h-6 text-sm px-1"
            value={d?.fat_g ?? ""}
            onChange={(e) => set("fat_g", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Tile>

        <Tile icon={Moon} label="Sleep">
          <Input type="number" step="0.25" min={0} className="h-6 text-sm px-1"
            value={d?.sleep_hrs ?? ""}
            onChange={(e) => set("sleep_hrs", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Tile>
      </div>
    </div>
  );
}
