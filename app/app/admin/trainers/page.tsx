import { createClient } from "@/lib/supabase/server";
import { TrainersClient } from "@/components/admin/TrainersClient";
import { ink, fontDisplay } from "@/lib/design-tokens";

export default async function AdminTrainersPage() {
  const supabase = await createClient();

  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, full_name, certification, is_active")
    .order("full_name");

  const { data: assignments } = await supabase
    .from("trainer_assignments")
    .select("trainer_id")
    .eq("status", "active");

  const countByTrainer = (assignments ?? []).reduce((acc: Record<string, number>, a) => {
    acc[a.trainer_id] = (acc[a.trainer_id] ?? 0) + 1;
    return acc;
  }, {});

  const withCounts = (trainers ?? []).map((t) => ({ ...t, clientCount: countByTrainer[t.id] ?? 0 }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Trainers</h1>
      <TrainersClient initialTrainers={withCounts} />
    </div>
  );
}
