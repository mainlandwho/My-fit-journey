import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMealPlan } from "@/lib/meal-generator";
import { generateWorkoutPlan } from "@/lib/workout-generator";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const pendingSignupId = session.metadata?.pending_signup_id;
  const upgradeUserId = session.metadata?.upgrade_user_id;

  const supabase = createAdminClient();

  // ---------- Path B: existing user upgrading to VIP Coaching ----------
  // (No account creation needed — see /api/upgrade.)
  if (upgradeUserId) {
    const { data: vipTier } = await supabase
      .from("membership_tiers")
      .select("id, duration_days, price_cents")
      .eq("name", "VIP Coaching")
      .single();
    if (!vipTier) return NextResponse.json({ error: "VIP tier not found" }, { status: 500 });

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + vipTier.duration_days * 24 * 60 * 60 * 1000);

    await supabase.from("subscriptions").insert({
      user_id: upgradeUserId,
      tier_id: vipTier.id,
      status: "active",
      stripe_customer_id: session.customer as string,
      stripe_payment_intent_id: session.payment_intent as string,
      amount_cents: session.amount_total ?? vipTier.price_cents,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    const { data: trainer } = await supabase.from("trainers").select("id").eq("is_active", true).limit(1).single();
    if (trainer) {
      await supabase.from("trainer_assignments").insert({ client_user_id: upgradeUserId, trainer_id: trainer.id });
    }
    await supabase.from("notification_preferences").update({ vip_trainer_messages: true }).eq("user_id", upgradeUserId);

    return NextResponse.json({ received: true, userId: upgradeUserId });
  }

  // ---------- Path A: brand-new signup ----------
  if (!pendingSignupId) {
    return NextResponse.json({ error: "Missing pending_signup_id or upgrade_user_id in session metadata" }, { status: 400 });
  }

  const { data: pending, error: pendingError } = await supabase
    .from("pending_signups")
    .select("*, membership_tiers(id, name, duration_days, price_cents)")
    .eq("id", pendingSignupId)
    .single();

  if (pendingError || !pending) {
    return NextResponse.json({ error: "Pending signup not found" }, { status: 404 });
  }

  const tier = pending.membership_tiers as unknown as { id: string; name: string; duration_days: number; price_cents: number };
  const onboarding = pending.onboarding_data as Record<string, any>;

  // 1. Create the auth user (this fires the on_auth_user_created trigger,
  //    which creates profiles / user_roles / notification_preferences /
  //    referral_codes rows automatically — see migrations 0002, 0009, 0011).
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: pending.email,
    email_confirm: true, // instant access, no email verification gate
    user_metadata: { full_name: onboarding.name },
  });
  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create account" }, { status: 500 });
  }
  const userId = authUser.user.id;

  // 2. Generate a magic link and stash it for the success page to exchange —
  //    this is what makes "pay → automatically logged in" actually happen.
  const { data: magicLink } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: pending.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
  });

  if (magicLink?.properties?.action_link) {
    await supabase.from("post_checkout_logins").insert({
      stripe_checkout_session_id: session.id,
      user_id: userId,
      magic_link: magicLink.properties.action_link,
    });
  }

  // 3. Fill in the rest of the onboarding questionnaire on their profile
  await supabase
    .from("profiles")
    .update({
      age: onboarding.age,
      gender: onboarding.gender,
      height_cm: onboarding.heightCm,
      starting_weight_kg: onboarding.weightKg,
      goal_weight_kg: onboarding.goalWeightKg,
      body_fat_pct: onboarding.bodyFatPct ?? null,
      activity_level: onboarding.activity,
      workout_experience: onboarding.exp,
      preferred_workout_location: onboarding.location,
      workout_days_per_week: Number(onboarding.days),
      diet_preference: onboarding.diet,
      meals_per_day: Number(onboarding.meals),
      food_allergies: onboarding.allergies ?? null,
      foods_disliked: onboarding.dislikes ?? null,
      occupation: onboarding.occupation ?? null,
      medical_conditions: onboarding.conditions ?? null,
      current_medications: onboarding.medications ?? null,
      primary_goal: onboarding.goal,
      target_date: onboarding.targetDate ?? null,
      medical_disclaimer_agreed_at: onboarding.agree ? new Date().toISOString() : null,
    })
    .eq("id", userId);

  // 4. Record the purchase
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + tier.duration_days * 24 * 60 * 60 * 1000);
  await supabase.from("subscriptions").insert({
    user_id: userId,
    tier_id: tier.id,
    status: "active",
    stripe_customer_id: session.customer as string,
    stripe_payment_intent_id: session.payment_intent as string,
    amount_cents: session.amount_total ?? tier.price_cents,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });

  // 5. Resolve a referral, if one was applied
  if (pending.referral_code) {
    const { data: referrerCode } = await supabase
      .from("referral_codes")
      .select("user_id")
      .eq("code", pending.referral_code)
      .single();

    if (referrerCode) {
      await supabase.from("referrals").insert({
        referrer_user_id: referrerCode.user_id,
        referred_user_id: userId,
        referral_code: pending.referral_code,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      // Reward: 50 loyalty points to the referrer (redeemable toward Free Week etc.)
      await supabase.from("loyalty_ledger").insert({
        user_id: referrerCode.user_id,
        points: 50,
        reason: "referral_completed",
      });
    }
  }

  // 6. VIP Coaching → assign a trainer immediately
  if (tier.name === "VIP Coaching") {
    const { data: trainer } = await supabase
      .from("trainers")
      .select("id")
      .eq("is_active", true)
      .limit(1) // simplistic round-robin candidate — replace with real load-balancing logic
      .single();

    if (trainer) {
      await supabase.from("trainer_assignments").insert({
        client_user_id: userId,
        trainer_id: trainer.id,
      });
    }
    await supabase
      .from("notification_preferences")
      .update({ vip_trainer_messages: true })
      .eq("user_id", userId);
  }

  // 7. Generate the first meal plan and workout plan so the dashboard
  //    is populated the moment they land on it.
  const today = new Date().toISOString().slice(0, 10);
  await generateMealPlan({
    userId,
    planDate: today,
    profile: {
      weightKg: onboarding.weightKg,
      heightCm: onboarding.heightCm,
      age: onboarding.age,
      gender: onboarding.gender,
      activityLevel: onboarding.activity,
      goal: onboarding.goal,
      diet_preference: onboarding.diet,
      meals_per_day: Number(onboarding.meals),
    },
  });

  await generateWorkoutPlan({
    userId,
    level: onboarding.exp,
    daysPerWeek: Number(onboarding.days),
    location: onboarding.location,
    goal: onboarding.goal,
  });

  // 8. Clean up — pending_signups is a short-lived staging table only
  await supabase.from("pending_signups").delete().eq("id", pendingSignupId);

  // TODO: send receipt + welcome email (Resend/Postmark).

  return NextResponse.json({ received: true, userId });
}
