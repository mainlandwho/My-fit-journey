import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: tier, error } = await admin
    .from("membership_tiers")
    .select("id, price_cents, stripe_price_id")
    .eq("name", "VIP Coaching")
    .single();

  if (error || !tier) return NextResponse.json({ error: "VIP tier not found" }, { status: 500 });

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: user.email,
    line_items: [
      tier.stripe_price_id
        ? { price: tier.stripe_price_id, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              product_data: { name: "VIP Coaching Upgrade" },
              unit_amount: tier.price_cents,
            },
            quantity: 1,
          },
    ],
    metadata: { upgrade_user_id: user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/coach?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/coach`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
