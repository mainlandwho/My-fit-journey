-- ============================================================
-- 0012_pending_signups.sql
-- Per the spec: "After payment → automatically create account →
-- automatically log in." So onboarding answers are captured
-- BEFORE an auth.users row exists, held here, and consumed by
-- the Stripe webhook the moment payment succeeds.
-- ============================================================

create table public.pending_signups (
  id              uuid primary key default gen_random_uuid(),
  email           citext not null,
  onboarding_data jsonb not null,     -- raw answers from the onboarding wizard
  tier_id         uuid not null references public.membership_tiers(id),
  coupon_code     citext,
  referral_code   citext,             -- code of whoever referred them, if any
  stripe_checkout_session_id text,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '2 hours'
);

comment on table public.pending_signups is
  'Short-lived holding table. Row is deleted by the Stripe webhook once the account is created. A cron/edge function should purge rows past expires_at.';

-- Service-role only — never exposed to anon/authenticated clients
alter table public.pending_signups enable row level security;
create policy "pending_signups_service_role_only"
  on public.pending_signups for all
  using (false) with check (false);
