-- ============================================================
-- seed.sql — reference/catalog data
-- Run after all migrations: supabase db reset (applies + seeds)
-- ============================================================

-- ---------- Membership tiers ----------
insert into public.membership_tiers (name, duration_days, price_cents, features, sort_order) values
('Starter', 14, 2900,
  '["Personalized meal plan","Shopping lists","Daily recipes","Nutrition guide","Progress tracking"]', 1),
('Complete', 28, 5900,
  '["Everything in Starter","Weekly progress reviews","Additional recipes","Habit tracker","Motivation challenges","Completion certificate"]', 2),
('VIP Coaching', 28, 14900,
  '["Everything in Complete","Weekly trainer check-in","1:1 progress reviews","Trainer messaging","Priority support","VIP badge"]', 3);

-- ---------- Product catalog (secondary revenue) ----------
-- The smart scale is a SHIPPABLE PHYSICAL PRODUCT ONLY.
-- Buying it does not create any device link, token, or sync job —
-- customers still log weight/body fat/visceral fat by hand.
insert into public.products (category, name, description, price_cents, is_shippable) values
('smart_scale', 'My Fit Journey Smart Scale',
  'Bluetooth body composition scale. Ships to your door — readings are entered manually in the app, there is no automatic sync.',
  4900, true),
('recipe_book', 'High-Protein Recipe Book Vol. 1', '30 high-protein recipes with full macros and shopping lists.', 1200, false),
('workout_program', '6-Week Strength Program (PDF)', 'Standalone progressive strength program for advanced lifters.', 1900, false),
('supplement', 'Whey Protein Isolate — Vanilla', '2 lb tub, 25g protein per scoop.', 3400, true),
('merchandise', 'My Fit Journey Gym Towel', 'Premium quick-dry towel with embroidered logo.', 1500, true);

-- ---------- Exercise library ----------
insert into public.exercise_library (name, kind, muscle_group, equipment) values
('Bodyweight squats', 'compound', 'legs', 'bodyweight'),
('Push-ups', 'compound', 'chest', 'bodyweight'),
('Bent-over rows', 'compound', 'back', 'dumbbell'),
('Plank', 'core', 'core', 'bodyweight'),
('Romanian deadlifts', 'compound', 'hamstrings', 'barbell'),
('Overhead press', 'compound', 'shoulders', 'dumbbell'),
('Lat pulldown', 'accessory', 'back', 'machine'),
('Bicycle crunches', 'core', 'core', 'bodyweight'),
('Walking lunges', 'accessory', 'legs', 'dumbbell'),
('Incline push-ups', 'accessory', 'chest', 'bodyweight'),
('Seated cable rows', 'accessory', 'back', 'machine'),
('Side plank', 'core', 'core', 'bodyweight'),
('Bench press or push-ups', 'compound', 'chest', 'barbell'),
('Shoulder press', 'accessory', 'shoulders', 'dumbbell'),
('Bicep curls', 'accessory', 'arms', 'dumbbell'),
('Tricep dips', 'accessory', 'arms', 'bodyweight'),
('Back squats', 'compound', 'legs', 'barbell'),
('Standing calf raises', 'accessory', 'calves', 'bodyweight'),
('Leg press', 'compound', 'legs', 'machine'),
('Leg curls', 'accessory', 'hamstrings', 'machine'),
('Deadlifts', 'compound', 'back', 'barbell'),
('Face pulls', 'accessory', 'shoulders', 'cable'),
('Incline dumbbell press', 'accessory', 'chest', 'dumbbell'),
('Tricep pushdown', 'accessory', 'arms', 'cable'),
('Lateral raises', 'accessory', 'shoulders', 'dumbbell');

-- ---------- Achievements ----------
insert into public.achievements (code, title, description, icon) values
('streak_7', '7-Day Streak', 'Logged in and stayed active for 7 days in a row.', 'trophy'),
('first_5lbs', 'First 5 lbs', 'Lost your first 5 lbs.', 'star'),
('first_photo', 'Progress Photo', 'Uploaded your first progress photo.', 'camera'),
('first_workout', 'First Workout', 'Completed your first workout.', 'dumbbell'),
('streak_30', '30-Day Streak', 'A full month of consistency.', 'flame');

-- ---------- Loyalty rewards ----------
insert into public.loyalty_rewards (name, points_cost) values
('10% off next plan', 200),
('Exclusive recipe pack', 150),
('Free week', 500),
('VIP Coaching upgrade', 800);
