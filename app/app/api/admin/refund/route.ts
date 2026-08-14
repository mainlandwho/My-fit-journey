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

  const { subscriptionId } = await req.json();
  if (!subscriptionId) return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: subscription, error } = await admin
    .from("subscriptions")
    .select("stripe_payment_intent_id, status")
    .eq("id", subscriptionId)
    .single();

  if (error || !subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  if (subscription.status === "refunded") return NextResponse.json({ error: "Already refunded" }, { status: 400 });

  if (subscription.stripe_payment_intent_id) {
    await getStripe().refunds.create({ payment_intent: subscription.stripe_payment_intent_id });
  }

  await admin.from("subscriptions").update({ status: "refunded" }).eq("id", subscriptionId);

  return NextResponse.json({ ok: true });
}
