# Nussbaum OS — *Be Mom First*

A personal operating-system dashboard: a vertical Kanban board (domains × today/this-week/backlog), a daily scorecard in the center, and a natural-language quick-capture box that parses brain-dumps into tasks, events, and daily updates via Claude.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + RLS) · Anthropic API · Vercel.

---

## 1. Local setup

```bash
cd nussbaum-os
npm install
cp .env.local.example .env.local   # then fill in values
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login` until you complete the magic-link flow.

### Environment variables

| Variable                          | Where it's used                         |
|-----------------------------------|------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Browser + server Supabase clients        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Browser + server Supabase clients        |
| `SUPABASE_SERVICE_ROLE_KEY`       | Reserved for future admin scripts        |
| `ANTHROPIC_API_KEY`               | `/api/capture` and `/api/split` route handlers |

All secrets come from env — nothing is hardcoded. Never commit `.env.local`.

---

## 2. Apply the Supabase migration

The schema lives in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). It creates:

- `tasks`, `events`, `daily` tables (user-scoped via `auth.uid()`)
- `daily_with_rollups` view (joins `daily` with summed meal kcal and purchase USD per day)
- Row Level Security policies — every row is keyed to its owner

Apply it with whichever you prefer:

**Option A — Supabase CLI (recommended)**
```bash
supabase link --project-ref <your-ref>
supabase db push
```

**Option B — Studio SQL editor**
Open the Supabase dashboard → SQL → paste the file → Run.

After the migration, enable **Email** auth in Supabase Auth settings and add `http://localhost:3000` (and later `https://bemomfirst.com`) to **Site URL** + **Additional redirect URLs**.

---

## 3. How it works

### Board layout
Six domain columns, left to right:

```
Businesses                  | Self | Family
Capacera · Praxemy · LYMP   | Me   | Home · Boys
```

Each column has three vertical swimlanes — **TODAY**, **THIS WEEK**, **BACKLOG** — and a KPI strip at the top (points done / today / total open, with a green/amber/red flag for today's capacity).

Cards show title, point count (1 pt = 20 min), and a method icon. Hover a card to reveal:
- ⬆ / ⬇ Promote or demote between swimlanes
- ✂ Split — sends the card to Claude to break it into ≤ 1-point parts, then replaces the original
- ✓ Done — animates out and marks `status = 'done'`

Drag a card between columns to change its domain; drag between swimlanes to change priority. Every move is optimistic + persisted to Supabase immediately.

### Me Scorecard (center column)
Reads/writes today's `daily` row:
- SAVERS (six checkboxes)
- Water counter, Supplements
- Macros (g) + rolled-up calories (sum of today's meal events)
- Rolled-up spending (sum of today's purchase events in USD)
- Exercise text, Sleep hours, Notes

### Quick Capture
The textarea under the scorecard takes a free-text dump. `POST /api/capture` sends it to Claude (`claude-sonnet-4-20250514`, `max_tokens: 1024`) with a system prompt that returns **strict JSON only** in this shape:

```json
{
  "tasks":         [{ "domain": "...", "title": "...", "points": 1, "method": "...", "swimlane": "..." }],
  "events":        [{ "type": "meal|purchase", "entry": "...", "value": 0, "unit": "kcal|USD" }],
  "daily_updates": { "sleep_hrs": 6.5, "savers_silence": true, ... }
}
```

The handler strips any markdown fences before parsing, then writes each section to its table. A receipt ("Logged 1 task · 2 events · updated 1 field") is shown to the user.

### Day / Week / Month toggle
- **Day** — only the TODAY swimlane is shown across columns.
- **Week** — TODAY + THIS WEEK.
- **Month** — everything, including BACKLOG.

Implemented as a single client-side filter on the loaded task set; structured so future server-side aggregation can slot in.

---

## 4. Project structure

```
nussbaum-os/
├─ app/
│  ├─ page.tsx                  # auth-gated board
│  ├─ login/page.tsx            # magic-link sign-in
│  ├─ auth/callback/route.ts    # PKCE code exchange
│  ├─ api/capture/route.ts      # NL → tasks/events/daily (Claude)
│  └─ api/split/route.ts        # break a task into ≤1-pt parts (Claude)
├─ components/
│  ├─ Board.tsx                 # DnD + scope + signed-in shell
│  ├─ DomainColumn.tsx          # KPI strip + 3 lanes
│  ├─ KpiStrip.tsx
│  ├─ TaskCard.tsx
│  ├─ TaskDetail.tsx
│  ├─ MeScorecard.tsx
│  ├─ QuickCapture.tsx
│  ├─ ScopeToggle.tsx
│  └─ ui/                       # Button, Input, Checkbox, Dialog
├─ lib/
│  ├─ supabase/{client,server}.ts
│  ├─ anthropic.ts
│  ├─ queries.ts                # centralized Supabase queries
│  ├─ types.ts                  # Task, EventRow, DailyRow, Domain, ...
│  ├─ domains.ts
│  └─ utils.ts
├─ supabase/migrations/0001_init.sql
└─ middleware.ts                # refreshes Supabase session cookies
```

---

## 5. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel: **New Project** → import the repo → root directory `nussbaum-os/`.
3. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`).
4. Deploy.
5. Add `bemomfirst.com` as a custom domain → follow Vercel's DNS instructions.
6. In Supabase Auth, add `https://bemomfirst.com` to **Site URL** and `https://bemomfirst.com/auth/callback` to **Additional redirect URLs**.

---

## 6. Notes for future-me

- **Multi-user ready.** Every table has `user_id` defaulted to `auth.uid()` and RLS policies scoped to it. Building the rest of the product means adding teams/sharing on top of this.
- **No service-role usage on the client.** All write paths go through either an authenticated browser session or a Next.js route handler that uses the cookie-bound server client.
- **Optimistic updates everywhere.** Board interactions update local state first, then write to Supabase, with `reload()` as the fallback on failure.
- **Add real-time later** by subscribing to `tasks` / `daily` Supabase channels in `Board.tsx`.
