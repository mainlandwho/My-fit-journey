-- ============================================================
-- 0001_extensions_and_enums.sql
-- My Fit Journey — base extensions and shared enum types
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive email/text

-- ---------- Roles & access ----------
create type user_role as enum ('customer', 'trainer', 'admin');

-- ---------- Onboarding / profile enums ----------
create type primary_goal as enum ('Weight Loss', 'Weight Loss + Toning', 'Muscle Building');
create type workout_location as enum ('Home', 'Gym', 'Both');
create type workout_experience as enum ('Beginner', 'Intermediate', 'Advanced');
create type activity_level as enum ('Sedentary', 'Lightly active', 'Moderately active', 'Very active');
create type diet_preference as enum ('Standard', 'Vegetarian', 'Vegan', 'Keto', 'Low Carb', 'Mediterranean');
create type gender_option as enum ('Female', 'Male', 'Other', 'Prefer not to say');

-- ---------- Commerce ----------
create type membership_tier_name as enum ('Starter', 'Complete', 'VIP Coaching');
create type subscription_status as enum ('active', 'expired', 'cancelled', 'refunded');
create type order_status as enum ('pending', 'paid', 'fulfilled', 'refunded', 'cancelled');
create type product_category as enum ('smart_scale', 'recipe_book', 'workout_program', 'supplement', 'merchandise', 'membership');

-- ---------- Meal engine ----------
create type meal_type as enum ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'dessert');
create type measurement_unit as enum ('g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'item');

-- ---------- Workout engine ----------
create type exercise_kind as enum ('compound', 'accessory', 'core', 'cardio');

-- ---------- Body metrics ----------
-- IMPORTANT: 'manual' is intentionally the ONLY value.
-- Smart scales are sold as a physical product (see product_category above)
-- and are NOT integrated for automatic sync in this schema. All weight,
-- body fat %, and visceral fat entries come from the customer typing them
-- into the app. See migration 0004 for the full rationale.
create type metric_source as enum ('manual');

-- ---------- Coaching ----------
create type message_sender as enum ('user', 'ai', 'trainer');
create type checkin_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

-- ---------- Referrals & loyalty ----------
create type referral_status as enum ('pending', 'completed', 'rewarded');
create type reward_type as enum ('free_week', 'store_credit', 'discount_coupon');
