import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CAPTURE_MODEL, extractJson } from "@/lib/anthropic";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You split one task into 2–4 sub-tasks, each ≤ 1 point (≤ 20 minutes).
Return STRICT JSON ONLY:
{ "parts": [ { "title": "Part 1: ...", "points": 1, "method": "phys|phone|comp|hands-free", "notes": "<optional>" } ] }

Rules:
- Each title starts with "Part N: ".
- Total points across parts should roughly equal the original task's points.
- Inherit domain and swimlane from the original task (don't include them here).
- Prefer concrete, sequenced steps a person can actually do.`;

export async function POST(req: Request) {
  try {
    const { task } = (await req.json()) as { task: Task };
    if (!task?.id) return NextResponse.json({ error: "task required" }, { status: 400 });

    const sb = createSupabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const userText = `Original task:
- Domain: ${task.domain}
- Title: ${task.title}
- Notes: ${task.notes ?? ""}
- Points: ${task.points}
- Method: ${task.method}
- Swimlane: ${task.swimlane}`;

    const msg = await anthropic.messages.create({
      model: CAPTURE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userText }],
    });

    const raw = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text).join("\n");

    let parsed: { parts: Array<{ title: string; points?: number; method?: Task["method"]; notes?: string }> };
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      return NextResponse.json({ error: "model returned unparseable JSON", raw }, { status: 502 });
    }
    if (!Array.isArray(parsed.parts) || parsed.parts.length === 0) {
      return NextResponse.json({ error: "no parts returned" }, { status: 502 });
    }

    const rows = parsed.parts.map((p) => ({
      domain: task.domain,
      title: p.title,
      notes: p.notes ?? null,
      points: Math.max(0, Math.min(1, p.points ?? 1)),
      method: p.method ?? task.method,
      swimlane: task.swimlane,
      created_by: "Split",
    }));

    const { error: insErr } = await sb.from("tasks").insert(rows);
    if (insErr) throw insErr;

    const { error: delErr } = await sb.from("tasks").delete().eq("id", task.id);
    if (delErr) throw delErr;

    return NextResponse.json({ ok: true, created: rows.length });
  } catch (e: any) {
    console.error("Split failed", e);
    return NextResponse.json({ error: e?.message ?? "split failed" }, { status: 500 });
  }
}
