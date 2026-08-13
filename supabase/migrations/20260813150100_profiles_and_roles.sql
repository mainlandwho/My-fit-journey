-- ============================================================
-- 0002_profiles_and_roles.sql
-- Extends auth.users with the full onboarding questionnaire
-- ============================================================

create table public.profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  full_name                 text not null,
  email                     citext not null,

  -- Body & demographics
  age                       int check (age between 13 and 100),
  gender                    gender_option,
  height_cm                 numeric(5,1),
  starting_weight_kg        numeric(5,1),
  goal_weight_kg            numeric(5,1),
  body_fat_pct              numeric(4,1),           -- optional, manually entered at signup

  -- Training profile
  activity_level            activity_level default 'Moderately active',
  workout_experience        workout_experience default 'Beginner',
  preferred_workout_location workout_location default 'Both',
  workout_days_per_week     int default 4 check (workout_days_per_week between 2 and 6),

  -- Nutrition profile
  diet_preference            diet_preference default 'Standard',
  meals_per_day              int default 3 check (meals_per_day between 2 and 5),
  water_intake_goal_ml       int default 2000,
  food_allergies             text,
  foods_disliked             text,

  -- Health & goals
  occupation                 text,
  medical_conditions         text,
  current_medications        text,
  primary_goal                primary_goal not null default 'Weight Loss + Toning',
  target_date                 date,
  medical_disclaimer_agreed_at timestamptz,

  created_at                 timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per user. Populated from the onboarding questionnaire before checkout.';

create table public.user_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'customer',
  granted_at  timestamptz not null default now()
);

-- Helper used throughout RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('trainer', 'admin')
  );
$$;

-- Auto-create a profile + default role row whenever a new auth user signs up
-- (called from the checkout flow immediately after Stripe payment succeeds)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict do nothing;

  return new;
end;
$$;

-- Trigger is created after notification_preferences exists — see 0010.
