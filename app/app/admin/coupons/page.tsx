import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, percentOff, amountOffCents, maxRedemptions, expiresAt } = await req.json();
  if (!code || (!percentOff && !amountOffCents)) {
    return NextResponse.json({ error: "Provide a code and either percentOff or amountOffCents" }, { status: 400 });
  }

  const stripeCoupon = await getStripe().coupons.create({
    percent_off: percentOff || undefined,
    amount_off: amountOffCents || undefined,
    currency: amountOffCents ? "usd" : undefined,
    duration: "once",
    max_redemptions: maxRedemptions || undefined,
    redeem_by: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined,
    name: code,
  });

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").insert({
    code,
    percent_off: percentOff || null,
    amount_off_cents: amountOffCents || null,
    stripe_coupon_id: stripeCoupon.id,
    max_redemptions: maxRedemptions || null,
    expires_at: expiresAt || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stripeCouponId: stripeCoupon.id });
}
