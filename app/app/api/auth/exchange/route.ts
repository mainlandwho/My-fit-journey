import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: login, error } = await supabase
    .from("post_checkout_logins")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .eq("consumed", false)
    .single();

  if (error || !login) {
    return NextResponse.json({ error: "Login link not found, expired, or already used" }, { status: 404 });
  }

  if (new Date(login.expires_at) < new Date()) {
    return NextResponse.json({ error: "Login link expired" }, { status: 410 });
  }

  await supabase
    .from("post_checkout_logins")
    .update({ consumed: true })
    .eq("stripe_checkout_session_id", sessionId);

  return NextResponse.json({ magicLink: login.magic_link });
}
