"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ink, mist, green, greenDeep, fontBody, fontDisplay } from "@/lib/design-tokens";
import { ChevronLeft, Check, ArrowRight } from "lucide-react";

interface Tier {
  name: string;
  price_cents: number;
  duration_days: number;
}

function ProgramsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const pendingSignupId = params.get("pending");

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selected, setSelected] = useState("Complete");
  const [autoRenew, setAutoRenew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("membership_tiers")
      .select("name, price_cents, duration_days")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setTiers(data ?? []));
  }, []);

  const selectedTier = tiers.find((t) => t.name === selected);

  const goToCheckout = async () => {
    if (!pendingSignupId) {
      router.push("/onboarding");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: tier } = await supabase.from("membership_tiers").select("id").eq("name", selected).single();
      if (tier) {
        await fetch("/api/onboarding/tier", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingSignupId, tierId: tier.id, autoRenew }),
        });
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingSignupId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Checkout failed");
      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-6 pb-32 max-w-md mx-auto" style={{ ...fontBody, background: "#fff" }}>
      <button onClick={() => router.back()} type="button"><ChevronLeft size={22} color={ink} /></button>
      <h2 className="text-2xl font-extrabold tracking-tight mt-4 mb-1" style={{ ...fontDisplay, color: ink }}>Pick your plan</h2>
      <p className="text-sm opacity-60 mb-6">You can upgrade anytime from your dashboard.</p>

      <div className="flex flex-col gap-3">
        {tiers.map((t) => (
          <button key={t.name} type="button" onClick={() => setSelected(t.name)}
            className="text-left p-4 rounded-2xl flex items-center justify-between"
            style={selected === t.name ? { border: `2px solid ${green}`, background: `${green}0d` } : { border: `2px solid ${mist}` }}>
            <div>
              <div className="font-bold" style={{ color: ink }}>{t.name}</div>
              <div className="text-xs opacity-50">{t.duration_days / 7} weeks</div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-lg" style={{ color: greenDeep, ...fontDisplay }}>${(t.price_cents / 100).toFixed(0)}</div>
              {selected === t.name && <Check size={16} color={green} className="ml-auto mt-1" />}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAutoRenew((v) => !v)}
        className="w-full text-left mt-4 p-4 rounded-2xl flex items-start gap-3"
        style={{ background: mist }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0"
          style={autoRenew ? { background: green } : { background: "#fff", border: `1.5px solid ${ink}33` }}
        >
          {autoRenew && <Check size={12} color="#fff" />}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: ink }}>Auto-renew my plan</div>
          <div className="text-xs opacity-60 mt-0.5">
            {selectedTier
              ? `We'll automatically charge your card $${(selectedTier.price_cents / 100).toFixed(0)} again every ${selectedTier.duration_days / 7} weeks so you never lose access. Cancel anytime from Manage Subscription.`
              : "We'll automatically renew your plan when it ends, using the same card. Cancel anytime."}
          </div>
        </div>
      </button>

      {error && <p className="text-sm text-center mt-4" style={{ color: "#DC2626" }}>{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white" style={{ boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.15)" }}>
        <div className="max-w-md mx-auto">
          <Button variant="primary" className="w-full" disabled={loading} onClick={goToCheckout}>
            {loading ? "Redirecting to checkout…" : <>Continue to checkout <ArrowRight size={17} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={null}>
      <ProgramsInner />
    </Suspense>
  );
}
