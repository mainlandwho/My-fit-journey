import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { SubScreenHeader } from "@/components/dashboard/SubScreenHeader";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import { AutoRenewRow } from "@/components/dashboard/AutoRenewRow";
import { ink, green, greenDeep, fontDisplay } from "@/lib/design-tokens";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status, starts_at, ends_at, amount_cents, auto_renew, payment_method_id, membership_tiers(name)")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tierName = (subscription?.membership_tiers as any)?.name ?? "No active plan";

  return (
    <div className="px-6 pt-6 pb-28">
      <SubScreenHeader title="Manage subscription" />
      <Card className="p-5" style={{ border: `2px solid ${green}` }}>
        <div className="flex items-baseline justify-between">
          <span className="font-bold" style={{ color: ink, ...fontDisplay }}>{tierName} Plan</span>
          {subscription && <span className="font-extrabold text-lg" style={{ color: greenDeep, ...fontDisplay }}>${(subscription.amount_cents / 100).toFixed(0)}</span>}
        </div>
        <div className="text-xs opacity-50 mt-1">
          {subscription ? `Active through ${new Date(subscription.ends_at).toLocaleDateString()}` : "No active subscription"}
        </div>
      </Card>

      {subscription && (
        <AutoRenewRow
          subscriptionId={subscription.id}
          autoRenew={subscription.auto_renew}
          hasPaymentMethod={!!subscription.payment_method_id}
        />
      )}

      {tierName !== "VIP Coaching" && <UpgradeButton />}

      <Button variant="ghost" className="w-full mt-3">Cancel subscription</Button>
    </div>
  );
}
