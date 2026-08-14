import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  const { pendingSignupId } = await req.json();
  if (!pendingSignupId) {
    return NextResponse.json({ error: "Missing pendingSignupId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: pending, error } = await supabase
    .from("pending_signups")
    .select("id, email, tier_id, coupon_code, auto_renew, membership_tiers(name, price_cents, stripe_price_id)")
    .eq("id", pendingSignupId)
    .single();

  if (error || !pending) {
    return NextResponse.json({ error: "Pending signup not found or expired" }, { status: 404 });
  }

  const tier = pending.membership_tiers as unknown as {
    name: string;
    price_cents: number;
    stripe_price_id: string | null;
  };

  const session = await getStripe().checkout.sessions.create({
    mode: "payment", // one-time per charge — auto-renew re-charges via cron, not a Stripe subscription
    payment_method_types: ["card"], // Apple Pay / Google Pay auto-enabled via Payment Request Button on Stripe's side
    customer_email: pending.email,
    line_items: [
      tier.stripe_price_id
        ? { price: tier.stripe_price_id, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              product_data: { name: `${tier.name} Plan` },
              unit_amount: tier.price_cents,
            },
            quantity: 1,
          },
    ],
    discounts: pending.coupon_code ? [{ coupon: pending.coupon_code }] : undefined,
    metadata: { pending_signup_id: pending.id },
    // Auto-renew: save the card for a future off-session charge, and make
    // sure a real Stripe Customer object exists to attach it to (a plain
    // one-time payment session doesn't create one by default).
    ...(pending.auto_renew
      ? {
          customer_creation: "always" as const,
          payment_intent_data: { setup_future_usage: "off_session" as const },
        }
      : {}),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/programs`,
  });

  await supabase
    .from("pending_signups")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", pending.id);

  return NextResponse.json({ checkoutUrl: session.url });
}
