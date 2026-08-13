// Mifflin-St Jeor BMR + activity multiplier + goal-based adjustment.
// Mirrors the "1,840 cal / 40-30-30" numbers shown in the prototype,
// but computed per-user instead of hardcoded.

export type Gender = "Female" | "Male" | "Other" | "Prefer not to say";
export type ActivityLevel = "Sedentary" | "Lightly active" | "Moderately active" | "Very active";
export type PrimaryGoal = "Weight Loss" | "Weight Loss + Toning" | "Muscle Building";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  "Lightly active": 1.375,
  "Moderately active": 1.55,
  "Very active": 1.725,
};

// Calorie adjustment relative to maintenance (TDEE)
const GOAL_ADJUSTMENT: Record<PrimaryGoal, number> = {
  "Weight Loss": -500,
  "Weight Loss + Toning": -350,
  "Muscle Building": 300,
};

// Macro split (protein / carbs / fat) as % of total calories
const GOAL_MACROS: Record<PrimaryGoal, { protein: number; carbs: number; fat: number }> = {
  "Weight Loss": { protein: 0.4, carbs: 0.3, fat: 0.3 },
  "Weight Loss + Toning": { protein: 0.4, carbs: 0.3, fat: 0.3 },
  "Muscle Building": { protein: 0.35, carbs: 0.4, fat: 0.25 },
};

export interface CalorieInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: PrimaryGoal;
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

export function calculateCalorieTarget(input: CalorieInput): CalorieResult {
  const { weightKg, heightCm, age, gender, activityLevel, goal } = input;

  // Mifflin-St Jeor. "Other"/"Prefer not to say" use the average of male/female offsets.
  const genderOffset = gender === "Male" ? 5 : gender === "Female" ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;

  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];
  let calorieTarget = Math.round(tdee + GOAL_ADJUSTMENT[goal]);

  // Safety floor — never recommend an unsafely low calorie target
  const floor = gender === "Male" ? 1500 : 1200;
  calorieTarget = Math.max(calorieTarget, floor);

  const macros = GOAL_MACROS[goal];
  const proteinG = Math.round((calorieTarget * macros.protein) / 4);
  const carbG = Math.round((calorieTarget * macros.carbs) / 4);
  const fatG = Math.round((calorieTarget * macros.fat) / 9);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    proteinG,
    carbG,
    fatG,
  };
}
