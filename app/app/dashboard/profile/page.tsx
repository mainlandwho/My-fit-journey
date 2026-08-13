import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { ink, greenDeep, fontDisplay } from "@/lib/design-tokens";
import { ChevronRight } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: membership }, { data: referral }, { data: loyaltyBalance }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase.from("current_membership").select("tier_name").eq("user_id", user!.id).maybeSingle(),
    supabase.from("referral_codes").select("code").eq("user_id", user!.id).maybeSingle(),
    supabase.from("loyalty_balances").select("balance").eq("user_id", user!.id).maybeSingle(),
  ]);

  const initials = (profile?.full_name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase();

  const rows = [
    { href: "/dashboard/profile/referral", t: `Referral code · ${referral?.code ?? "—"}` },
    { href: "/dashboard/profile/loyalty", t: `Loyalty points · ${loyaltyBalance?.balance ?? 0} pts` },
    { href: "/dashboard/profile/notifications", t: "Notifications" },
    { href: "/dashboard/profile/smart-scale", t: "Smart Scale" },
    { href: "/dashboard/profile/subscription", t: "Manage subscription" },
  ];

  return (
    <div className="px-6 pt-6 pb-28">
      <h2 className="text-xl font-extrabold tracking-tight mb-4" style={{ ...fontDisplay, color: ink }}>Profile</h2>
      <Card className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-white" style={{ background: greenDeep }}>{initials}</div>
        <div>
          <div className="font-bold" style={{ color: ink }}>{profile?.full_name ?? "—"}</div>
          <div className="text-xs opacity-50">{membership?.tier_name ?? "No active plan"}</div>
        </div>
      </Card>
      <div className="flex flex-col gap-2.5 mt-4">
        {rows.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: ink }}>{r.t}</span>
              <ChevronRight size={16} className="opacity-30" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
