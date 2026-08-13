-- ============================================================
-- 0013_pwa_install_events.sql
-- Funnel tracking for the Add to Home Screen banner.
-- Feeds the admin analytics dashboard.
-- ============================================================

create type pwa_platform as enum ('android', 'ios', 'other');
create type pwa_event_type as enum ('banner_shown', 'install_accepted', 'banner_dismissed');

create table public.pwa_install_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,  -- nullable: banner can show before login
  platform    pwa_platform not null,
  event_type  pwa_event_type not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

comment on table public.pwa_install_events is
  'Funnel tracking for the Add to Home Screen banner. Feeds the admin analytics dashboard.';

create index idx_pwa_events_type_platform on public.pwa_install_events(event_type, platform, created_at desc);

-- Convenience rollup for the admin dashboard
create view public.pwa_install_funnel as
select platform, event_type, count(*) as event_count,
       date_trunc('day', created_at) as day
from public.pwa_install_events
group by platform, event_type, date_trunc('day', created_at)
order by day desc;

alter table public.pwa_install_events enable row level security;

-- Anyone (even logged-out visitors) can log an install event — it's anonymous
-- funnel telemetry, not sensitive data.
create policy "pwa_events_anyone_can_insert"
  on public.pwa_install_events for insert
  with check (true);

-- Only admins can read the raw events or the funnel rollup
create policy "pwa_events_admin_read"
  on public.pwa_install_events for select
  using (public.is_admin());
