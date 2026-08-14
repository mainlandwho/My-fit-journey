"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/primitives";
import { ink, mist, green } from "@/lib/design-tokens";
import { RefreshCw } from "lucide-react";

function Switch({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <div className="w-11 h-6 rounded-full relative" style={{ background: disabled ? `${ink}1a` : on ? green : mist }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white" style={{ left: on ? 22 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

export function AutoRenewRow({ subscriptionId, autoRenew, hasPaymentMethod }: { subscriptionId: string; autoRenew: boolean; hasPaymentMethod: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const disable = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("subscriptions").update({ auto_renew: false }).eq("id", subscriptionId);
    setLoading(false);
    router.refresh();
  };

  const enable = async () => {
    setLoading(true);
    if (hasPaymentMethod) {
      // We already have a saved card from a previous auto-renew opt-in — just flip it back on.
      const supabase = createClient();
      await supabase.from("subscriptions").update({ auto_renew: true }).eq("id", subscriptionId);
      setLoading(false);
      router.refresh();
      return;
    }
    // No saved card yet — go collect one via Stripe, then the webhook flips this on.
    const res = await fetch("/api/enable-autorenew", { method: "POST" });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setLoading(false);
  };

  return (
    <Card className="p-4 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <RefreshCw size={15} color={ink} className="opacity-50" />
          <span className="text-sm font-medium" style={{ color: ink }}>Auto-renew</span>
        </div>
        <button onClick={() => (autoRenew ? disable() : enable())} disabled={loading} type="button">
          <Switch on={autoRenew} disabled={loading} />
        </button>
      </div>
      <p className="text-xs opacity-50 mt-2">
        {autoRenew
          ? "Your card will be charged automatically when this plan ends."
          : "Turn this on to keep your access without repurchasing manually."}
      </p>
    </Card>
  );
}
