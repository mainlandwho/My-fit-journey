-- ============================================================
-- 0009_notifications_and_achievements.sql
-- Notification toggles, achievements/streaks, and the trigger
-- that provisions a new user's rows (deferred from 0002 since it
-- depends on this table existing).
-- ============================================================

create table public.notification_preferences (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  water_reminders         boolean not null default true,
  meal_reminders          boolean not null default true,
  workout_reminders       boolean not null default true,
  weekly_weigh_in         boolean not null default true,
  motivational_messages   boolean not null default true,
  vip_trainer_messages    boolean not null default false,  -- only meaningful on VIP tier
  updated_at              timestamptz not null default now()
);

create table public.achievements (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,     -- 'streak_7', 'first_5lbs', 'first_progress_photo'
  title         text not null,
  description   text,
  icon          text
);

create table public.user_achievements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  achievement_id  uuid not null references public.achievements(id),
  earned_at       timestamptz not null default now(),

  unique (user_id, achievement_id)
);

create table public.user_streaks (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  current_streak    int not null default 0,
  longest_streak    int not null default 0,
  last_active_date  date
);

-- Now that notification_preferences exists, wire up the trigger from 0002
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
