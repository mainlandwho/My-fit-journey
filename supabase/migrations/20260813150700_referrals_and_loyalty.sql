-- ============================================================
-- 0008_referrals_and_loyalty.sql
-- Every customer gets a referral code; points ledger for the
-- loyalty program.
-- ============================================================

create table public.referral_codes (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  code        citext not null unique,
  created_at  timestamptz not null default now()
);

create table public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references auth.users(id) on delete cascade,
  referred_user_id  uuid references auth.users(id) on delete set null,
  referral_code     citext not null,
  status            referral_status not null default 'pending',
  reward_type       reward_type,
  reward_value_cents int,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index idx_referrals_referrer on public.referrals(referrer_user_id);

-- Append-only ledger — current balance = sum(points)
create table public.loyalty_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  points      int not null,             -- positive = earned, negative = redeemed
  reason      text not null,            -- 'daily_login', 'workout_completion', 'redeem:free_week', ...
  created_at  timestamptz not null default now()
);

create index idx_loyalty_ledger_user on public.loyalty_ledger(user_id, created_at desc);

create view public.loyalty_balances as
select user_id, coalesce(sum(points), 0) as balance
from public.loyalty_ledger
group by user_id;

create table public.loyalty_rewards (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,           -- '10% off next plan', 'Free week', ...
  points_cost   int not null,
  is_active     boolean not null default true
);

create table public.loyalty_redemptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  reward_id     uuid not null references public.loyalty_rewards(id),
  points_spent  int not null,
  redeemed_at   timestamptz not null default now(),
  status        text not null default 'fulfilled'
);
