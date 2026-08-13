import { createClient } from "@/lib/supabase/server";
import { ink, mist, green, greenDeep, fontDisplay } from "@/lib/design-tokens";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
      <div className="text-xs font-semibold opacity-50">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: ink, ...fontDisplay }}>{value}</div>
      {sub && <div className="text-xs opacity-40 mt-1">{sub}</div>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: userCount }, { data: activeSubs }, { data: tierBreakdown }, { data: funnel }, { data: recentUsers }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("amount_cents").eq("status", "active"),
    supabase.from("current_membership").select("tier_name"),
    supabase.from("pwa_install_funnel").select("*").order("day", { ascending: false }).limit(20),
    supabase.from("profiles").select("full_name, email, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const totalRevenueCents = (activeSubs ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const tierCounts = (tierBreakdown ?? []).reduce((acc: Record<string, number>, r) => {
    acc[r.tier_name] = (acc[r.tier_name] ?? 0) + 1;
    return acc;
  }, {});

  const installTotals = (funnel ?? []).reduce(
    (acc: Record<string, number>, f: any) => {
      acc[f.event_type] = (acc[f.event_type] ?? 0) + f.event_count;
      return acc;
    },
    {}
  );
  const shown = installTotals["banner_shown"] ?? 0;
  const installed = installTotals["install_accepted"] ?? 0;
  const installRate = shown > 0 ? ((installed / shown) * 100).toFixed(1) : "—";

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total revenue (active)" value={`$${(totalRevenueCents / 100).toLocaleString()}`} />
        <StatCard label="Total users" value={String(userCount ?? 0)} />
        <StatCard label="Active subscriptions" value={String(activeSubs?.length ?? 0)} />
        <StatCard label="PWA install rate (20d)" value={`${installRate}${installRate !== "—" ? "%" : ""}`} sub={`${installed} of ${shown} shown`} />
      </div>

      <h2 className="text-sm font-bold mt-8 mb-3 opacity-70">Subscriptions by tier</h2>
      <div className="grid grid-cols-3 gap-4">
        {["Starter", "Complete", "VIP Coaching"].map((t) => (
          <div key={t} className="rounded-2xl bg-white p-4 text-center" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
            <div className="text-xl font-extrabold" style={{ color: greenDeep, ...fontDisplay }}>{tierCounts[t] ?? 0}</div>
            <div className="text-xs opacity-50 mt-1">{t}</div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-bold mt-8 mb-3 opacity-70">Recent signups</h2>
      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
        {(recentUsers ?? []).length === 0 ? (
          <div className="p-6 text-center text-sm opacity-40">No signups yet</div>
        ) : (
          (recentUsers ?? []).map((u, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: i < recentUsers!.length - 1 ? `1px solid ${mist}` : "none" }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: ink }}>{u.full_name || "—"}</div>
                <div className="text-xs opacity-50">{u.email}</div>
              </div>
              <div className="text-xs opacity-40">{new Date(u.created_at).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
