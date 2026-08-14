import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// Triggered daily by Vercel Cron (see vercel.json). Protected by CRON_SECRET
// so it can't be hit by anyone who happens to guess the URL.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const stripe = getStripe();
  const now = new Date();

  // Subscriptions that opted into auto-renew, are still marked active, and
  // whose period has actually ended.
  const { data: dueSubscriptions, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, tier_id, amount_cents, stripe_customer_id, payment_method_id, membership_tiers(duration_days)")
    .eq("auto_renew", true)
    .eq("status", "active")
    .lte("ends_at", now.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { subscriptionId: string; outcome: string }[] = [];

  for (const sub of dueSubscriptions ?? []) {
    const tier = sub.membership_tiers as unknown as { duration_days: number } | null;

    if (!sub.stripe_customer_id || !sub.payment_method_id || !tier) {
      // Shouldn't happen if auto_renew was only ever set alongside a saved
      // payment method, but fail safe rather than charge without one.
      await supabase.from("subscriptions").update({ status: "expired", auto_renew: false }).eq("id", sub.id);
      results.push({ subscriptionId: sub.id, outcome: "expired: missing payment method" });
      continue;
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: sub.amount_cents,
        currency: "usd",
        customer: sub.stripe_customer_id,
        payment_method: sub.payment_method_id,
        off_session: true,
        confirm: true,
      });

      if (paymentIntent.status !== "succeeded") {
        throw new Error(`Unexpected payment intent status: ${paymentIntent.status}`);
      }

      // Mark the old cycle finished, start a fresh one carrying auto-renew
      // and the same payment method forward.
      await supabase.from("subscriptions").update({ status: "expired", auto_renew: false }).eq("id", sub.id);

      const startsAt = now;
      const endsAt = new Date(startsAt.getTime() + tier.duration_days * 24 * 60 * 60 * 1000);

      await supabase.from("subscriptions").insert({
        user_id: sub.user_id,
        tier_id: sub.tier_id,
        status: "active",
        stripe_customer_id: sub.stripe_customer_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: sub.amount_cents,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        auto_renew: true,
        payment_method_id: sub.payment_method_id,
        renewed_from_subscription_id: sub.id,
      });

      results.push({ subscriptionId: sub.id, outcome: "renewed" });
    } catch (err: any) {
      // Off-session charges commonly fail if the card was declined or needs
      // fresh authentication (3DS). Don't keep retrying forever — turn off
      // auto-renew and let the subscription lapse; the user can re-subscribe.
      console.error(`Renewal failed for subscription ${sub.id}:`, err.message);
      await supabase.from("subscriptions").update({ status: "expired", auto_renew: false }).eq("id", sub.id);
      results.push({ subscriptionId: sub.id, outcome: `failed: ${err.message}` });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
