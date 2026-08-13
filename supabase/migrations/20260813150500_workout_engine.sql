-- ============================================================
-- 0006_workout_engine.sql
-- Weekly workout plans generated from level + days/week + location,
-- with per-exercise sets/reps and a cardio component on every
-- training day.
-- ============================================================

-- Master exercise library — the pool the generator draws from
create table public.exercise_library (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          exercise_kind not null,        -- compound / accessory / core / cardio
  muscle_group  text,
  equipment     text,                           -- e.g. 'bodyweight', 'dumbbell', 'machine'
  video_url     text,
  is_active     boolean not null default true
);

-- Generated once per user (regenerated if they change level/days/goal)
create table public.workout_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  level           workout_experience not null,
  days_per_week   int not null check (days_per_week between 2 and 6),
  location        workout_location not null,
  goal            primary_goal not null,
  generated_at    timestamptz not null default now(),
  is_current      boolean not null default true
);

create index idx_workout_plans_user_current on public.workout_plans(user_id) where is_current;

create table public.workout_days (
  id              uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  weekday         int not null check (weekday between 0 and 6),  -- 0 = Monday
  is_rest         boolean not null default false,
  focus           text,                          -- 'Push', 'Upper Body', 'Full Body A', etc.
  duration_minutes int,
  recovery_note   text                            -- shown on rest days
);

create table public.workout_exercises (
  id              uuid primary key default gen_random_uuid(),
  workout_day_id  uuid not null references public.workout_days(id) on delete cascade,
  exercise_id     uuid references public.exercise_library(id),
  name            text not null,                  -- denormalized for fast reads
  kind            exercise_kind not null,
  sets            int not null,
  reps            text not null,                  -- '3 x 10', '3 x 30 sec', etc.
  sort_order      int not null default 0
);

-- Cardio finisher attached to a training day (scales by goal, not just level)
create table public.cardio_sessions (
  id              uuid primary key default gen_random_uuid(),
  workout_day_id  uuid not null references public.workout_days(id) on delete cascade,
  duration_text   text not null,       -- '12–15 min'
  detail          text not null        -- 'Steady-state cardio — bike, walk, or rower...'
);

create table public.workout_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  workout_day_id  uuid references public.workout_days(id),
  completed_at    timestamptz not null default now(),
  notes           text
);

create index idx_workout_logs_user on public.workout_logs(user_id, completed_at desc);
