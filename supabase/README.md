# My Fit Journey — Supabase schema

## Setup

```bash
supabase init            # if you haven't already
supabase link --project-ref <your-project-ref>
supabase db push          # applies all migrations in order
supabase db reset         # local dev: applies migrations + seed.sql
```

Migrations run in filename order (`0001_...` → `0011_...`). Each file is scoped to one part of the product so they're easy to review or roll back individually.

## Storage buckets to create in the Supabase dashboard

| Bucket             | Public | Used for                          |
|--------------------|--------|------------------------------------|
| `progress-photos`  | No     | `public.progress_photos.storage_path` |
| `product-images`   | Yes    | `public.products.image_url`        |

## Smart scale — manual entry only, by design

This is the important one, since it was an explicit requirement:

- `public.body_metrics.source` is typed as `metric_source`, an enum with **exactly one value: `'manual'`**. There is no `'device'` value to switch to later — a schema change would be required to add one, which is intentional friction.
- There is **no** `device_connections`, `scale_pairings`, `oauth_tokens`, or `sync_logs` table anywhere in this schema. Nothing here talks to Withings/Renpho/Eufy/Fitbit/Garmin APIs.
- The smart scale itself exists only as a row in `public.products` (`category = 'smart_scale'`, `is_shippable = true`) — it's a physical item customers buy and ship to their door, same as the protein powder or the gym towel. Purchasing it does not touch `body_metrics` at all.
- Weight, body fat %, and visceral fat all come from the customer typing numbers into the app (`POST` into `body_metrics` from the "Log entry" form). `visceral_fat_rating` is capped 1–59 to match how most consumer scales report it, purely as a UX hint for the input field — not because we read from one.

**If real device sync is ever added**, the recommended pattern is a *separate* `device_metric_readings` table that a user explicitly reviews and confirms before it's copied into `body_metrics`, rather than writing into `body_metrics` directly. That keeps every row in `body_metrics` an intentional, user-confirmed entry — useful for trust, and for any medical-disclaimer/liability posture around auto-logged health data.

## Schema map

| File | Covers |
|---|---|
| `0001_extensions_and_enums.sql` | pgcrypto, citext, all shared enum types |
| `0002_profiles_and_roles.sql` | Full onboarding questionnaire → `profiles`; `user_roles`; `is_admin()`/`is_trainer()` helpers |
| `0003_commerce.sql` | `membership_tiers`, `subscriptions`, `products` (incl. smart scale), `orders`, `coupons` |
| `0004_body_metrics.sql` | Manual-only weight/body fat/visceral fat/measurements, `progress_photos` |
| `0005_meal_engine.sql` | `meal_plans` → `meals` → `meal_ingredients` (with real gram/ml amounts), `shopping_list_items` |
| `0006_workout_engine.sql` | `workout_plans` → `workout_days` → `workout_exercises` (sets/reps) + `cardio_sessions`, `exercise_library`, `workout_logs` |
| `0007_coaching.sql` | `ai_coach_messages`, `trainers`, `trainer_assignments`, `trainer_checkins`, `trainer_messages` |
| `0008_referrals_and_loyalty.sql` | `referral_codes`, `referrals`, `loyalty_ledger`, `loyalty_rewards`, `loyalty_redemptions` |
| `0009_notifications_and_achievements.sql` | `notification_preferences`, `achievements`, `user_streaks`, and the `handle_new_user` trigger |
| `0010_row_level_security.sql` | RLS on every table — owner-only by default, admin bypass via `is_admin()` |
| `0011_functions_and_triggers.sql` | Referral code generation, atomic loyalty redemption RPC, streak tracking |

## Access model

- **Customers** can only read/write rows where `user_id = auth.uid()` (or via a join back to one of their own rows, e.g. `meals` through `meal_plans`).
- **Trainers** can read/write messages and check-ins only for clients in `trainer_assignments` where they're the assigned trainer.
- **Admins** (`user_roles.role = 'admin'`) bypass RLS reads everywhere via `is_admin()`, for the admin dashboard.

## What's not built yet

- The Next.js API routes / edge functions that call this schema (checkout → `handle_new_user`, Stripe webhook → `subscriptions`, meal/workout generation writing into `meal_plans`/`workout_plans`).
- Admin dashboard queries.
- The `generate-shopping-list` edge function referenced in a comment in `0005_meal_engine.sql`.

Happy to build any of those next.
