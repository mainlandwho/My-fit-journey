"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/primitives";
import { LogEntryForm } from "@/components/dashboard/LogEntryForm";
import { ink, mist, green, greenDeep } from "@/lib/design-tokens";
import { kgToLbs } from "@/lib/units";
import { Camera } from "lucide-react";

interface Entry {
  recorded_at: string;
  weight_kg: number;
  body_fat_pct: number | null;
  visceral_fat_rating: number | null;
}

export function ProgressClient({ entries }: { entries: Entry[] }) {
  const [showForm, setShowForm] = useState(false);
  const latest = entries[entries.length - 1];
  const toLbs = (kg: number) => Math.round(kgToLbs(kg) * 10) / 10;
  const chartData = entries.map((e) => ({ d: e.recorded_at.slice(5), w: toLbs(e.weight_kg) }));
  const change = entries.length >= 2 ? (toLbs(entries[entries.length - 1].weight_kg) - toLbs(entries[0].weight_kg)).toFixed(1) : null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: ink }}>Progress</h2>
        <button onClick={() => setShowForm(true)} type="button" className="px-3.5 py-2 rounded-xl text-xs font-bold" style={{ background: green, color: "#fff" }}>
          + Log entry
        </button>
      </div>

      <Card className="p-4 mb-4" style={{ border: `1.5px solid ${mist}` }}>
        <span className="text-xs font-semibold opacity-50">Manual entry only</span>
        <p className="text-xs opacity-50 mt-1">Your scale isn&apos;t connected — weight, body fat %, and visceral fat are logged by hand.</p>
      </Card>

      {entries.length === 0 ? (
        <Card className="p-6 text-center text-sm opacity-50">No entries yet — log your first one above.</Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-semibold opacity-60">Weight trend</span>
              {change && <span className="text-xs font-bold" style={{ color: green }}>{Number(change) <= 0 ? change : `+${change}`} lb</span>}
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={green} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={mist} />
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: `${ink}88` }} axisLine={false} tickLine={false} />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 11, fill: `${ink}88` }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="w" stroke={greenDeep} strokeWidth={2.5} fill="url(#wgrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card className="p-4"><div className="text-[11px] opacity-50 font-medium">Current weight</div><div className="text-lg font-extrabold mt-1" style={{ color: ink }}>{toLbs(latest.weight_kg)} lb</div></Card>
            <Card className="p-4"><div className="text-[11px] opacity-50 font-medium">Body fat %</div><div className="text-lg font-extrabold mt-1" style={{ color: ink }}>{latest.body_fat_pct ?? "—"}</div></Card>
            <Card className="p-4"><div className="text-[11px] opacity-50 font-medium">Visceral fat</div><div className="text-lg font-extrabold mt-1" style={{ color: ink }}>{latest.visceral_fat_rating ?? "—"}</div></Card>
            <Card className="p-4"><div className="text-[11px] opacity-50 font-medium">Entries logged</div><div className="text-lg font-extrabold mt-1" style={{ color: ink }}>{entries.length}</div></Card>
          </div>

          <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Entry history</h3>
          <div className="flex flex-col gap-2.5">
            {[...entries].reverse().map((e) => (
              <Card key={e.recorded_at} className="p-4 flex items-center justify-between">
                <span className="text-xs font-semibold opacity-50">{e.recorded_at}</span>
                <div className="flex gap-4 text-sm">
                  <span style={{ color: ink }}>{toLbs(e.weight_kg)} lb</span>
                  <span className="opacity-50">BF {e.body_fat_pct ?? "—"}%</span>
                  <span className="opacity-50">VF {e.visceral_fat_rating ?? "—"}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <h3 className="text-sm font-bold mt-6 mb-3 opacity-70">Progress photos</h3>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl flex items-center justify-center" style={{ background: mist }}>
            <Camera size={20} className="opacity-30" />
          </div>
        ))}
      </div>

      {showForm && <LogEntryForm onClose={() => setShowForm(false)} />}
    </>
  );
}
