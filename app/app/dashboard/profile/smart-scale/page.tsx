import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { SubScreenHeader } from "@/components/dashboard/SubScreenHeader";
import { ink, greenDeep, fontDisplay } from "@/lib/design-tokens";

const OTHER_BRANDS = ["Withings", "Renpho", "Eufy", "Fitbit", "Garmin"];

export default async function SmartScalePage() {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description, price_cents")
    .eq("category", "smart_scale")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <div className="px-6 pt-6 pb-28">
      <SubScreenHeader title="Smart Scale" />
      <Card className="p-4 mb-5">
        <p className="text-xs opacity-60 leading-relaxed">
          No scale connected yet — your weight, body fat %, and visceral fat are logged manually from the Progress tab. There is no automatic sync in this app.
        </p>
      </Card>

      {product && (
        <Card className="p-5 mb-5" style={{ border: `2px solid ${greenDeep}22` }}>
          <div className="flex items-baseline justify-between">
            <span className="font-bold" style={{ color: ink, ...fontDisplay }}>{product.name}</span>
            <span className="font-extrabold text-lg" style={{ color: greenDeep, ...fontDisplay }}>${(product.price_cents / 100).toFixed(0)}</span>
          </div>
          <p className="text-xs opacity-60 mt-2">{product.description}</p>
          <Button variant="primary" className="w-full mt-4">Buy now</Button>
        </Card>
      )}

      <h3 className="text-sm font-bold mb-3 opacity-70">Bluetooth & Wi-Fi scales</h3>
      <div className="flex flex-col gap-2.5">
        {OTHER_BRANDS.map((b) => (
          <Card key={b} className="p-4 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: ink }}>{b}</span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "#F5F5F5", color: `${ink}66` }}>Coming soon</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
