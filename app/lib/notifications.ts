// Deliberately implemented with plain fetch() rather than the resend/twilio
// SDKs — this project has been bitten before by new npm dependencies
// breaking the Vercel build (React 19 peer conflicts, etc.), so keeping
// these as zero-dependency REST calls avoids that risk entirely.
//
// Both functions no-op (log + return {skipped: true}) if their API key
// isn't set, so the abandoned-cart cron job runs safely even before you've
// configured a real provider — nothing crashes, it just doesn't send yet.

export async function sendAbandonedCartEmail(to: string, name: string, resumeUrl: string, isFinalReminder: boolean) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email skipped, no RESEND_API_KEY] Would email ${to}: resume at ${resumeUrl}`);
    return { skipped: true };
  }

  const subject = isFinalReminder
    ? "Last chance — your plan is about to expire"
    : "You're one step away from starting your journey";

  const html = `
    <p>Hi ${name || "there"},</p>
    <p>${isFinalReminder
      ? "Your personalized plan is still waiting, but it won't be held much longer."
      : "You started building your personalized fitness plan but didn't finish checking out."}</p>
    <p><a href="${resumeUrl}">Pick up right where you left off →</a></p>
    <p>— My Fit Journey</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "My Fit Journey <onboarding@myfitjourney.app>", // update to your verified Resend sending domain
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error: ${res.status} ${text}`);
  }
  return { skipped: false };
}

export async function sendAbandonedCartSms(to: string, resumeUrl: string, isFinalReminder: boolean) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[sms skipped, no Twilio credentials] Would text ${to}: resume at ${resumeUrl}`);
    return { skipped: true };
  }

  const body = isFinalReminder
    ? `Last chance — your My Fit Journey plan is still waiting. Finish here: ${resumeUrl}`
    : `You're one step away from starting your journey! Finish here: ${resumeUrl}`;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio API error: ${res.status} ${text}`);
  }
  return { skipped: false };
}
