import { createClient } from "@/lib/supabase/server";
import { RefundButton } from "@/components/admin/RefundButton";
import { ink, mist, greenDeep, fontDisplay } from "@/lib/design-tokens";

export default async function AdminPurchasesPage() {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, user_id, status, amount_cents, starts_at, membership_tiers(name)")
    .order("starts_at", { ascending: false })
    .limit(100);

  const userIds = [...new Set((subscriptions ?? []).map((s) => s.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Purchases</h1>
      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
        {(subscriptions ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm opacity-40">No purchases yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: mist }}>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Customer</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Plan</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Amount</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Date</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {(subscriptions ?? []).map((s: any) => {
                const profile = profileById.get(s.user_id);
                return (
                  <tr key={s.id} style={{ borderTop: `1px solid ${mist}` }}>
                    <td className="px-5 py-3">
                      <div className="font-medium" style={{ color: ink }}>{profile?.full_name || "—"}</div>
                      <div className="text-xs opacity-50">{profile?.email}</div>
                    </td>
                    <td className="px-5 py-3 opacity-70">{s.membership_tiers?.name}</td>
                    <td className="px-5 py-3 font-semibold" style={{ color: greenDeep }}>${(s.amount_cents / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 opacity-40">{new Date(s.starts_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3"><RefundButton subscriptionId={s.id} status={s.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
