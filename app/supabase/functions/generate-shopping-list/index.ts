// Deno edge function — deploy with: supabase functions deploy generate-shopping-list
// Invoke from the client (authenticated) or on a schedule.
// Aggregates all meal_ingredients across the given week's meal_plans into
// shopping_list_items, combining duplicate ingredients by name + unit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: userData, error: userError } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  ).auth.getUser();

  if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
  const userId = userData.user.id;

  const { weekStart } = await req.json(); // 'YYYY-MM-DD', a Monday
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const { data: plans, error: plansError } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .gte("plan_date", weekStart)
    .lte("plan_date", weekEndDate.toISOString().slice(0, 10));

  if (plansError) return new Response(plansError.message, { status: 500 });
  if (!plans?.length) {
    return new Response(JSON.stringify({ items: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  const planIds = plans.map((p) => p.id);

  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("id")
    .in("meal_plan_id", planIds);
  if (mealsError) return new Response(mealsError.message, { status: 500 });

  const mealIds = (meals ?? []).map((m) => m.id);
  if (!mealIds.length) {
    return new Response(JSON.stringify({ items: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  const { data: ingredients, error: ingError } = await supabase
    .from("meal_ingredients")
    .select("name, amount_value, amount_unit, display_amount")
    .in("meal_id", mealIds);
  if (ingError) return new Response(ingError.message, { status: 500 });

  // Combine duplicates: same name + unit → sum amount_value
  const combined = new Map<string, { name: string; amount_unit: string; total: number }>();
  for (const ing of ingredients ?? []) {
    const key = `${ing.name}::${ing.amount_unit}`;
    const existing = combined.get(key);
    if (existing) {
      existing.total += Number(ing.amount_value ?? 0);
    } else {
      combined.set(key, { name: ing.name, amount_unit: ing.amount_unit, total: Number(ing.amount_value ?? 0) });
    }
  }

  const rows = Array.from(combined.values()).map((item) => ({
    user_id: userId,
    week_start: weekStart,
    ingredient_name: item.name,
    total_amount: item.total,
    amount_unit: item.amount_unit,
    display_amount: `${Math.round(item.total * 10) / 10} ${item.amount_unit}`,
  }));

  const { error: upsertError } = await supabase
    .from("shopping_list_items")
    .upsert(rows, { onConflict: "user_id,week_start,ingredient_name" });

  if (upsertError) return new Response(upsertError.message, { status: 500 });

  return new Response(JSON.stringify({ items: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
