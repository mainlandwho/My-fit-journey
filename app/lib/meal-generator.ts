import { createAdminClient } from "./supabase/admin";
import { calculateCalorieTarget, type CalorieInput } from "./calorie-calc";

type DietPreference = "Standard" | "Vegetarian" | "Vegan" | "Keto" | "Low Carb" | "Mediterranean";
type MealType = "breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "dinner";

interface Ingredient {
  name: string;
  amount_value: number;
  amount_unit: "g" | "ml" | "tbsp" | "tsp" | "item" | "cup" | "oz";
  display_amount: string;
}

interface MealTemplate {
  meal_type: MealType;
  name: string;
  calories: number; // baseline, at ~1800 cal/day total
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  recipe_instructions: string;
  prep_tips: string;
  ingredients: Ingredient[];
}

// Baseline templates, tuned to sum to ~1800 cal across all 5 slots.
// Scaled at generation time to hit each user's actual calorie target.
// NOTE: Standard / Vegetarian / Vegan are fully modeled below. Keto, Low Carb,
// and Mediterranean currently fall back to the Standard template — swap in
// dedicated templates for those before shipping if diet accuracy matters
// for those users (macros will still roughly track since scaling is applied,
// but ingredients won't reflect the diet).
const TEMPLATES: Record<"Standard" | "Vegetarian" | "Vegan", MealTemplate[]> = {
  Standard: [
    {
      meal_type: "breakfast", name: "Greek yogurt, berries & honey",
      calories: 320, protein_g: 22, carbs_g: 38, fat_g: 8, fiber_g: 4,
      recipe_instructions: "Spoon yogurt into a bowl, top with berries and honey.",
      prep_tips: "Portion into jars the night before for a grab-and-go breakfast.",
      ingredients: [
        { name: "Plain Greek yogurt", amount_value: 200, amount_unit: "g", display_amount: "200 g" },
        { name: "Mixed berries", amount_value: 80, amount_unit: "g", display_amount: "80 g" },
        { name: "Honey", amount_value: 15, amount_unit: "g", display_amount: "1 tbsp (15 g)" },
      ],
    },
    {
      meal_type: "morning_snack", name: "Apple & almond butter",
      calories: 180, protein_g: 4, carbs_g: 20, fat_g: 10, fiber_g: 4,
      recipe_instructions: "Slice apple, serve with almond butter for dipping.",
      prep_tips: "Toss apple slices in lemon juice if prepping ahead to prevent browning.",
      ingredients: [
        { name: "Apple", amount_value: 180, amount_unit: "g", display_amount: "1 medium (180 g)" },
        { name: "Almond butter", amount_value: 16, amount_unit: "g", display_amount: "1 tbsp (16 g)" },
      ],
    },
    {
      meal_type: "lunch", name: "Grilled chicken quinoa bowl",
      calories: 540, protein_g: 42, carbs_g: 48, fat_g: 16, fiber_g: 6,
      recipe_instructions: "Grill chicken breast, serve over quinoa with vegetables, drizzle with olive oil.",
      prep_tips: "Batch-cook chicken and quinoa on Sunday for the whole week.",
      ingredients: [
        { name: "Grilled chicken breast", amount_value: 150, amount_unit: "g", display_amount: "150 g" },
        { name: "Cooked quinoa", amount_value: 120, amount_unit: "g", display_amount: "120 g" },
        { name: "Mixed vegetables", amount_value: 100, amount_unit: "g", display_amount: "100 g" },
        { name: "Olive oil", amount_value: 5, amount_unit: "g", display_amount: "1 tsp (5 g)" },
      ],
    },
    {
      meal_type: "afternoon_snack", name: "Protein shake",
      calories: 160, protein_g: 25, carbs_g: 8, fat_g: 3, fiber_g: 1,
      recipe_instructions: "Blend protein powder with milk or water and ice.",
      prep_tips: "Pre-portion powder into travel scoops for the gym bag.",
      ingredients: [
        { name: "Whey protein powder", amount_value: 30, amount_unit: "g", display_amount: "1 scoop (30 g)" },
        { name: "Skim milk or water", amount_value: 250, amount_unit: "ml", display_amount: "250 ml" },
      ],
    },
    {
      meal_type: "dinner", name: "Baked salmon & roasted veg",
      calories: 610, protein_g: 38, carbs_g: 30, fat_g: 28, fiber_g: 6,
      recipe_instructions: "Bake salmon at 200°C for 12–15 min. Roast sweet potato and broccoli alongside.",
      prep_tips: "Line the tray with parchment for easy cleanup.",
      ingredients: [
        { name: "Salmon fillet", amount_value: 170, amount_unit: "g", display_amount: "170 g" },
        { name: "Roasted sweet potato", amount_value: 150, amount_unit: "g", display_amount: "150 g" },
        { name: "Broccoli", amount_value: 120, amount_unit: "g", display_amount: "120 g" },
        { name: "Olive oil", amount_value: 14, amount_unit: "g", display_amount: "1 tbsp (14 g)" },
      ],
    },
  ],
  Vegetarian: [
    {
      meal_type: "breakfast", name: "Cottage cheese, berries & granola",
      calories: 330, protein_g: 24, carbs_g: 36, fat_g: 9, fiber_g: 4,
      recipe_instructions: "Combine cottage cheese, berries, and granola in a bowl.",
      prep_tips: "Keep granola separate until serving to stay crunchy.",
      ingredients: [
        { name: "Cottage cheese", amount_value: 200, amount_unit: "g", display_amount: "200 g" },
        { name: "Mixed berries", amount_value: 80, amount_unit: "g", display_amount: "80 g" },
        { name: "Granola", amount_value: 25, amount_unit: "g", display_amount: "25 g" },
      ],
    },
    {
      meal_type: "morning_snack", name: "Apple & peanut butter",
      calories: 180, protein_g: 5, carbs_g: 20, fat_g: 9, fiber_g: 4,
      recipe_instructions: "Slice apple, serve with peanut butter for dipping.",
      prep_tips: "Toss apple slices in lemon juice if prepping ahead.",
      ingredients: [
        { name: "Apple", amount_value: 180, amount_unit: "g", display_amount: "1 medium (180 g)" },
        { name: "Peanut butter", amount_value: 16, amount_unit: "g", display_amount: "1 tbsp (16 g)" },
      ],
    },
    {
      meal_type: "lunch", name: "Halloumi & chickpea quinoa bowl",
      calories: 540, protein_g: 28, carbs_g: 58, fat_g: 20, fiber_g: 9,
      recipe_instructions: "Pan-sear halloumi, combine with chickpeas, quinoa, and vegetables.",
      prep_tips: "Halloumi is best seared fresh — prep everything else ahead.",
      ingredients: [
        { name: "Halloumi cheese", amount_value: 100, amount_unit: "g", display_amount: "100 g" },
        { name: "Chickpeas, cooked", amount_value: 100, amount_unit: "g", display_amount: "100 g" },
        { name: "Cooked quinoa", amount_value: 120, amount_unit: "g", display_amount: "120 g" },
        { name: "Mixed vegetables", amount_value: 100, amount_unit: "g", display_amount: "100 g" },
      ],
    },
    {
      meal_type: "afternoon_snack", name: "Protein shake",
      calories: 160, protein_g: 25, carbs_g: 8, fat_g: 3, fiber_g: 1,
      recipe_instructions: "Blend protein powder with milk or water and ice.",
      prep_tips: "Pre-portion powder into travel scoops for the gym bag.",
      ingredients: [
        { name: "Whey protein powder", amount_value: 30, amount_unit: "g", display_amount: "1 scoop (30 g)" },
        { name: "Skim milk or water", amount_value: 250, amount_unit: "ml", display_amount: "250 ml" },
      ],
    },
    {
      meal_type: "dinner", name: "Baked tofu & roasted veg",
      calories: 590, protein_g: 32, carbs_g: 40, fat_g: 26, fiber_g: 8,
      recipe_instructions: "Bake tofu at 200°C for 20 min. Roast sweet potato and broccoli alongside.",
      prep_tips: "Press tofu for 15 minutes before baking for better texture.",
      ingredients: [
        { name: "Firm tofu", amount_value: 200, amount_unit: "g", display_amount: "200 g" },
        { name: "Roasted sweet potato", amount_value: 150, amount_unit: "g", display_amount: "150 g" },
        { name: "Broccoli", amount_value: 120, amount_unit: "g", display_amount: "120 g" },
        { name: "Olive oil", amount_value: 14, amount_unit: "g", display_amount: "1 tbsp (14 g)" },
      ],
    },
  ],
  Vegan: [
    {
      meal_type: "breakfast", name: "Coconut yogurt, berries & chia",
      calories: 310, protein_g: 12, carbs_g: 40, fat_g: 11, fiber_g: 8,
      recipe_instructions: "Combine coconut yogurt, berries, and chia seeds.",
      prep_tips: "Soak chia seeds for 10 minutes for a thicker texture.",
      ingredients: [
        { name: "Coconut yogurt", amount_value: 200, amount_unit: "g", display_amount: "200 g" },
        { name: "Mixed berries", amount_value: 80, amount_unit: "g", display_amount: "80 g" },
        { name: "Chia seeds", amount_value: 12, amount_unit: "g", display_amount: "1 tbsp (12 g)" },
      ],
    },
    {
      meal_type: "morning_snack", name: "Apple & almond butter",
      calories: 180, protein_g: 4, carbs_g: 20, fat_g: 10, fiber_g: 4,
      recipe_instructions: "Slice apple, serve with almond butter for dipping.",
      prep_tips: "Toss apple slices in lemon juice if prepping ahead.",
      ingredients: [
        { name: "Apple", amount_value: 180, amount_unit: "g", display_amount: "1 medium (180 g)" },
        { name: "Almond butter", amount_value: 16, amount_unit: "g", display_amount: "1 tbsp (16 g)" },
      ],
    },
    {
      meal_type: "lunch", name: "Tempeh & black bean quinoa bowl",
      calories: 550, protein_g: 30, carbs_g: 62, fat_g: 18, fiber_g: 12,
      recipe_instructions: "Pan-fry tempeh, combine with black beans, quinoa, and vegetables.",
      prep_tips: "Marinate tempeh for 20 minutes for more flavor.",
      ingredients: [
        { name: "Tempeh", amount_value: 120, amount_unit: "g", display_amount: "120 g" },
        { name: "Black beans, cooked", amount_value: 100, amount_unit: "g", display_amount: "100 g" },
        { name: "Cooked quinoa", amount_value: 120, amount_unit: "g", display_amount: "120 g" },
        { name: "Mixed vegetables", amount_value: 100, amount_unit: "g", display_amount: "100 g" },
      ],
    },
    {
      meal_type: "afternoon_snack", name: "Plant protein shake",
      calories: 160, protein_g: 22, carbs_g: 10, fat_g: 4, fiber_g: 2,
      recipe_instructions: "Blend plant protein powder with plant milk and ice.",
      prep_tips: "Pre-portion powder into travel scoops for the gym bag.",
      ingredients: [
        { name: "Plant protein powder", amount_value: 30, amount_unit: "g", display_amount: "1 scoop (30 g)" },
        { name: "Oat or almond milk", amount_value: 250, amount_unit: "ml", display_amount: "250 ml" },
      ],
    },
    {
      meal_type: "dinner", name: "Baked tofu & roasted veg",
      calories: 580, protein_g: 30, carbs_g: 42, fat_g: 24, fiber_g: 9,
      recipe_instructions: "Bake tofu at 200°C for 20 min. Roast sweet potato and broccoli alongside.",
      prep_tips: "Press tofu for 15 minutes before baking for better texture.",
      ingredients: [
        { name: "Firm tofu", amount_value: 200, amount_unit: "g", display_amount: "200 g" },
        { name: "Roasted sweet potato", amount_value: 150, amount_unit: "g", display_amount: "150 g" },
        { name: "Broccoli", amount_value: 120, amount_unit: "g", display_amount: "120 g" },
        { name: "Olive oil", amount_value: 14, amount_unit: "g", display_amount: "1 tbsp (14 g)" },
      ],
    },
  ],
};

function resolveTemplateKey(diet: DietPreference): "Standard" | "Vegetarian" | "Vegan" {
  if (diet === "Vegetarian" || diet === "Vegan") return diet;
  return "Standard"; // Keto / Low Carb / Mediterranean fall back — see note above
}

export interface GenerateMealPlanArgs {
  userId: string;
  planDate: string; // 'YYYY-MM-DD'
  profile: CalorieInput & { diet_preference: DietPreference; meals_per_day: number };
}

export async function generateMealPlan({ userId, planDate, profile }: GenerateMealPlanArgs) {
  const supabase = createAdminClient();
  const { calorieTarget, proteinG, carbG, fatG } = calculateCalorieTarget(profile);

  const templateKey = resolveTemplateKey(profile.diet_preference);
  let meals = [...TEMPLATES[templateKey]];

  // Trim snacks first if the user wants fewer than 5 meals/day
  if (profile.meals_per_day <= 4) meals = meals.filter((m) => m.meal_type !== "afternoon_snack");
  if (profile.meals_per_day <= 3) meals = meals.filter((m) => m.meal_type !== "morning_snack");

  const baselineTotal = meals.reduce((sum, m) => sum + m.calories, 0);
  const scale = calorieTarget / baselineTotal;

  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .upsert(
      {
        user_id: userId,
        plan_date: planDate,
        calorie_target: calorieTarget,
        protein_target_g: proteinG,
        carb_target_g: carbG,
        fat_target_g: fatG,
      },
      { onConflict: "user_id,plan_date" }
    )
    .select()
    .single();

  if (planError) throw planError;

  // Clear any previously generated meals for this plan (regeneration case)
  await supabase.from("meals").delete().eq("meal_plan_id", plan.id);

  for (const [i, template] of meals.entries()) {
    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({
        meal_plan_id: plan.id,
        meal_type: template.meal_type,
        name: template.name,
        calories: Math.round(template.calories * scale),
        protein_g: Math.round(template.protein_g * scale * 10) / 10,
        carbs_g: Math.round(template.carbs_g * scale * 10) / 10,
        fat_g: Math.round(template.fat_g * scale * 10) / 10,
        fiber_g: Math.round(template.fiber_g * scale * 10) / 10,
        recipe_instructions: template.recipe_instructions,
        prep_tips: template.prep_tips,
        sort_order: i,
      })
      .select()
      .single();

    if (mealError) throw mealError;

    const ingredientRows = template.ingredients.map((ing, j) => ({
      meal_id: meal.id,
      name: ing.name,
      amount_value: Math.round(ing.amount_value * scale * 10) / 10,
      amount_unit: ing.amount_unit,
      display_amount: `${Math.round(ing.amount_value * scale)} ${ing.amount_unit}`,
      sort_order: j,
    }));

    const { error: ingError } = await supabase.from("meal_ingredients").insert(ingredientRows);
    if (ingError) throw ingError;
  }

  return plan;
}
