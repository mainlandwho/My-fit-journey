# My Fit Journey — app layer

This wires the frontend prototype to the `supabase/` schema. It implements the
purchase flow exactly as specified: **complete onboarding → pay → account is
created and logged in automatically → dashboard is already populated.**

## Flow

```
Onboarding wizard (client)
   │  POST /api/onboarding  { email, tierName, onboardingData }
   ▼
pending_signups row created (no auth user yet)
   │  POST /api/checkout  { pendingSignupId }
   ▼
Stripe Checkout Session (metadata.pending_signup_id)
   │  customer pays with card / Apple Pay / Google Pay
   ▼
Stripe → POST /api/stripe/webhook  (checkout.session.completed)
   ├─ supabase.auth.admin.createUser()        → fires on_auth_user_created trigger
   │     (creates profiles / user_roles / notification_preferences / referral_codes)
   ├─ profiles updated with full onboarding answers
   ├─ subscriptions row inserted
   ├─ referral resolved + loyalty points awarded, if applicable
   ├─ VIP Coaching → trainer_assignments row created
   ├─ generateMealPlan()     → meal_plans / meals / meal_ingredients
   ├─ generateWorkoutPlan()  → workout_plans / workout_days / workout_exercises / cardio_sessions
   ├─ magic link generated for instant client-side login
   └─ pending_signups row deleted
```

## Setup

```bash
cp .env.example .env.local     # fill in Supabase + Stripe keys
npm install
npm run dev
```

Point Stripe's webhook (locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
at `/api/stripe/webhook`, and set `STRIPE_WEBHOOK_SECRET` from its output.

Deploy the shopping-list function separately:
```bash
supabase functions deploy generate-shopping-list
```

## Files

| Path | Purpose |
|---|---|
| `lib/supabase/client.ts` | Browser Supabase client (RLS-respecting) |
| `lib/supabase/server.ts` | Server Component / Route Handler client (RLS-respecting) |
| `lib/supabase/admin.ts` | Service-role client — **server-only**, bypasses RLS |
| `lib/calorie-calc.ts` | Mifflin-St Jeor BMR → TDEE → calorie target → macro split |
| `lib/meal-generator.ts` | Builds a day's `meal_plans`/`meals`/`meal_ingredients`, scaled to the user's target |
| `lib/workout-generator.ts` | Server port of the prototype's split/sets-reps/cardio generator |
| `app/api/onboarding/route.ts` | Stashes questionnaire answers in `pending_signups` |
| `app/api/checkout/route.ts` | Creates the Stripe Checkout Session |
| `app/api/stripe/webhook/route.ts` | The orchestrator — everything above happens here |
| `supabase/functions/generate-shopping-list/` | Aggregates a week's ingredients into a checklist |
| `public/manifest.json` | PWA manifest — name, icons, standalone display mode |
| `public/sw.js` | Service worker — caches the app shell, always hits network for data |
| `public/icons/`, `public/apple-touch-icon.png`, `public/favicon.png` | Generated icon set |
| `app/offline/page.tsx` | Shown when a navigation fails with no connection |
| `lib/pwa/register-sw.ts` | Registers the service worker on mount |
| `components/pwa/InstallPrompt.tsx` | Android: native install button. iOS: custom "Add to Home Screen" instructions (Apple has no install API) |
| `components/pwa/PwaClientShell.tsx` | Client wrapper mounting the above from `app/layout.tsx` |

## Install funnel analytics

`pwa_install_events` (+ the `pwa_install_funnel` view) tracks banner_shown → install_accepted / banner_dismissed, split by platform. Anonymous visitors can log events (no login required for the banner to appear), but only admins can read them.

Sample admin dashboard query — install rate by platform, last 30 days:
```sql
select
  platform,
  count(*) filter (where event_type = 'banner_shown') as shown,
  count(*) filter (where event_type = 'install_accepted') as installed,
  round(
    100.0 * count(*) filter (where event_type = 'install_accepted')
    / nullif(count(*) filter (where event_type = 'banner_shown'), 0), 1
  ) as install_rate_pct
from public.pwa_install_events
where created_at > now() - interval '30 days'
group by platform;
```

## Testing the PWA install flow

You need HTTPS for any of this to work — `localhost` is exempted for local dev, but a plain HTTP deployment won't register a service worker at all.

- **Android (Chrome)**: visit the site twice (Chrome requires some engagement before firing `beforeinstallprompt`), then the custom banner's Install button should appear. Chrome also shows its own install icon in the address bar independently.
- **iOS (Safari)**: the custom banner appears immediately with "Tap Share, then Add to Home Screen" — there's no way to trigger Apple's install programmatically, so this instructional banner is the only option. Test on a real device; Simulator's Safari doesn't reliably reflect Add to Home Screen behavior.
- Confirm standalone mode worked: after installing, the app should open with no browser chrome (no URL bar) and `window.matchMedia('(display-mode: standalone)').matches` should be `true`.


## Notes / what's simplified

- **Meal templates**: `meal-generator.ts` has full templates for Standard, Vegetarian, and Vegan. Keto, Low Carb, and Mediterranean currently fall back to Standard (macros still scale correctly, but ingredients won't reflect those diets yet — flagged with a `TODO` in the file).
- **Trainer assignment** picks the first active trainer rather than load-balancing across a roster — fine for a launch with one or two trainers, needs real logic once trainer capacity matters.
- **Emails** (receipt + welcome) are stubbed as a `TODO` in the webhook — wire up Resend/Postmark and pass the generated magic link so the email doubles as the auto-login link on mobile.
- **Smart scale**: unchanged from the schema — still a plain product purchase, no device integration anywhere in this app layer either.

## Not built yet

- Admin dashboard (`/app/admin/**`)
- AI Coach route (would call the Anthropic API with the user's `meal_plans`/`workout_plans`/`body_metrics` as context)
- Referral share links / deep linking
- Weekly progress review email/report generation

## Admin dashboard

Lives at `/admin`, gated two ways: middleware requires a logged-in session, and `app/admin/layout.tsx` calls the `is_admin()` RPC and redirects non-admins to `/dashboard`. No one has the `admin` role yet on a fresh project — grant it to yourself after signing up once through the real checkout flow:

```sql
insert into public.user_roles (user_id, role)
values ('<your-auth-user-id>', 'admin')
on conflict (user_id) do update set role = 'admin';
```
(Find your user id in Supabase Dashboard → Authentication → Users.)

| Page | What it does |
|---|---|
| `/admin` | Revenue, user count, active subscriptions, tier breakdown, PWA install funnel, recent signups |
| `/admin/users` | All customers with their current tier |
| `/admin/purchases` | Every subscription with a **real Stripe refund** button (`/api/admin/refund` calls `stripe.refunds.create`, then marks the row `refunded`) |
| `/admin/coupons` | Create a coupon — this calls `stripe.coupons.create` for real, then saves the Stripe coupon id locally |
| `/admin/trainers` | Add trainers and see their active client counts — this is the pool `/api/stripe/webhook` and `/api/upgrade` assign from on VIP purchase |

Not built yet: meal plan / recipe management UI, push notification sending, and promotions beyond simple percent/amount-off coupons.
