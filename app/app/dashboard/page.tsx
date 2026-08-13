import { createClient } from "@/lib/supabase/server";
import { Card, JourneyRing } from "@/components/ui/primitives";
import { ink, green, greenDeep, mist, fontDisplay } from "@/lib/design-tokens";
import { Flame, Dumbbell, Droplet, Check, ChevronRight, Trophy } from "lucide-react";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: mealPlan }, { data: streak }, { data: userAchievements }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase.from("meal_plans").select("*, meals(*)").eq("user_id", user!.id).eq("plan_date", today).maybeSingle(),
    supabase.from("user_streaks").select("current_streak").eq("user_id", user!.id).maybeSingle(),
    supabase.from("user_achievements").select("achievements(title, icon)").eq("user_id", user!.id).order("earned_at", { ascending: false }).limit(3),
  ]);

  const { data: currentWorkoutPlan } = await supabase
    .from("workout_plans").select("id").eq("user_id", user!.id).eq("is_current", true).maybeSingle();

  const todayWeekday = (new Date().getDay() + 6) % 7; // Monday = 0, matching the generator
  const { data: todayWorkout } = currentWorkoutPlan
    ? await supabase
        .from("workout_days")
        .select("*, workout_exercises(*)")
        .eq("workout_plan_id", currentWorkoutPlan.id)
        .eq("weekday", todayWeekday)
        .maybeSingle()
    : { data: null };

  const meals = mealPlan?.meals ?? [];
  const caloriesConsumed = meals.filter((m: any) => m.is_completed).reduce((s: number, m: any) => s + m.calories, 0);
  const caloriesLeft = mealPlan ? Math.max(mealPlan.calorie_target - caloriesConsumed, 0) : null;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="px-6 pt-6 pb-28">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-xs opacity-50">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ ...fontDisplay, color: ink }}>Good morning, {firstName}</h2>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${green}22` }}>
          <Flame size={18} color={greenDeep} />
        </div>
      </div>

      <Card className="mt-5 p-5 flex items-center gap-5" style={{ background: `linear-gradient(135deg, ${ink}, #0f151d)` }}>
        <JourneyRing size={110} center={<span className="text-xs font-bold text-white">{caloriesLeft !== null ? `${Math.round((caloriesConsumed / mealPlan!.calorie_target) * 100)}%` : "—"}</span>} />
        <div className="text-white flex-1">
          <div className="text-xs opacity-60">Streak</div>
          <div className="text-2xl font-extrabold" style={fontDisplay}>{streak?.current_streak ?? 0} days</div>
          <div className="text-xs opacity-60 mt-2">&quot;Discipline is choosing between what you want now and what you want most.&quot;</div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Card className="p-3.5">
          <div className="flex items-center gap-1.5 mb-2"><Flame size={15} color={green} /><span className="text-[11px] opacity-50 font-medium">Calories left</span></div>
          <div className="text-lg font-extrabold" style={{ color: ink, ...fontDisplay }}>{caloriesLeft ?? "—"}</div>
        </Card>
        <Card className="p-3.5">
          <div className="flex items-center gap-1.5 mb-2"><Dumbbell size={15} color="#FF9F43" /><span className="text-[11px] opacity-50 font-medium">Protein target</span></div>
          <div className="text-lg font-extrabold" style={{ color: ink, ...fontDisplay }}>{mealPlan?.protein_target_g ?? "—"}g</div>
        </Card>
        <Card className="p-3.5">
          <div className="flex items-center gap-1.5 mb-2"><Droplet size={15} color="#4DA3FF" /><span className="text-[11px] opacity-50 font-medium">Water</span></div>
          <div className="text-lg font-extrabold" style={{ color: ink, ...fontDisplay }}>—</div>
        </Card>
      </div>

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Today&apos;s meals</h3>
      {meals.length === 0 ? (
        <Card className="p-4 text-center text-sm opacity-50">No meal plan generated yet.</Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {meals.sort((a: any, b: any) => a.sort_order - b.sort_order).map((m: any) => (
            <Card key={m.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold opacity-40 uppercase tracking-wide">{m.meal_type.replace("_", " ")}</div>
                <div className="font-semibold text-[14.5px]" style={{ color: ink }}>{m.name}</div>
                <div className="text-xs opacity-50 mt-0.5">{m.calories} cal</div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={m.is_completed ? { background: green } : { background: mist }}>
                {m.is_completed && <Check size={14} color="#fff" />}
              </div>
            </Card>
          ))}
        </div>
      )}

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Today&apos;s workout</h3>
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${green}1a` }}>
            <Dumbbell size={19} color={greenDeep} />
          </div>
          <div>
            <div className="font-semibold text-[14.5px]" style={{ color: ink }}>
              {!currentWorkoutPlan ? "No plan generated yet" : todayWorkout?.is_rest ? "Rest day" : todayWorkout?.focus ?? "—"}
            </div>
            <div className="text-xs opacity-50">
              {todayWorkout?.is_rest ? todayWorkout.recovery_note : todayWorkout?.duration_minutes ? `${todayWorkout.duration_minutes} min · ${todayWorkout.workout_exercises?.length ?? 0} exercises` : ""}
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="opacity-30" />
      </Card>

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Achievements</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {(userAchievements ?? []).length === 0 ? (
          <Card className="p-3 min-w-[110px] flex flex-col items-center gap-1.5"><Trophy size={16} className="opacity-30" /><span className="text-[11px] opacity-40">None yet</span></Card>
        ) : (
          (userAchievements ?? []).map((ua: any, i: number) => (
            <Card key={i} className="p-3 min-w-[110px] flex flex-col items-center gap-1.5">
              <Trophy size={16} color="#FF9F43" />
              <span className="text-[11px] font-medium text-center opacity-70">{ua.achievements?.title}</span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
