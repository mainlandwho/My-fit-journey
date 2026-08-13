"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ink, mist } from "@/lib/design-tokens";

interface Coupon {
  id: string;
  code: string;
  percent_off: number | null;
  amount_off_cents: number | null;
  redeemed_count: number;
  max_redemptions: number | null;
  is_active: boolean;
}

export function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!code || !percentOff) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.toUpperCase(),
        percentOff: Number(percentOff),
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to create coupon");
      setSaving(false);
      return;
    }
    setCode(""); setPercentOff(""); setMaxRedemptions("");
    setSaving(false);
    router.refresh();
  };

  return (
    <div>
      <div className="rounded-2xl bg-white p-5 mb-6" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
        <div className="text-sm font-bold mb-3" style={{ color: ink }}>Create coupon</div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: mist, color: ink }} />
          <input placeholder="% off" inputMode="numeric" value={percentOff} onChange={(e) => setPercentOff(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: mist, color: ink }} />
          <input placeholder="Max uses (optional)" inputMode="numeric" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: mist, color: ink }} />
        </div>
        {error && <p className="text-xs mb-2" style={{ color: "#DC2626" }}>{error}</p>}
        <Button variant="primary" disabled={saving || !code || !percentOff} onClick={create} className="!py-2.5 !px-5 text-sm">
          {saving ? "Creating…" : "Create in Stripe + save"}
        </Button>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
        {initialCoupons.length === 0 ? (
          <div className="p-8 text-center text-sm opacity-40">No coupons yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: mist }}>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Code</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Discount</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Redeemed</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {initialCoupons.map((c) => (
                <tr key={c.id} style={{ borderTop: `1px solid ${mist}` }}>
                  <td className="px-5 py-3 font-mono font-semibold" style={{ color: ink }}>{c.code}</td>
                  <td className="px-5 py-3 opacity-70">{c.percent_off ? `${c.percent_off}%` : `$${((c.amount_off_cents ?? 0) / 100).toFixed(2)}`}</td>
                  <td className="px-5 py-3 opacity-70">{c.redeemed_count}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={c.is_active ? { background: "#DCFCE7", color: "#16A34A" } : { background: mist, color: `${ink}66` }}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
