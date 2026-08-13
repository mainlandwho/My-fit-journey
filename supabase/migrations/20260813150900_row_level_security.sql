-- ============================================================
-- 0010_row_level_security.sql
-- Enable RLS everywhere. Default posture: a user can only see
-- and write their own rows. Admins (public.is_admin()) can read
-- everything for the admin dashboard. Trainers can read/write
-- only the threads of clients assigned to them.
-- ============================================================

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------- user_roles ----------
alter table public.user_roles enable row level security;

create policy "roles_select_own_or_admin"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "roles_admin_write"
  on public.user_roles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- membership_tiers / products / coupons (public catalog) ----------
alter table public.membership_tiers enable row level security;
create policy "tiers_public_read" on public.membership_tiers for select using (is_active or public.is_admin());
create policy "tiers_admin_write" on public.membership_tiers for all using (public.is_admin()) with check (public.is_admin());

alter table public.products enable row level security;
create policy "products_public_read" on public.products for select using (is_active or public.is_admin());
create policy "products_admin_write" on public.products for all using (public.is_admin()) with check (public.is_admin());

alter table public.coupons enable row level security;
create policy "coupons_admin_only" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- ---------- subscriptions / orders / order_items ----------
alter table public.subscriptions enable row level security;
create policy "subs_select_own_or_admin" on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());
create policy "subs_admin_write" on public.subscriptions for insert with check (public.is_admin() or auth.uid() = user_id);
create policy "subs_admin_update" on public.subscriptions for update using (public.is_admin());

alter table public.orders enable row level security;
create policy "orders_select_own_or_admin" on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_admin_update" on public.orders for update using (public.is_admin());

alter table public.order_items enable row level security;
create policy "order_items_via_order" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- ---------- body_metrics / progress_photos (strictly private) ----------
alter table public.body_metrics enable row level security;
create policy "metrics_owner_all" on public.body_metrics for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

alter table public.progress_photos enable row level security;
create policy "photos_owner_all" on public.progress_photos for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ---------- meal engine ----------
alter table public.meal_plans enable row level security;
create policy "meal_plans_owner_all" on public.meal_plans for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

alter table public.meals enable row level security;
create policy "meals_via_plan" on public.meals for all
  using (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and (p.user_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()));

alter table public.meal_ingredients enable row level security;
create policy "ingredients_via_meal" on public.meal_ingredients for all
  using (exists (
    select 1 from public.meals m join public.meal_plans p on p.id = m.meal_plan_id
    where m.id = meal_id and (p.user_id = auth.uid() or public.is_admin())
  ));

alter table public.shopping_list_items enable row level security;
create policy "shopping_list_owner_all" on public.shopping_list_items for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ---------- workout engine ----------
alter table public.exercise_library enable row level security;
create policy "exercise_library_public_read" on public.exercise_library for select using (true);
create policy "exercise_library_admin_write" on public.exercise_library for all using (public.is_admin()) with check (public.is_admin());

alter table public.workout_plans enable row level security;
create policy "workout_plans_owner_all" on public.workout_plans for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

alter table public.workout_days enable row level security;
create policy "workout_days_via_plan" on public.workout_days for all
  using (exists (select 1 from public.workout_plans wp where wp.id = workout_plan_id and (wp.user_id = auth.uid() or public.is_admin())));

alter table public.workout_exercises enable row level security;
create policy "workout_exercises_via_day" on public.workout_exercises for all
  using (exists (
    select 1 from public.workout_days d join public.workout_plans wp on wp.id = d.workout_plan_id
    where d.id = workout_day_id and (wp.user_id = auth.uid() or public.is_admin())
  ));

alter table public.cardio_sessions enable row level security;
create policy "cardio_via_day" on public.cardio_sessions for all
  using (exists (
    select 1 from public.workout_days d join public.workout_plans wp on wp.id = d.workout_plan_id
    where d.id = workout_day_id and (wp.user_id = auth.uid() or public.is_admin())
  ));

alter table public.workout_logs enable row level security;
create policy "workout_logs_owner_all" on public.workout_logs for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ---------- coaching ----------
alter table public.ai_coach_messages enable row level security;
create policy "ai_messages_owner_all" on public.ai_coach_messages for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

alter table public.trainers enable row level security;
create policy "trainers_public_read" on public.trainers for select using (is_active or public.is_admin());
create policy "trainers_admin_write" on public.trainers for all using (public.is_admin()) with check (public.is_admin());

alter table public.trainer_assignments enable row level security;
create policy "assignments_visible_to_client_trainer_admin" on public.trainer_assignments for select
  using (
    client_user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.trainers t where t.id = trainer_id and t.user_id = auth.uid())
  );
create policy "assignments_admin_write" on public.trainer_assignments for insert with check (public.is_admin());

alter table public.trainer_checkins enable row level security;
create policy "checkins_visible_to_participants" on public.trainer_checkins for select
  using (exists (
    select 1 from public.trainer_assignments a
    left join public.trainers t on t.id = a.trainer_id
    where a.id = assignment_id
      and (a.client_user_id = auth.uid() or t.user_id = auth.uid() or public.is_admin())
  ));

alter table public.trainer_messages enable row level security;
create policy "trainer_messages_visible_to_participants" on public.trainer_messages for all
  using (exists (
    select 1 from public.trainer_assignments a
    left join public.trainers t on t.id = a.trainer_id
    where a.id = assignment_id
      and (a.client_user_id = auth.uid() or t.user_id = auth.uid() or public.is_admin())
  ));

-- ---------- referrals & loyalty ----------
alter table public.referral_codes enable row level security;
create policy "referral_codes_owner_read" on public.referral_codes for select using (auth.uid() = user_id or public.is_admin());
create policy "referral_codes_owner_insert" on public.referral_codes for insert with check (auth.uid() = user_id);

alter table public.referrals enable row level security;
create policy "referrals_owner_or_admin" on public.referrals for select
  using (referrer_user_id = auth.uid() or referred_user_id = auth.uid() or public.is_admin());

alter table public.loyalty_ledger enable row level security;
create policy "loyalty_ledger_owner_read" on public.loyalty_ledger for select using (auth.uid() = user_id or public.is_admin());
create policy "loyalty_ledger_admin_write" on public.loyalty_ledger for insert with check (public.is_admin());

alter table public.loyalty_rewards enable row level security;
create policy "loyalty_rewards_public_read" on public.loyalty_rewards for select using (is_active or public.is_admin());

alter table public.loyalty_redemptions enable row level security;
create policy "loyalty_redemptions_owner_all" on public.loyalty_redemptions for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ---------- notifications / achievements ----------
alter table public.notification_preferences enable row level security;
create policy "notif_prefs_owner_all" on public.notification_preferences for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

alter table public.achievements enable row level security;
create policy "achievements_public_read" on public.achievements for select using (true);

alter table public.user_achievements enable row level security;
create policy "user_achievements_owner_read" on public.user_achievements for select using (auth.uid() = user_id or public.is_admin());

alter table public.user_streaks enable row level security;
create policy "user_streaks_owner_all" on public.user_streaks for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);
