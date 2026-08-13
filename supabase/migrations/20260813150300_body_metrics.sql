-- ============================================================
-- 0004_body_metrics.sql
-- Progress tracking — weight, body fat %, visceral fat, and
-- body measurements. MANUAL ENTRY ONLY.
--
-- Design note: this table has no device_id, no source other than
-- 'manual' (enforced by the metric_source enum defined in 0001),
-- and no foreign key to any hardware/integration table. Smart
-- scales are a catalog product (public.products) the customer can
-- buy and use on their own — nothing here reads from a scale
-- automatically. If real device sync is ever built, it should
-- write into a *separate* table (e.g. device_metric_readings) and
-- that data should be reviewed/confirmed by the user before it
-- lands in this table, not merged in silently.
-- ============================================================

create table public.body_metrics (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  recorded_at         date not null default current_date,

  weight_kg           numeric(5,1) not null,
  body_fat_pct        numeric(4,1),          -- optional
  visceral_fat_rating int check (visceral_fat_rating between 1 and 59), -- optional

  waist_cm            numeric(5,1),
  chest_cm            numeric(5,1),
  arm_cm               numeric(5,1),
  thigh_cm             numeric(5,1),
  hip_cm               numeric(5,1),
  neck_cm              numeric(5,1),

  mood                 text,                  -- e.g. 'great' | 'good' | 'okay' | 'low'
  sleep_hours          numeric(3,1),
  energy_level         int check (energy_level between 1 and 5),
  water_intake_ml      int,

  source                metric_source not null default 'manual',
  notes                 text,
  created_at            timestamptz not null default now(),

  unique (user_id, recorded_at)   -- one manual entry per user per day
);

create index idx_body_metrics_user_date on public.body_metrics(user_id, recorded_at desc);

create table public.progress_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,       -- path inside the `progress-photos` Storage bucket
  taken_at    date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);

create index idx_progress_photos_user on public.progress_photos(user_id, taken_at desc);
