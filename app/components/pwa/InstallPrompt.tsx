"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DISMISS_KEY = "mfj_install_banner_dismissed_at";
const DISMISS_COOLDOWN_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for "launched from home screen"
    (window.navigator as any).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return days < DISMISS_COOLDOWN_DAYS;
}

type PwaEventType = "banner_shown" | "install_accepted" | "banner_dismissed";

// Fire-and-forget — install telemetry should never block or break the UI.
// Table accepts anonymous inserts (see migration 0013), so this works
// whether or not the visitor is logged in yet.
async function trackPwaEvent(eventType: PwaEventType, platform: "android" | "ios" | "other") {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("pwa_install_events").insert({
      user_id: userData?.user?.id ?? null,
      platform,
      event_type: eventType,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // Analytics failure should never surface to the user
  }
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<"none" | "android" | "ios">("none");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed — never show
    if (recentlyDismissed()) return;

    if (isIOS()) {
      setPlatform("ios");
      setVisible(true);
      trackPwaEvent("banner_shown", "ios");
      return;
    }

    // Android/Chrome: wait for the browser's native install signal
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setVisible(true);
      trackPwaEvent("banner_shown", "android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    trackPwaEvent("banner_dismissed", platform === "none" ? "other" : platform);
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      trackPwaEvent("install_accepted", "android");
      setVisible(false);
    } else {
      trackPwaEvent("banner_dismissed", "android");
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 50,
        maxWidth: 398,
        margin: "0 auto",
        borderRadius: 20,
        background: "#1F2937",
        color: "#fff",
        padding: "16px 16px 16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 12px 32px -8px rgba(0,0,0,0.35)",
        fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
      }}
    >
      <img
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        style={{ borderRadius: 10, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Install My Fit Journey</div>
        {platform === "ios" ? (
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, lineHeight: 1.4 }}>
            Tap <strong>Share</strong> <span aria-hidden>􀈂</span>, then{" "}
            <strong>Add to Home Screen</strong>
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Faster access, works offline
          </div>
        )}
      </div>

      {platform === "android" && (
        <button
          onClick={install}
          style={{
            background: "#34C759",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          opacity: 0.5,
          fontSize: 18,
          lineHeight: 1,
          padding: 4,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
