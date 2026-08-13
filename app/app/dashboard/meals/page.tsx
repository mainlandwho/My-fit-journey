import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { ShoppingListButton } from "@/components/dashboard/ShoppingListButton";
import { ink, greenDeep, fontMono, fontDisplay } from "@/lib/design-tokens";

export default async function MealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*, meals(*, meal_ingredients(*))")
    .eq("user_id", user!.id)
    .eq("plan_date", today)
    .maybeSingle();

  const meals = (plan?.meals ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);

  return (
    <div className="px-6 pt-6 pb-28">
      <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ ...fontDisplay, color: ink }}>Today&apos;s meal plan</h2>
      {plan ? (
        <p className="text-sm opacity-50 mb-4">
          {plan.calorie_target} cal · P{plan.protein_target_g}g / C{plan.carb_target_g}g / F{plan.fat_target_g}g
        </p>
      ) : (
        <p className="text-sm opacity-50 mb-4">No meal plan generated yet.</p>
      )}

      {meals.length === 0 ? (
        <Card className="p-6 text-center text-sm opacity-50">
          Your meal plan is generated automatically after checkout. Check back soon, or contact support if this persists.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map((m: any) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold opacity-40 uppercase tracking-wide">{m.meal_type.replace("_", " ")}</div>
                <div className="text-xs font-bold" style={{ color: greenDeep }}>{m.calories} cal</div>
              </div>
              <div className="font-semibold text-[14.5px] mt-0.5" style={{ color: ink }}>{m.name}</div>
              <div className="flex gap-3 mt-2 text-[11px] opacity-50">
                <span>P {m.protein_g}g</span><span>C {m.carbs_g}g</span><span>F {m.fat_g}g</span>
              </div>
              {m.meal_ingredients?.length > 0 && (
                <div className="mt-3 pt-3 flex flex-col gap-1" style={{ borderTop: "1px solid #F5F5F5" }}>
                  {m.meal_ingredients
                    .sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((ing: any) => (
                      <div key={ing.id} className="flex items-center justify-between text-[12.5px]">
                        <span className="opacity-70" style={{ color: ink }}>{ing.name}</span>
                        <span className="font-semibold opacity-60" style={fontMono}>{ing.display_amount}</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ShoppingListButton />
    </div>
  );
}
