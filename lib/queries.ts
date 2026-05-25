import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BusinessDomain, BusinessKpi, DailyRow, EventRow, Scope, Swimlane, Task,
} from "./types";
import { todayISO } from "./utils";

/** Pure-client query helpers. Pass in a Supabase client to keep this isomorphic. */

export async function fetchTasks(sb: SupabaseClient, _scope: Scope): Promise<Task[]> {
  const { data, error } = await sb
    .from("tasks")
    .select("*")
    .eq("status", "open")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function fetchDaily(sb: SupabaseClient, date = todayISO()): Promise<DailyRow | null> {
  const { data, error } = await sb
    .from("daily_with_rollups")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return (data as DailyRow) ?? null;
}

export async function fetchEvents(sb: SupabaseClient, date = todayISO()): Promise<EventRow[]> {
  const { data, error } = await sb
    .from("events")
    .select("*")
    .eq("date", date)
    .order("logged_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function fetchBusinessKpis(
  sb: SupabaseClient, date = todayISO(),
): Promise<BusinessKpi[]> {
  const { data, error } = await sb
    .from("business_kpis")
    .select("*")
    .eq("date", date);
  if (error) throw error;
  return (data ?? []) as BusinessKpi[];
}

export async function upsertBusinessKpi(
  sb: SupabaseClient,
  domain: BusinessDomain,
  patch: Partial<Pick<BusinessKpi, "customers" | "revenue" | "notes">>,
  date = todayISO(),
): Promise<void> {
  const { error } = await sb
    .from("business_kpis")
    .upsert({ date, domain, ...patch, updated_at: new Date().toISOString() },
            { onConflict: "user_id,date,domain" });
  if (error) throw error;
}

export async function upsertDaily(
  sb: SupabaseClient,
  patch: Partial<DailyRow>,
  date = todayISO(),
): Promise<void> {
  const { error } = await sb
    .from("daily")
    .upsert({ date, ...patch }, { onConflict: "user_id,date" });
  if (error) throw error;
}

export async function updateTask(
  sb: SupabaseClient, id: string, patch: Partial<Task>,
): Promise<void> {
  const { error } = await sb.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function moveTask(
  sb: SupabaseClient, id: string,
  next: { swimlane?: Swimlane; domain?: Task["domain"] },
): Promise<void> {
  await updateTask(sb, id, next);
}

export async function completeTask(
  sb: SupabaseClient, id: string, completion_notes?: string | null,
): Promise<void> {
  const patch: Record<string, unknown> = {
    status: "done",
    done_at: new Date().toISOString(),
  };
  const note = completion_notes?.trim();
  if (note) patch.completion_notes = note;
  const { error } = await sb.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function insertTask(
  sb: SupabaseClient,
  task: Partial<Task> & { domain: Task["domain"]; title: string },
): Promise<Task> {
  const { data, error } = await sb.from("tasks").insert(task).select("*").single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
