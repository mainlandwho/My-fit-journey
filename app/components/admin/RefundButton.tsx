"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { green, greenDeep, ink } from "@/lib/design-tokens";

export function RefundButton({ subscriptionId, status }: { subscriptionId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "refunded") {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#FEE2E2", color: "#DC2626" }}>Refunded</span>;
  }
  if (status !== "active") {
    return <span className="text-xs opacity-40">{status}</span>;
  }

  const refund = async () => {
    if (!confirm("Refund this purchase via Stripe? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Refund failed");
      setLoading(false);
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <button
        onClick={refund}
        disabled={loading}
        className="text-xs font-bold px-3 py-1.5 rounded-lg"
        style={{ background: "#FEE2E2", color: "#DC2626" }}
      >
        {loading ? "Refunding…" : "Refund"}
      </button>
      {error && <div className="text-[10px] mt-1" style={{ color: "#DC2626" }}>{error}</div>}
    </div>
  );
}
