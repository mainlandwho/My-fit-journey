"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ink, mist, fontBody, fontDisplay } from "@/lib/design-tokens";
import { lbsToKg } from "@/lib/units";
import { X } from "lucide-react";

export function LogEntryForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = weight !== "";

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not signed in"); setSaving(false); return; }

    const { error: insertError } = await supabase.from("body_metrics").upsert(
      {
        user_id: user.id,
        recorded_at: new Date().toISOString().slice(0, 10),
        weight_kg: Math.round(lbsToKg(Number(weight)) * 10) / 10,
        body_fat_pct: bodyFat ? Number(bodyFat) : null,
        visceral_fat_rating: visceralFat ? Number(visceralFat) : null,
      },
      { onConflict: "user_id,recorded_at" }
    );

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(31,41,55,0.45)" }}>
      <div className="w-full mx-auto rounded-t-3xl bg-white p-6" style={{ maxWidth: 430, ...fontBody }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-extrabold tracking-tight" style={{ ...fontDisplay, color: ink }}>Log today&apos;s numbers</h3>
          <button onClick={onClose} type="button"><X size={20} color={ink} /></button>
        </div>
        <p className="text-xs opacity-50 mb-5">Not using a connected scale yet — enter these by hand.</p>

        <div className="mb-4">
          <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">Weight (required)</div>
          <div className="flex items-center rounded-xl px-4" style={{ background: mist }}>
            <input inputMode="decimal" className="flex-1 py-3 bg-transparent text-[15px] outline-none" style={{ color: ink }} placeholder="e.g. 160" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <span className="text-xs opacity-40 font-medium">lb</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">Body fat %</div>
          <div className="flex items-center rounded-xl px-4" style={{ background: mist }}>
            <input inputMode="decimal" className="flex-1 py-3 bg-transparent text-[15px] outline-none" style={{ color: ink }} placeholder="e.g. 24.8 (optional)" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            <span className="text-xs opacity-40 font-medium">%</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">Visceral fat rating</div>
          <div className="flex items-center rounded-xl px-4" style={{ background: mist }}>
            <input inputMode="numeric" className="flex-1 py-3 bg-transparent text-[15px] outline-none" style={{ color: ink }} placeholder="e.g. 9 (optional)" value={visceralFat} onChange={(e) => setVisceralFat(e.target.value)} />
            <span className="text-xs opacity-40 font-medium">rating</span>
          </div>
        </div>

        {error && <p className="text-sm mb-3" style={{ color: "#DC2626" }}>{error}</p>}

        <Button variant="primary" className="w-full" disabled={!canSave || saving} onClick={save}>
          {saving ? "Saving…" : "Save entry"}
        </Button>
      </div>
    </div>
  );
}
