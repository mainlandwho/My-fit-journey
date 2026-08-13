import { createClient } from "@/lib/supabase/server";
import { LoyaltyClient } from "@/components/dashboard/LoyaltyClient";

export default async function LoyaltyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: balanceRow }, { data: rewards }] = await Promise.all([
    supabase.from("loyalty_balances").select("balance").eq("user_id", user!.id).maybeSingle(),
    supabase.from("loyalty_rewards").select("id, name, points_cost").eq("is_active", true).order("points_cost"),
  ]);

  return <LoyaltyClient balance={balanceRow?.balance ?? 0} rewards={rewards ?? []} />;
}
