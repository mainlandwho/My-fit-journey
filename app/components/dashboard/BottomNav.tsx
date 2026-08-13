"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, UtensilsCrossed, Sparkles, User } from "lucide-react";
import { green, ink } from "@/lib/design-tokens";

const TABS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/progress", icon: LineChart, label: "Progress" },
  { href: "/dashboard/meals", icon: UtensilsCrossed, label: "Meals" },
  { href: "/dashboard/coach", icon: Sparkles, label: "Coach" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-around py-2.5 bg-white z-40" style={{ boxShadow: "0 -4px 20px -6px rgba(0,0,0,0.1)" }}>
      {TABS.map((t) => {
        const active = t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className="flex flex-col items-center gap-1 px-2 py-1">
            <Icon size={20} color={active ? green : `${ink}66`} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium" style={{ color: active ? green : `${ink}66` }}>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
