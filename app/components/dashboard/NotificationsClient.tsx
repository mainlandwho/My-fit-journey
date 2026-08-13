"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/primitives";
import { SubScreenHeader } from "@/components/dashboard/SubScreenHeader";
import { ink, green, mist } from "@/lib/design-tokens";

interface Prefs {
  water_reminders: boolean;
  meal_reminders: boolean;
  workout_reminders: boolean;
  weekly_weigh_in: boolean;
  motivational_messages: boolean;
  vip_trainer_messages: boolean;
}

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!on)} type="button" className="w-11 h-6 rounded-full relative transition-all shrink-0" style={{ background: disabled ? `${ink}1a` : on ? green : mist }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: on ? 22 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

export function NotificationsClient({ initialPrefs, isVIP }: { initialPrefs: Prefs; isVIP: boolean }) {
  const [prefs, setPrefs] = useState(initialPrefs);

  const set = async (key: keyof Prefs, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("notification_preferences").update({ [key]: value }).eq("user_id", user!.id);
  };

  const rows: { key: keyof Prefs; label: string }[] = [
    { key: "water_reminders", label: "Drink water reminders" },
    { key: "meal_reminders", label: "Meal reminders" },
    { key: "workout_reminders", label: "Workout reminders" },
    { key: "weekly_weigh_in", label: "Weekly weigh-in" },
    { key: "motivational_messages", label: "Motivational messages" },
  ];

  return (
    <div className="px-6 pt-6 pb-28">
      <SubScreenHeader title="Notifications" />
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <Card key={r.key} className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: ink }}>{r.label}</span>
            <Switch on={prefs[r.key]} onChange={(v) => set(r.key, v)} />
          </Card>
        ))}
        <Card className="p-4 flex items-center justify-between" style={!isVIP ? { opacity: 0.5 } : {}}>
          <div>
            <span className="text-sm font-medium" style={{ color: ink }}>VIP trainer messages</span>
            {!isVIP && <div className="text-[11px] opacity-60 mt-0.5">Upgrade to VIP Coaching to enable</div>}
          </div>
          <Switch on={prefs.vip_trainer_messages} onChange={(v) => set("vip_trainer_messages", v)} disabled={!isVIP} />
        </Card>
      </div>
    </div>
  );
}
