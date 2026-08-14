"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { ink, mist, green, fontDisplay } from "@/lib/design-tokens";
import { isStandalone, isIOS, isAndroid } from "@/lib/pwa/detect";
import { Download, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppRow() {
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    if (isIOS()) setPlatform("ios");
    else if (isAndroid()) setPlatform("android");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleTap = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    if (platform === "ios") {
      setShowIosSteps(true);
      return;
    }
    // Android/desktop Chrome without a captured prompt yet, or any other
    // browser — there's no programmatic fallback, so just explain it.
    setShowIosSteps(true);
  };

  if (installed) {
    return (
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${green}1a` }}>
            <Check size={16} color={green} />
          </div>
          <span className="text-sm font-medium" style={{ color: ink }}>App installed</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <button onClick={handleTap} type="button" className="w-full text-left">
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: mist }}>
              <Download size={16} color={ink} />
            </div>
            <span className="text-sm font-medium" style={{ color: ink }}>Install App</span>
          </div>
        </Card>
      </button>

      {showIosSteps && (
        <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(31,41,55,0.45)" }}>
          <div className="w-full mx-auto rounded-t-3xl bg-white p-6" style={{ maxWidth: 430 }}>
            <h3 className="text-lg font-extrabold tracking-tight mb-4" style={{ ...fontDisplay, color: ink }}>Install My Fit Journey</h3>
            {platform === "ios" ? (
              <ol className="text-sm space-y-2.5 mb-5" style={{ color: ink }}>
                <li>1. Tap the <strong>Share</strong> button in Safari's toolbar</li>
                <li>2. Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>3. Tap <strong>Add</strong> — done!</li>
              </ol>
            ) : (
              <p className="text-sm mb-5 opacity-70" style={{ color: ink }}>
                Open your browser's menu and look for <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
              </p>
            )}
            <Button variant="primary" className="w-full" onClick={() => setShowIosSteps(false)}>Got it</Button>
          </div>
        </div>
      )}
    </>
  );
}
