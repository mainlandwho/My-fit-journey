-- ============================================================
-- 0007_coaching.sql
-- AI Coach chat + Live Trainer (VIP upsell) assignments,
-- check-ins, and messaging.
-- ============================================================

create table public.ai_coach_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  sender      message_sender not null,     -- 'user' | 'ai'
  message     text not null,
  created_at  timestamptz not null default now()
);

create index idx_ai_coach_messages_user on public.ai_coach_messages(user_id, created_at);

-- Trainer profiles (staff, not customers)
create table public.trainers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users(id) on delete set null, -- trainer's login, if they have one
  full_name     text not null,
  bio           text,
  certification text,
  avatar_url    text,
  is_active     boolean not null default true
);

-- A client only gets an assignment after purchasing/upgrading to VIP Coaching
create table public.trainer_assignments (
  id              uuid primary key default gen_random_uuid(),
  client_user_id  uuid not null references auth.users(id) on delete cascade,
  trainer_id      uuid not null references public.trainers(id),
  status          text not null default 'active',  -- active | ended
  assigned_at     timestamptz not null default now(),
  ended_at        timestamptz,

  unique (client_user_id, trainer_id, assigned_at)
);

create table public.trainer_checkins (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.trainer_assignments(id) on delete cascade,
  scheduled_at    timestamptz not null,
  status          checkin_status not null default 'scheduled',
  notes           text
);

create table public.trainer_messages (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.trainer_assignments(id) on delete cascade,
  sender          message_sender not null,   -- 'user' | 'trainer'
  message         text not null,
  created_at      timestamptz not null default now()
);

create index idx_trainer_messages_assignment on public.trainer_messages(assignment_id, created_at);

comment on table public.trainer_assignments is
  'Created automatically (via edge function) the moment a user purchases or upgrades to the VIP Coaching tier.';
