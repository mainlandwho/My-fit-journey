"use client";

import { useEffect } from "react";

/**
 * Registers /public/sw.js. Mount <RegisterServiceWorker /> once, near the
 * root of the app (see app/layout.tsx), inside a Client Component boundary.
 */
export function useRegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Avoid double-registration in dev (React strict mode mounts effects twice)
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("Service worker registration failed:", err));
  }, []);
}
