import { createClient } from "@/lib/supabase/server";
import { NotificationsClient } from "@/components/dashboard/NotificationsClient";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: prefs }, { data: membership }] = await Promise.all([
    supabase.from("notification_preferences").select("*").eq("user_id", user!.id).single(),
    supabase.from("current_membership").select("tier_name").eq("user_id", user!.id).maybeSingle(),
  ]);

  const isVIP = membership?.tier_name === "VIP Coaching";

  return (
    <NotificationsClient
      initialPrefs={{
        water_reminders: prefs?.water_reminders ?? true,
        meal_reminders: prefs?.meal_reminders ?? true,
        workout_reminders: prefs?.workout_reminders ?? true,
        weekly_weigh_in: prefs?.weekly_weigh_in ?? true,
        motivational_messages: prefs?.motivational_messages ?? true,
        vip_trainer_messages: prefs?.vip_trainer_messages ?? false,
      }}
      isVIP={isVIP}
    />
  );
}
