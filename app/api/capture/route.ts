import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CAPTURE_MODEL, extractJson } from "@/lib/anthropic";
import { createSupabaseServer } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";
import type { CaptureResult } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You parse a user's free-text "brain dump" into structured items for a personal dashboard.

Return STRICT JSON ONLY (no prose, no markdown fences). Shape:
{
  "tasks":  [ { "domain": "Capacera|Praxemy|LYMP|Home|Boys|Me",
                "title": "short imperative phrase",
                "points": 1, "method": "phys|phone|comp|hands-free",
                "swimlane": "today|this-week|backlog",
                "category": "build|sell|admin"          // ONLY when domain is Capacera|Praxemy|LYMP
              } ],
  "events": [ { "type": "meal|purchase", "entry": "what",
                "value": <number>, "unit": "kcal|USD" } ],
  "daily_updates": {
     "savers_silence|savers_affirmation|savers_visualization|savers_exercise|savers_read|savers_scribe": <bool>,
     "water": <int cups>, "supplements": <bool>,
     "sleep_hrs": <number>, "steps": <int>, "resistance": <bool>,
     "notes": "<text>"
  },
  "macros_delta": { "protein_g": <number>, "carbs_g": <number>, "fat_g": <number> }
}

Rules:
- 1 point ≈ 20 minutes of focused work; cap individual tasks at ≤4 points (split larger).
- If unclear which business/domain, default tasks to "Home".
- For business tasks, ALWAYS classify category as Build (making/shipping product),
  Sell (sales, marketing, customer outreach), or Admin (paperwork, bookkeeping, ops).
- Meals → events with unit "kcal". Purchases → unit "USD".
- macros_delta is the AMOUNT to ADD to today's running totals (e.g. eggs+toast → protein_g: 20).
  Only include macros when food is mentioned. Omit otherwise.
- Only include fields that are clearly stated. Omit unknowns. Empty arrays/objects are fine.
- Never invent values. Never include keys outside the schema above.`;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const sb = createSupabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const msg = await anthropic.messages.create({
      model: CAPTURE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const raw = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text).join("\n");

    let parsed: CaptureResult;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch (err) {
      console.error("Capture parse error", err, raw);
      return NextResponse.json({ error: "model returned unparseable JSON", raw }, { status: 502 });
    }

    const counts = { tasks: 0, events: 0, daily_fields: 0 };

    // Insert tasks
    if (Array.isArray(parsed.tasks) && parsed.tasks.length) {
      const rows = parsed.tasks
        .filter(t => t.title && t.domain)
        .map(t => ({
          domain: t.domain,
          title: t.title,
          points: t.points ?? 1,
          method: t.method ?? "comp",
          swimlane: t.swimlane ?? "today",
          category: t.category ?? null,
          created_by: "Capture",
        }));
      if (rows.length) {
        const { error } = await sb.from("tasks").insert(rows);
        if (error) throw error;
        counts.tasks = rows.length;
      }
    }

    // Insert events
    const today = todayISO();
    if (Array.isArray(parsed.events) && parsed.events.length) {
      const rows = parsed.events
        .filter(e => e.type && e.entry && typeof e.value === "number")
        .map(e => ({
          date: today,
          type: e.type,
          entry: e.entry,
          value: e.value,
          unit: e.unit ?? (e.type === "meal" ? "kcal" : "USD"),
          source: "capture",
        }));
      if (rows.length) {
        const { error } = await sb.from("events").insert(rows);
        if (error) throw error;
        counts.events = rows.length;
      }
    }

    // Daily updates (overwrite scalar fields)
    const updates = parsed.daily_updates ?? {};
    const cleanUpdates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === undefined || v === "") continue;
      cleanUpdates[k] = v;
    }

    // Macros: accumulate (read current → add delta → write)
    const macrosDelta = parsed.macros_delta ?? {};
    const hasMacroDelta = (["protein_g","carbs_g","fat_g"] as const).some(
      k => typeof macrosDelta[k] === "number" && macrosDelta[k] !== 0,
    );
    if (hasMacroDelta) {
      const { data: current } = await sb
        .from("daily")
        .select("protein_g,carbs_g,fat_g")
        .eq("date", today)
        .maybeSingle();
      for (const k of ["protein_g","carbs_g","fat_g"] as const) {
        const delta = Number(macrosDelta[k] ?? 0);
        if (!delta) continue;
        cleanUpdates[k] = Number(current?.[k] ?? 0) + delta;
      }
    }

    if (Object.keys(cleanUpdates).length) {
      const { error } = await sb
        .from("daily")
        .upsert({ date: today, ...cleanUpdates }, { onConflict: "user_id,date" });
      if (error) throw error;
      counts.daily_fields = Object.keys(cleanUpdates).length;
    }

    return NextResponse.json({ ok: true, counts, parsed });
  } catch (e: any) {
    console.error("Capture failed", e);
    return NextResponse.json({ error: e?.message ?? "capture failed" }, { status: 500 });
  }
}
