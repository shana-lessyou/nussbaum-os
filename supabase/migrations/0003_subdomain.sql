-- Nussbaum OS — agent ingestion support
-- Adds an optional subdomain on tasks (used for Personal/{home,boys,me} routing
-- and, later, business project slugs).

alter table public.tasks
  add column if not exists subdomain text;

create index if not exists tasks_user_subdomain_idx
  on public.tasks(user_id, subdomain) where subdomain is not null;
