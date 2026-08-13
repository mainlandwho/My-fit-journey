"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/upgrade", { method: "POST" });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setLoading(false);
  };

  return (
    <Button variant="primary" className="w-full mt-4" disabled={loading} onClick={upgrade}>
      {loading ? "Redirecting to checkout…" : <>Upgrade to VIP Coaching <ArrowRight size={17} /></>}
    </Button>
  );
}
