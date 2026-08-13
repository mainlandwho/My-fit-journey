import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ink, mist, green, fontDisplay, fontBody } from "@/lib/design-tokens";
import { LayoutDashboard, Users, CreditCard, Ticket, UserCog } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/purchases", label: "Purchases", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/trainers", label: "Trainers", icon: UserCog },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/dashboard");

  return (
    <div style={{ ...fontBody, background: mist, minHeight: "100vh" }}>
      <div className="px-6 py-5 bg-white flex items-center justify-between" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        <span className="font-extrabold text-lg" style={{ ...fontDisplay, color: ink }}>My Fit Journey · Admin</span>
        <Link href="/dashboard" className="text-xs font-semibold opacity-50">Exit to app</Link>
      </div>
      <div className="flex overflow-x-auto px-6 py-3 gap-2 bg-white" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap" style={{ background: mist, color: ink }}>
              <Icon size={15} /> {n.label}
            </Link>
          );
        })}
      </div>
      <div className="px-6 py-6 max-w-4xl mx-auto">{children}</div>
    </div>
  );
}
