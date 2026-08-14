"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, JourneyRing } from "@/components/ui/primitives";
import { ink, mist, green, fontBody, fontDisplay } from "@/lib/design-tokens";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const ONBOARD_STEPS = ["Goal", "About you", "Body", "Lifestyle", "Health", "Review"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">{label}</div>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} type="button"
          className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
          style={value === o ? { background: green, color: "#fff" } : { background: mist, color: ink }}>
          {o}
        
