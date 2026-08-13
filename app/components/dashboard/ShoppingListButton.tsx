"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { ink, mist, green, fontBody, fontDisplay, fontMono } from "@/lib/design-tokens";
import { Check, X } from "lucide-react";

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

interface Item {
  ingredient_name: string;
  display_amount: string;
  is_checked: boolean;
}

export function ShoppingListButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const openList = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const weekStart = mondayOf(new Date());

    const { error: fnError } = await supabase.functions.invoke("generate-shopping-list", {
      body: { weekStart },
    });
    if (fnError) {
      setError("Couldn't generate the list — showing what's saved so far.");
    }

    const { data } = await supabase
      .from("shopping_list_items")
      .select("ingredient_name, display_amount, is_checked")
      .eq("week_start", weekStart)
      .order("ingredient_name");

    setItems(data ?? []);
    setLoading(false);
  };

  const toggle = async (name: string, current: boolean) => {
    setItems((prev) => prev.map((i) => (i.ingredient_name === name ? { ...i, is_checked: !current } : i)));
    const supabase = createClient();
    const weekStart = mondayOf(new Date());
    await supabase
      .from("shopping_list_items")
      .update({ is_checked: !current })
      .eq("week_start", weekStart)
      .eq("ingredient_name", name);
  };

  return (
    <>
      <Button variant="dark" className="w-full mt-5" onClick={openList}>View shopping list</Button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(31,41,55,0.45)" }}>
          <div className="w-full mx-auto rounded-t-3xl bg-white p-6 overflow-y-auto" style={{ maxWidth: 430, maxHeight: "85vh", ...fontBody }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-extrabold tracking-tight" style={{ ...fontDisplay, color: ink }}>Shopping list</h3>
              <button onClick={() => setOpen(false)} type="button"><X size={20} color={ink} /></button>
            </div>
            <p className="text-xs opacity-50 mb-5">Aggregated from this week&apos;s meal plans.</p>

            {loading ? (
              <p className="text-sm opacity-50 text-center py-8">Generating…</p>
            ) : error ? (
              <p className="text-sm text-center py-4" style={{ color: "#DC2626" }}>{error}</p>
            ) : items.length === 0 ? (
              <p className="text-sm opacity-50 text-center py-8">No meal plans found for this week yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((ing) => (
                  <button key={ing.ingredient_name} onClick={() => toggle(ing.ingredient_name, ing.is_checked)} type="button" className="w-full text-left">
                    <Card className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={ing.is_checked ? { background: green } : { background: mist }}>
                          {ing.is_checked && <Check size={12} color="#fff" />}
                        </div>
                        <span className="text-sm font-medium" style={ing.is_checked ? { color: `${ink}55`, textDecoration: "line-through" } : { color: ink }}>{ing.ingredient_name}</span>
                      </div>
                      <span className="text-xs font-semibold opacity-50" style={fontMono}>{ing.display_amount}</span>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
