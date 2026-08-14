import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest) {
  const { pendingSignupId, tierId, autoRenew } = await req.json();
  if (!pendingSignupId || !tierId) {
    return NextResponse.json({ error: "Missing pendingSignupId or tierId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pending_signups")
    .update({ tier_id: tierId, auto_renew: !!autoRenew })
    .eq("id", pendingSignupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
