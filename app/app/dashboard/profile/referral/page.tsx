import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { SubScreenHeader } from "@/components/dashboard/SubScreenHeader";
import { green, greenDeep, ink, fontDisplay } from "@/lib/design-tokens";

export default async function ReferralPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: referral } = await supabase.from("referral_codes").select("code").eq("user_id", user!.id).single();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id")
    .eq("referrer_user_id", user!.id)
    .eq("status", "completed");

  const rewardTiers = [
    { t: "Free week", d: "3 invites" },
    { t: "Store credit", d: "$10 / invite" },
    { t: "Discount coupon", d: "1 invite" },
  ];

  return (
    <div className="px-6 pt-6 pb-28">
      <SubScreenHeader title="Referrals" />
      <Card className="p-5 text-center" style={{ background: `linear-gradient(135deg, ${green}, ${greenDeep})` }}>
        <div className="text-white text-xs opacity-80">Your referral code</div>
        <div className="text-white text-3xl font-extrabold tracking-widest mt-1" style={fontDisplay}>{referral?.code ?? "—"}</div>
        <Button variant="ghostLight" className="w-full mt-4">Share your code</Button>
      </Card>

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Rewards</h3>
      <div className="grid grid-cols-3 gap-3">
        {rewardTiers.map((r) => (
          <Card key={r.t} className="p-3 text-center">
            <div className="font-bold text-[13px]" style={{ color: ink }}>{r.t}</div>
            <div className="text-[11px] opacity-50 mt-1">{r.d}</div>
          </Card>
        ))}
      </div>

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Your referrals</h3>
      <Card className="p-4 text-center">
        <div className="text-2xl font-extrabold" style={{ color: greenDeep, ...fontDisplay }}>{referrals?.length ?? 0}</div>
        <div className="text-xs opacity-50 mt-1">completed referrals</div>
      </Card>
    </div>
  );
}
