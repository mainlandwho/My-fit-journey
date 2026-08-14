import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAbandonedCartEmail, sendAbandonedCartSms } from "@/lib/notifications";

// Runs once daily (Vercel Hobby's cron minimum interval — see vercel.json).
// Anyone who started onboarding but never completed Stripe checkout still
// has a row in pending_signups (the webhook only deletes it on success).
// This finds those, sends a reminder at most twice, and stops.
//
// Want faster (e.g. 30-minute) reminders instead of once a day? Vercel's
// built-in cron caps at daily on the Hobby plan. This route is a normal
// authenticated HTTP endpoint though — any external scheduler (cron-job.org,
// GitHub Actions, etc.) can call it more often with the same Bearer token,
// or upgrade to Vercel Pro for per-minute cron scheduling.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const { data: candidates, error } = await supabase
    .from("pending_signups")
    .select("id, email, phone, onboarding_data, created_at, abandoned_reminder_count")
    .lt("created_at", thirtyMinutesAgo.toISOString())
    .lt("abandoned_reminder_count", 2);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; outcome: string }[] = [];

  for (const row of candidates ?? []) {
    const name = (row.onboarding_data as any)?.name ?? "";
    const resumeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/programs?pending=${row.id}`;

    // First reminder fires once 30+ minutes have passed (checked above).
    // Second/final reminder only fires after 2 full days of continued silence.
    const isFinalReminder = row.abandoned_reminder_count === 1;
    if (isFinalReminder && new Date(row.created_at) > twoDaysAgo) {
      continue; // not old enough yet for the second reminder
    }

    let sent = false;
    try {
      const emailResult = await sendAbandonedCartEmail(row.email, name, resumeUrl, isFinalReminder);
      if (!emailResult.skipped) sent = true;
    } catch (err: any) {
      console.error(`Abandoned-cart email failed for ${row.id}:`, err.message);
    }

    if (row.phone) {
      try {
        const smsResult = await sendAbandonedCartSms(row.phone, resumeUrl, isFinalReminder);
        if (!smsResult.skipped) sent = true;
      } catch (err: any) {
        console.error(`Abandoned-cart SMS failed for ${row.id}:`, err.message);
      }
    }

    await supabase
      .from("pending_signups")
      .update({
        abandoned_reminder_count: row.abandoned_reminder_count + 1,
        last_reminder_sent_at: now.toISOString(),
      })
      .eq("id", row.id);

    results.push({ id: row.id, outcome: sent ? "reminder sent" : "reminder counted, but no provider configured (see logs)" });
  }

  return NextResponse.json({ processed: results.length, results });
}
