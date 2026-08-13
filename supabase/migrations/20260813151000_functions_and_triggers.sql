-- ============================================================
-- 0011_functions_and_triggers.sql
-- Supporting business logic that's safer to run in the database
-- than trust to the client.
-- ============================================================

-- ---------- Auto-generate a referral code for every new profile ----------
create or replace function public.generate_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(regexp_replace(new.full_name, '[^a-zA-Z]', '', 'g'), 1, 5))
                 || floor(random() * 900 + 100)::int;
    exit when not exists (select 1 from public.referral_codes where code = candidate);
  end loop;

  insert into public.referral_codes (user_id, code) values (new.id, candidate);
  return new;
end;
$$;

drop trigger if exists on_profile_created_referral_code on public.profiles;
create trigger on_profile_created_referral_code
  after insert on public.profiles
  for each row execute function public.generate_referral_code();

-- ---------- Safe, atomic loyalty redemption ----------
-- Call via RPC: select redeem_loyalty_reward('<reward_id>');
create or replace function public.redeem_loyalty_reward(p_reward_id uuid)
returns public.loyalty_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost    int;
  v_balance int;
  v_row     public.loyalty_redemptions;
begin
  select points_cost into v_cost from public.loyalty_rewards where id = p_reward_id and is_active;
  if v_cost is null then
    raise exception 'Reward not found or inactive';
  end if;

  select coalesce(sum(points), 0) into v_balance from public.loyalty_ledger where user_id = auth.uid();
  if v_balance < v_cost then
    raise exception 'Insufficient points: have %, need %', v_balance, v_cost;
  end if;

  insert into public.loyalty_ledger (user_id, points, reason)
  values (auth.uid(), -v_cost, 'redeem:' || p_reward_id);

  insert into public.loyalty_redemptions (user_id, reward_id, points_spent)
  values (auth.uid(), p_reward_id, v_cost)
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------- Streak tracking ----------
-- Bump the user's streak whenever they log a workout or a body-metrics entry.
create or replace function public.touch_user_streak()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_last  date;
begin
  insert into public.user_streaks (user_id, current_streak, longest_streak, last_active_date)
  values (new.user_id, 1, 1, v_today)
  on conflict (user_id) do update
    set current_streak = case
          when public.user_streaks.last_active_date = v_today then public.user_streaks.current_streak
          when public.user_streaks.last_active_date = v_today - 1 then public.user_streaks.current_streak + 1
          else 1
        end,
        longest_streak = greatest(
          public.user_streaks.longest_streak,
          case
            when public.user_streaks.last_active_date = v_today - 1 then public.user_streaks.current_streak + 1
            else 1
          end
        ),
        last_active_date = v_today;
  return new;
end;
$$;

drop trigger if exists on_workout_log_streak on public.workout_logs;
create trigger on_workout_log_streak
  after insert on public.workout_logs
  for each row execute function public.touch_user_streak();

drop trigger if exists on_body_metric_streak on public.body_metrics;
create trigger on_body_metric_streak
  after insert on public.body_metrics
  for each row execute function public.touch_user_streak();
