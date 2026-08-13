import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { mist } from "@/lib/design-tokens";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Belt-and-suspenders — middleware already redirects unauthenticated
  // requests, but Server Components should never assume that ran correctly.
  if (!user) redirect("/");

  return (
    <div className="relative min-h-screen max-w-md mx-auto" style={{ background: mist }}>
      <div className="min-h-screen pb-4" style={{ background: "#fff" }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
