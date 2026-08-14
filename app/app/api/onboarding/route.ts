import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Called when the onboarding wizard finishes, BEFORE checkout.
// No auth.users row exists yet — everything lives in pending_signups
// until the Stripe webhook confirms payment.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, phone, tierName, onboardingData, couponCode, referralCode } = body;

  if (!email || !tierName || !onboardingData) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tier, error: tierError } = await supabase
    .from("membership_tiers")
    .select("id")
    .eq("name", tierName)
    .single();

  if (tierError || !tier) {
    return NextResponse.json({ error: "Unknown membership tier" }, { status: 400 });
  }

  const { data: pending, error } = await supabase
    .from("pending_signups")
    .insert({
      email,
      phone: phone || null,
      tier_id: tier.id,
      onboarding_data: onboardingData,
      coupon_code: couponCode ?? null,
      referral_code: referralCode ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pendingSignupId: pending.id });
}
