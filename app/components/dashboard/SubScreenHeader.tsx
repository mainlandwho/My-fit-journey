import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ink, fontDisplay } from "@/lib/design-tokens";

export function SubScreenHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Link href="/dashboard/profile"><ChevronLeft size={22} color={ink} /></Link>
      <h2 className="text-xl font-extrabold tracking-tight" style={{ ...fontDisplay, color: ink }}>{title}</h2>
    </div>
  );
}
