-- ============================================================
-- 0005_meal_engine.sql
-- Daily meal plans, meals, and ingredients with real measurements
-- (grams/ml/tbsp etc.) so meals are actually cookable, plus a
-- derived shopping list.
-- ============================================================

create table public.meal_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  plan_date         date not null,
  calorie_target    int not null,
  protein_target_g  int not null,
  carb_target_g     int not null,
  fat_target_g      int not null,
  generated_at      timestamptz not null default now(),

  unique (user_id, plan_date)
);

create table public.meals (
  id            uuid primary key default gen_random_uuid(),
  meal_plan_id  uuid not null references public.meal_plans(id) on delete cascade,
  meal_type     meal_type not null,
  name          text not null,
  calories      int not null,
  protein_g     numeric(5,1) not null,
  carbs_g       numeric(5,1) not null,
  fat_g         numeric(5,1) not null,
  fiber_g       numeric(5,1),
  recipe_instructions text,
  prep_tips     text,
  is_completed  boolean not null default false,
  sort_order    int not null default 0
);

create index idx_meals_plan on public.meals(meal_plan_id);

-- Every ingredient carries a real quantity — this is what lets the
-- app show "150 g grilled chicken breast" instead of just a meal name.
create table public.meal_ingredients (
  id              uuid primary key default gen_random_uuid(),
  meal_id         uuid not null references public.meals(id) on delete cascade,
  name            text not null,
  amount_value    numeric(7,2) not null,
  amount_unit     measurement_unit not null,
  display_amount  text not null,     -- e.g. "1 tbsp (15 g)" — what the UI renders
  sort_order      int not null default 0
);

create index idx_meal_ingredients_meal on public.meal_ingredients(meal_id);

-- Aggregated, checkable shopping list per user per week.
-- Populated by an edge function / trigger that rolls up meal_ingredients
-- across the week's meal_plans (see /supabase/functions/generate-shopping-list).
create table public.shopping_list_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  week_start    date not null,
  ingredient_name text not null,
  total_amount  numeric(7,2),
  amount_unit   measurement_unit,
  display_amount text not null,
  is_checked    boolean not null default false,

  unique (user_id, week_start, ingredient_name)
);

create index idx_shopping_list_user_week on public.shopping_list_items(user_id, week_start);
