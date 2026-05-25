-- Nussbaum OS — collapse Me/Home/Boys into Personal with subdomain
-- After this migration:
--   * domain values: Capacera | Praxemy | LYMP | Personal
--   * Personal tasks carry subdomain in {me, home, boys}
--   * Old Me/Home/Boys rows backfilled to Personal + subdomain

-- 1. Expand check constraint to allow Personal (keep old values during transition).
alter table public.tasks drop constraint if exists tasks_domain_check;
alter table public.tasks add  constraint tasks_domain_check
  check (domain in ('Capacera','Praxemy','LYMP','Personal','Home','Boys','Me'));

-- 2. Backfill existing personal-ish rows.
update public.tasks
   set subdomain = lower(domain),
       domain   = 'Personal'
 where domain in ('Me','Home','Boys');
