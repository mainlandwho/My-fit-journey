"use client";

import { fontBody, ink, green, greenDeep } from "@/lib/design-tokens";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "dark" | "ghost" | "ghostLight";
}

const styles: Record<string, React.CSSProperties> = {
  primary: { background: `linear-gradient(135deg, ${green}, ${greenDeep})`, color: "#fff", boxShadow: "0 8px 20px -6px rgba(52,199,89,0.55)" },
  dark: { background: ink, color: "#fff" },
  ghost: { background: "transparent", color: ink, border: `1.5px solid ${ink}22` },
  ghostLight: { background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" },
};

export function Button({ variant = "primary", className = "", style, children, ...props }: ButtonProps) {
  return (
    <button
      className={`px-6 py-3.5 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-40 ${className}`}
      style={{ ...fontBody, ...styles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
