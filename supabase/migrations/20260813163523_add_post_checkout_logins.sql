-- ============================================================
-- 0014_post_checkout_logins.sql
-- Short-lived handoff: the Stripe webhook creates the account
-- server-side and stashes a one-time magic link here, keyed by
-- the checkout session id. The success page exchanges it for a
-- real browser session exactly once.
-- ============================================================

create table public.post_checkout_logins (
  stripe_checkout_session_id text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  magic_link  text not null,
  consumed    boolean not null default false,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 minutes'
);

alter table public.post_checkout_logins enable row level security;

create policy "post_checkout_logins_service_role_only"
  on public.post_checkout_logins for all
  using (false) with check (false);
