import { createClient } from "@/lib/supabase/server";
import { CoachClient } from "@/components/dashboard/CoachClient";

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: aiMessages } = await supabase
    .from("ai_coach_messages")
    .select("sender, message")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true })
    .limit(30);

  const { data: assignment } = await supabase
    .from("trainer_assignments")
    .select("id, trainers(full_name, certification)")
    .eq("client_user_id", user!.id)
    .eq("status", "active")
    .maybeSingle();

  let trainerMessages: { sender: string; message: string }[] = [];
  if (assignment) {
    const { data } = await supabase
      .from("trainer_messages")
      .select("sender, message")
      .eq("assignment_id", assignment.id)
      .order("created_at", { ascending: true });
    trainerMessages = data ?? [];
  }

  return (
    <CoachClient
      initialAiMessages={aiMessages ?? []}
      assignment={assignment as any}
      initialTrainerMessages={trainerMessages}
    />
  );
}
