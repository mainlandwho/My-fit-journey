import { createClient } from "@/lib/supabase/server";
import { ink, mist, fontDisplay } from "@/lib/design-tokens";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, primary_goal, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: memberships } = await supabase.from("current_membership").select("user_id, tier_name");
  const tierByUser = new Map((memberships ?? []).map((m) => [m.user_id, m.tier_name]));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Users</h1>
      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
        {(profiles ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm opacity-40">No users yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: mist }}>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Name</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Email</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Goal</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Tier</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${mist}` }}>
                  <td className="px-5 py-3 font-medium" style={{ color: ink }}>{p.full_name || "—"}</td>
                  <td className="px-5 py-3 opacity-70">{p.email}</td>
                  <td className="px-5 py-3 opacity-70">{p.primary_goal || "—"}</td>
                  <td className="px-5 py-3 opacity-70">{tierByUser.get(p.id) || "None"}</td>
                  <td className="px-5 py-3 opacity-40">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
