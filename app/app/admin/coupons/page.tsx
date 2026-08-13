import { createClient } from "@/lib/supabase/server";
import { CouponsClient } from "@/components/admin/CouponsClient";
import { ink, fontDisplay } from "@/lib/design-tokens";

export default async function AdminCouponsPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("id, code, percent_off, amount_off_cents, redeemed_count, max_redemptions, is_active")
    .order("code");

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Coupons</h1>
      <CouponsClient initialCoupons={coupons ?? []} />
    </div>
  );
}
