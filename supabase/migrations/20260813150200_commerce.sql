-- ============================================================
-- 0003_commerce.sql
-- Membership tiers, purchases/subscriptions, and the secondary
-- revenue product catalog (smart scales, recipe books, etc.)
-- ============================================================

create table public.membership_tiers (
  id              uuid primary key default gen_random_uuid(),
  name            membership_tier_name not null unique,
  duration_days   int not null,
  price_cents     int not null,
  stripe_price_id text,                -- Stripe Price ID for this tier
  features        jsonb not null default '[]'::jsonb,
  is_active       boolean not null default true,
  sort_order      int not null default 0
);

comment on table public.membership_tiers is
  'Starter / Complete / VIP Coaching. Seeded in seed.sql.';

create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  tier_id               uuid not null references public.membership_tiers(id),
  status                subscription_status not null default 'active',
  stripe_customer_id    text,
  stripe_payment_intent_id text,       -- these plans are billed once, not recurring
  amount_cents          int not null,
  starts_at             timestamptz not null default now(),
  ends_at               timestamptz not null,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now()
);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- One convenience view: each user's current active tier
create view public.current_membership as
select distinct on (s.user_id)
  s.user_id, t.name as tier_name, s.status, s.starts_at, s.ends_at
from public.subscriptions s
join public.membership_tiers t on t.id = s.tier_id
where s.status = 'active'
order by s.user_id, s.starts_at desc;

-- ------------------------------------------------------------
-- Secondary revenue: physical/digital products
-- The smart scale is sold here strictly as a SHIPPABLE PRODUCT.
-- There is deliberately no device_connections / oauth_tokens /
-- sync_logs table anywhere in this schema. Purchasing a scale
-- does not unlock any automated data path — customers keep
-- entering weight, body fat %, and visceral fat by hand in
-- public.body_metrics (see 0004).
-- ------------------------------------------------------------
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  category      product_category not null,
  name          text not null,
  description   text,
  price_cents   int not null,
  stripe_price_id text,
  image_url     text,
  is_shippable  boolean not null default false,   -- true for smart_scale / merchandise
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  status          order_status not null default 'pending',
  stripe_payment_intent_id text,
  subtotal_cents  int not null,
  shipping_address jsonb,               -- null for non-shippable products
  created_at      timestamptz not null default now()
);

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  quantity    int not null default 1,
  unit_price_cents int not null
);

create table public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            citext not null unique,
  percent_off     int check (percent_off between 1 and 100),
  amount_off_cents int,
  stripe_coupon_id text,
  max_redemptions int,
  redeemed_count  int not null default 0,
  expires_at      timestamptz,
  is_active       boolean not null default true
);
