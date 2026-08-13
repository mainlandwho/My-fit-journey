import { createClient } from "@/lib/supabase/server";
import { ProgressClient } from "@/components/dashboard/ProgressClient";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("body_metrics")
    .select("recorded_at, weight_kg, body_fat_pct, visceral_fat_rating")
    .eq("user_id", user!.id)
    .order("recorded_at", { ascending: true })
    .limit(30);

  return (
    <div className="px-6 pt-6 pb-28">
      <ProgressClient entries={entries ?? []} />
    </div>
  );
}
