import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// For customers who declined auto-renew at checkout but want to turn it on
// later. A one-time payment session never had to create a Stripe Customer,
// so we may need to create one now before we can save a card to it.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: subscription, error } = await admin
    .from("subscriptions")
    .select("id, stripe_customer_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !subscription) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  const stripe = getStripe();
  let customerId = subscription.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email ?? undefined });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { enable_autorenew_subscription_id: subscription.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile/subscription?autorenew=enabled`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile/subscription`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
