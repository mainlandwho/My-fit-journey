"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/primitives";
import { SubScreenHeader } from "@/components/dashboard/SubScreenHeader";
import { ink, green, greenDeep, mist, fontDisplay } from "@/lib/design-tokens";

interface Reward {
  id: string;
  name: string;
  points_cost: number;
}

export function LoyaltyClient({ balance, rewards }: { balance: number; rewards: Reward[] }) {
  const router = useRouter();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redeem = async (rewardId: string) => {
    setRedeeming(rewardId);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("redeem_loyalty_reward", { p_reward_id: rewardId });
    if (rpcError) {
      setError(rpcError.message);
      setRedeeming(null);
      return;
    }
    router.refresh();
    setRedeeming(null);
  };

  const earnActions = [
    { t: "Daily login", pts: 5 },
    { t: "Workout completion", pts: 10 },
    { t: "Meal tracking", pts: 5 },
    { t: "Invite a friend", pts: 50 },
    { t: "Weekly check-in", pts: 15 },
  ];

  return (
    <div className="px-6 pt-6 pb-28">
      <SubScreenHeader title="Loyalty points" />
      <Card className="p-5 text-center" style={{ background: `linear-gradient(135deg, ${ink}, #0f151d)` }}>
        <div className="text-white opacity-60 text-xs">Your balance</div>
        <div className="text-white text-3xl font-extrabold mt-1" style={fontDisplay}>{balance} pts</div>
      </Card>

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Ways to earn</h3>
      <div className="flex flex-col gap-2">
        {earnActions.map((e) => (
          <Card key={e.t} className="p-3.5 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: ink }}>{e.t}</span>
            <span className="text-sm font-bold" style={{ color: greenDeep }}>+{e.pts} pts</span>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm mt-4 text-center" style={{ color: "#DC2626" }}>{error}</p>}

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Redeem</h3>
      <div className="flex flex-col gap-2.5">
        {rewards.map((r) => {
          const afford = balance >= r.points_cost;
          return (
            <Card key={r.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: ink }}>{r.name}</div>
                <div className="text-xs opacity-50">{r.points_cost} pts</div>
              </div>
              <button
                onClick={() => afford && redeem(r.id)}
                disabled={!afford || redeeming === r.id}
                className="px-3.5 py-2 rounded-xl text-xs font-bold"
                style={afford ? { background: green, color: "#fff" } : { background: mist, color: `${ink}66` }}
              >
                {redeeming === r.id ? "…" : afford ? "Redeem" : "Locked"}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
