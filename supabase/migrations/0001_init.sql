-- Nussbaum OS — initial schema
-- Tables: tasks, events, daily
-- View:   daily_with_rollups
-- RLS:    owner-scoped via auth.uid()

create extension if not exists "pgcrypto";

-- ---------- tasks ----------
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  domain       text not null check (domain in ('Capacera','Praxemy','LYMP','Home','Boys','Me')),
  title        text not null,
  notes        text,
  swimlane     text not null default 'backlog' check (swimlane in ('today','this-week','backlog')),
  points       int  not null default 1 check (points >= 0),
  method       text not null default 'comp' check (method in ('phys','phone','comp','hands-free')),
  status       text not null default 'open' check (status in ('open','done')),
  position     int  not null default 0,
  created_by   text not null default 'Shana',
  created_at   timestamptz not null default now(),
  done_at      timestamptz
);

create index if not exists tasks_user_idx        on public.tasks(user_id);
create index if not exists tasks_user_lane_idx   on public.tasks(user_id, swimlane, status);
create index if not exists tasks_user_domain_idx on public.tasks(user_id, domain);

-- ---------- events ----------
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date       date not null default (now() at time zone 'utc')::date,
  type       text not null check (type in ('meal','purchase')),
  entry      text not null,
  value      numeric not null default 0,
  unit       text not null check (unit in ('kcal','USD','g')),
  logged_at  timestamptz not null default now(),
  source     text not null default 'manual'
);

create index if not exists events_user_date_idx on public.events(user_id, date);
create index if not exists events_user_type_idx on public.events(user_id, type, date);

-- ---------- daily ----------
create table if not exists public.daily (
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date                 date not null default (now() at time zone 'utc')::date,
  savers_silence       boolean not null default false,
  savers_affirmation   boolean not null default false,
  savers_visualization boolean not null default false,
  savers_exercise      boolean not null default false,
  savers_read          boolean not null default false,
  savers_scribe        boolean not null default false,
  water                int     not null default 0,
  supplements          boolean not null default false,
  sleep_hrs            numeric,
  exercise             text,
  protein_g            numeric,
  carbs_g              numeric,
  fat_g                numeric,
  notes                text,
  primary key (user_id, date)
);

-- ---------- rollup view ----------
create or replace view public.daily_with_rollups as
select
  d.*,
  coalesce(meals.total_kcal, 0)   as calories_total,
  coalesce(spend.total_usd, 0)    as spending_total
from public.daily d
left join (
  select user_id, date, sum(value) as total_kcal
  from public.events
  where type = 'meal' and unit = 'kcal'
  group by user_id, date
) meals on meals.user_id = d.user_id and meals.date = d.date
left join (
  select user_id, date, sum(value) as total_usd
  from public.events
  where type = 'purchase' and unit = 'USD'
  group by user_id, date
) spend on spend.user_id = d.user_id and spend.date = d.date;

-- ---------- RLS ----------
alter table public.tasks  enable row level security;
alter table public.events enable row level security;
alter table public.daily  enable row level security;

drop policy if exists "tasks_owner"  on public.tasks;
drop policy if exists "events_owner" on public.events;
drop policy if exists "daily_owner"  on public.daily;

create policy "tasks_owner"  on public.tasks  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events_owner" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_owner"  on public.daily  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- view inherits RLS from underlying tables via security_invoker
alter view public.daily_with_rollups set (security_invoker = true);
