-- Nussbaum OS — categories, exercise split, business KPIs

-- ---------- tasks: category (Build / Sell / Admin) ----------
alter table public.tasks
  add column if not exists category text
  check (category in ('build','sell','admin'));

create index if not exists tasks_user_cat_idx on public.tasks(user_id, category);

-- ---------- daily: split exercise into steps + resistance ----------
alter table public.daily add column if not exists steps int not null default 0;
alter table public.daily add column if not exists resistance boolean not null default false;

-- ---------- business KPIs (per domain per day) ----------
create table if not exists public.business_kpis (
  user_id   uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  date      date    not null default (now() at time zone 'utc')::date,
  domain    text    not null check (domain in ('Capacera','Praxemy','LYMP')),
  customers int     not null default 0,
  revenue   numeric not null default 0,
  notes     text,
  updated_at timestamptz not null default now(),
  primary key (user_id, date, domain)
);

create index if not exists business_kpis_user_date_idx on public.business_kpis(user_id, date);

alter table public.business_kpis enable row level security;

drop policy if exists "business_kpis_owner" on public.business_kpis;
create policy "business_kpis_owner" on public.business_kpis
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
