"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ink, mist, greenDeep } from "@/lib/design-tokens";

interface Trainer {
  id: string;
  full_name: string;
  certification: string | null;
  is_active: boolean;
  clientCount: number;
}

export function TrainersClient({ initialTrainers }: { initialTrainers: Trainer[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [certification, setCertification] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!fullName) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, certification }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to add trainer");
      setSaving(false);
      return;
    }
    setFullName(""); setCertification("");
    setSaving(false);
    router.refresh();
  };

  return (
    <div>
      <div className="rounded-2xl bg-white p-5 mb-6" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
        <div className="text-sm font-bold mb-3" style={{ color: ink }}>Add trainer</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: mist, color: ink }} />
          <input placeholder="Certification" value={certification} onChange={(e) => setCertification(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: mist, color: ink }} />
        </div>
        {error && <p className="text-xs mb-2" style={{ color: "#DC2626" }}>{error}</p>}
        <Button variant="primary" disabled={saving || !fullName} onClick={create} className="!py-2.5 !px-5 text-sm">
          {saving ? "Adding…" : "Add trainer"}
        </Button>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)" }}>
        {initialTrainers.length === 0 ? (
          <div className="p-8 text-center text-sm opacity-40">No trainers yet — VIP upgrades won&apos;t assign anyone until one exists.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: mist }}>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Name</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Certification</th>
                <th className="text-left px-5 py-3 font-semibold opacity-50 text-xs">Active clients</th>
              </tr>
            </thead>
            <tbody>
              {initialTrainers.map((t) => (
                <tr key={t.id} style={{ borderTop: `1px solid ${mist}` }}>
                  <td className="px-5 py-3 font-medium" style={{ color: ink }}>{t.full_name}</td>
                  <td className="px-5 py-3 opacity-70">{t.certification || "—"}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: greenDeep }}>{t.clientCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
