/**
 * POST /api/tasks — agent ingestion endpoint.
 *
 * Authenticated with the `x-agent-secret` header (shared secret, env
 * AGENT_SHARED_SECRET). Inserts one or many tasks against the single owner
 * identified by env AGENT_USER_ID (Shana's Supabase auth UID). Uses the
 * service-role client so it bypasses RLS — this is safe because the secret
 * check + AGENT_USER_ID together gate every write.
 *
 * Accepts a single task object OR an array of task objects.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// ---- vocab ----
const VALID_DOMAINS    = ["Capacera", "Praxemy", "LYMP", "Personal"] as const;
const VALID_SUBDOMAINS = ["home", "boys", "me"] as const;
const VALID_SWIMLANES  = ["today", "this-week", "backlog"] as const;
const VALID_METHODS    = ["phys", "phone", "comp", "hands-free"] as const;
const VALID_CATEGORIES = ["build", "sell", "admin"] as const;

type Subdomain = (typeof VALID_SUBDOMAINS)[number];

// Personal → existing UI column. The board groups Home/Boys/Me as siblings,
// so we translate Personal+subdomain into the corresponding storage domain
// to keep tasks visible without touching the existing UI.
const PERSONAL_TO_STORAGE: Record<Subdomain, "Home" | "Boys" | "Me"> = {
  home: "Home", boys: "Boys", me: "Me",
};

interface IncomingTask {
  domain?: unknown;
  subdomain?: unknown;
  category?: unknown;
  title?: unknown;
  notes?: unknown;
  swimlane?: unknown;
  points?: unknown;
  method?: unknown;
  created_by?: unknown;
}

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function isStringIn<T extends readonly string[]>(v: unknown, set: T): v is T[number] {
  return typeof v === "string" && (set as readonly string[]).includes(v);
}

export async function POST(req: Request) {
  // ---- auth ----
  const secret = req.headers.get("x-agent-secret");
  const expected = process.env.AGENT_SHARED_SECRET;
  if (!expected) {
    return json(500, { ok: false, error: "AGENT_SHARED_SECRET not configured on server" });
  }
  if (!secret || secret !== expected) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  const userId = process.env.AGENT_USER_ID;
  if (!userId) {
    return json(500, { ok: false, error: "AGENT_USER_ID not configured on server" });
  }

  // ---- parse ----
  let body: unknown;
  try { body = await req.json(); }
  catch { return json(400, { ok: false, error: "Malformed JSON body" }); }

  const items: IncomingTask[] = Array.isArray(body) ? body : [body as IncomingTask];
  if (items.length === 0) {
    return json(400, { ok: false, error: "No tasks provided" });
  }

  const admin = createAdminClient();
  const created: Array<Record<string, unknown>> = [];

  for (let i = 0; i < items.length; i++) {
    const t = items[i] ?? {};
    const prefix = items.length > 1 ? `tasks[${i}]: ` : "";

    // ---- required ----
    const title = typeof t.title === "string" ? t.title.trim() : "";
    if (!title) {
      return json(400, { ok: false, error: `${prefix}'title' is required` });
    }
    const createdBy = typeof t.created_by === "string" ? t.created_by.trim() : "";
    if (!createdBy) {
      return json(400, { ok: false, error: `${prefix}'created_by' is required` });
    }

    // ---- domain (422 because it's a vocab error, not a missing field) ----
    if (!isStringIn(t.domain, VALID_DOMAINS)) {
      return json(422, {
        ok: false,
        error: `${prefix}'domain' must be one of ${VALID_DOMAINS.join("|")}`,
      });
    }
    const domainIn = t.domain;

    // ---- subdomain + resolved storage domain ----
    let storeDomain: string;
    let storeSubdomain: string | null;
    if (domainIn === "Personal") {
      const sdRaw = t.subdomain ?? "me";
      if (!isStringIn(sdRaw, VALID_SUBDOMAINS)) {
        return json(400, {
          ok: false,
          error: `${prefix}'subdomain' for Personal must be one of ${VALID_SUBDOMAINS.join("|")}`,
        });
      }
      storeDomain    = PERSONAL_TO_STORAGE[sdRaw];
      storeSubdomain = sdRaw;
    } else {
      // Business domain — spec says ignore any subdomain sent.
      storeDomain    = domainIn;
      storeSubdomain = null;
    }

    // ---- optional fields with defaults ----
    const swimlane = isStringIn(t.swimlane, VALID_SWIMLANES) ? t.swimlane : "this-week";
    const method   = isStringIn(t.method,   VALID_METHODS)   ? t.method   : "comp";
    const category = isStringIn(t.category, VALID_CATEGORIES) ? t.category : null;
    const ptsNum   = Number(t.points);
    const points   = Number.isFinite(ptsNum) && ptsNum >= 1 ? Math.floor(ptsNum) : 1;
    const notes    = typeof t.notes === "string" && t.notes.trim() ? t.notes : null;

    // ---- light dedup: same agent + title, still open, last 24h ----
    const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing, error: dupErr } = await admin
      .from("tasks")
      .select("id,title,domain,subdomain,swimlane,points,created_by")
      .eq("user_id", userId)
      .eq("status", "open")
      .eq("created_by", createdBy)
      .eq("title", title)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dupErr) {
      return json(500, { ok: false, error: `Dedup lookup failed: ${dupErr.message}` });
    }
    if (existing) {
      created.push({ ...existing, deduped: true });
      continue;
    }

    // ---- insert ----
    const { data: row, error: insErr } = await admin
      .from("tasks")
      .insert({
        user_id:     userId,
        domain:      storeDomain,
        subdomain:   storeSubdomain,
        category,
        title,
        notes,
        swimlane,
        points,
        method,
        status:      "open",
        created_by:  createdBy,
      })
      .select("id,title,domain,subdomain,swimlane,points,created_by")
      .single();

    if (insErr) {
      return json(500, { ok: false, error: `Insert failed: ${insErr.message}` });
    }
    created.push(row);
  }

  return json(200, { ok: true, created });
}
