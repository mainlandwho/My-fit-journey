import { fontBody, ink, mist, green } from "@/lib/design-tokens";
import { HTMLAttributes } from "react";

export function Card({ className = "", style, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl bg-white ${className}`}
      style={{ boxShadow: "0 2px 20px -4px rgba(31,41,55,0.08)", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function Pill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: active ? green : mist, color: active ? "#fff" : ink, ...fontBody }}
    >
      {children}
    </span>
  );
}

interface Ring {
  pct: number;
  color: string;
  label: string;
}

const DEFAULT_RINGS: Ring[] = [
  { pct: 0.72, color: green, label: "Fuel" },
  { pct: 0.5, color: "#FF9F43", label: "Move" },
  { pct: 0.86, color: "#4DA3FF", label: "Water" },
];

export function JourneyRing({
  size = 220,
  rings = DEFAULT_RINGS,
  center,
  dark = false,
}: {
  size?: number;
  rings?: Ring[];
  center?: React.ReactNode;
  dark?: boolean;
}) {
  const stroke = size * 0.075;
  const gap = stroke * 0.35;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {rings.map((r, i) => {
          const radius = size / 2 - stroke / 2 - i * (stroke + gap);
          const circ = 2 * Math.PI * radius;
          return (
            <g key={i}>
              <circle cx={size / 2} cy={size / 2} r={radius} stroke={dark ? "rgba(255,255,255,0.12)" : "rgba(31,41,55,0.08)"} strokeWidth={stroke} fill="none" />
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={r.color} strokeWidth={stroke} fill="none"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - r.pct)}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {center}
      </div>
    </div>
  );
}
