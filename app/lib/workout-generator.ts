import { createAdminClient } from "./supabase/admin";

type Level = "Beginner" | "Intermediate" | "Advanced";
type Location = "Home" | "Gym" | "Both";
type Goal = "Weight Loss" | "Weight Loss + Toning" | "Muscle Building";
type ExerciseKind = "compound" | "accessory" | "core";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SCHEDULE_BY_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

const SPLIT_BY_DAYS: Record<number, string[]> = {
  2: ["Full Body A", "Full Body B"],
  3: ["Full Body A", "Full Body B", "Full Body C"],
  4: ["Upper Body", "Lower Body", "Upper Body", "Lower Body"],
  5: ["Push", "Pull", "Legs", "Upper Body", "Lower Body"],
  6: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
};

const EXERCISE_BANK: Record<string, { name: string; kind: ExerciseKind }[]> = {
  "Full Body A": [
    { name: "Bodyweight squats", kind: "compound" }, { name: "Push-ups", kind: "compound" },
    { name: "Bent-over rows", kind: "compound" }, { name: "Plank", kind: "core" },
  ],
  "Full Body B": [
    { name: "Romanian deadlifts", kind: "compound" }, { name: "Overhead press", kind: "compound" },
    { name: "Lat pulldown", kind: "accessory" }, { name: "Bicycle crunches", kind: "core" },
  ],
  "Full Body C": [
    { name: "Walking lunges", kind: "compound" }, { name: "Incline push-ups", kind: "accessory" },
    { name: "Seated cable rows", kind: "accessory" }, { name: "Side plank", kind: "core" },
  ],
  "Upper Body": [
    { name: "Bench press or push-ups", kind: "compound" }, { name: "Bent-over rows", kind: "compound" },
    { name: "Shoulder press", kind: "accessory" }, { name: "Bicep curls", kind: "accessory" },
    { name: "Tricep dips", kind: "accessory" },
  ],
  "Lower Body": [
    { name: "Back squats", kind: "compound" }, { name: "Walking lunges", kind: "accessory" },
    { name: "Romanian deadlifts", kind: "compound" }, { name: "Standing calf raises", kind: "accessory" },
  ],
  Push: [
    { name: "Bench press", kind: "compound" }, { name: "Overhead press", kind: "compound" },
    { name: "Incline dumbbell press", kind: "accessory" }, { name: "Tricep pushdown", kind: "accessory" },
    { name: "Lateral raises", kind: "accessory" },
  ],
  Pull: [
    { name: "Deadlifts", kind: "compound" }, { name: "Bent-over rows", kind: "compound" },
    { name: "Lat pulldown", kind: "accessory" }, { name: "Face pulls", kind: "accessory" },
    { name: "Bicep curls", kind: "accessory" },
  ],
  Legs: [
    { name: "Back squats", kind: "compound" }, { name: "Leg press", kind: "compound" },
    { name: "Walking lunges", kind: "accessory" }, { name: "Leg curls", kind: "accessory" },
    { name: "Standing calf raises", kind: "accessory" },
  ],
};

const SETS_REPS_BY_LEVEL: Record<Level, Record<ExerciseKind, string>> = {
  Beginner: { compound: "2 x 10", accessory: "2 x 12", core: "2 x 30 sec" },
  Intermediate: { compound: "3 x 8", accessory: "3 x 12", core: "3 x 30 sec" },
  Advanced: { compound: "4 x 6", accessory: "3 x 15", core: "3 x 45 sec" },
};

const CARDIO_BY_GOAL: Record<Goal, { duration: string; detail: string }> = {
  "Weight Loss": { duration: "15–20 min", detail: "Incline walk, bike, or intervals — moderate to high intensity" },
  "Weight Loss + Toning": { duration: "12–15 min", detail: "Steady-state cardio — bike, walk, or rower at a conversational pace" },
  "Muscle Building": { duration: "8–10 min", detail: "Light cardio for recovery — easy walk or bike, keep it low-effort" },
};

const DURATION_BY_LEVEL: Record<Level, number> = { Beginner: 30, Intermediate: 40, Advanced: 50 };

export interface GenerateWorkoutPlanArgs {
  userId: string;
  level: Level;
  daysPerWeek: number;
  location: Location;
  goal: Goal;
}

export async function generateWorkoutPlan({ userId, level, daysPerWeek, location, goal }: GenerateWorkoutPlanArgs) {
  const supabase = createAdminClient();

  const n = SCHEDULE_BY_DAYS[daysPerWeek] ? daysPerWeek : daysPerWeek < 2 ? 2 : 6;
  const activeDays = SCHEDULE_BY_DAYS[n];
  const splitNames = SPLIT_BY_DAYS[n];
  const setsRepsMap = SETS_REPS_BY_LEVEL[level];
  const duration = DURATION_BY_LEVEL[level];
  const cardio = CARDIO_BY_GOAL[goal];
  const locationNote =
    location === "Home" ? "Bodyweight & dumbbells" : location === "Gym" ? "Full gym equipment" : "Home or gym friendly";

  // Retire the previous plan (kept for history, not deleted)
  await supabase.from("workout_plans").update({ is_current: false }).eq("user_id", userId).eq("is_current", true);

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({ user_id: userId, level, days_per_week: n, location, goal, is_current: true })
    .select()
    .single();
  if (planError) throw planError;

  let splitIdx = 0;

  for (let weekday = 0; weekday < 7; weekday++) {
    const isTrainingDay = activeDays.includes(weekday);
    const focus = isTrainingDay ? splitNames[splitIdx++] : null;

    const { data: day, error: dayError } = await supabase
      .from("workout_days")
      .insert({
        workout_plan_id: plan.id,
        weekday,
        is_rest: !isTrainingDay,
        focus,
        duration_minutes: isTrainingDay ? duration : null,
        recovery_note: isTrainingDay ? null : "Optional 20–30 min walk, stretch, or mobility work",
      })
      .select()
      .single();
    if (dayError) throw dayError;

    if (!isTrainingDay) continue;

    const exercises = (EXERCISE_BANK[focus!] || []).map((ex, i) => ({
      workout_day_id: day.id,
      name: ex.name,
      kind: ex.kind,
      sets: parseInt(setsRepsMap[ex.kind].split(" x ")[0], 10),
      reps: setsRepsMap[ex.kind].split(" x ")[1],
      sort_order: i,
    }));
    const { error: exError } = await supabase.from("workout_exercises").insert(exercises);
    if (exError) throw exError;

    const { error: cardioError } = await supabase
      .from("cardio_sessions")
      .insert({ workout_day_id: day.id, duration_text: cardio.duration, detail: cardio.detail });
    if (cardioError) throw cardioError;
  }

  return plan;
}
