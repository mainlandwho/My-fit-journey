"use client";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;

  // Real iPhone/iPod always identify themselves correctly.
  if (/iphone|ipod/i.test(ua)) return true;

  // iPadOS 13+ defaults to a DESKTOP user-agent string (reports as "Macintosh")
  // so websites serve the desktop layout by default. That means `/ipad/i`
  // in the UA won't match on a real iPad running default settings — the
  // standard workaround is checking for Mac-like UA + touch support, since
  // actual Macs report 0 max touch points and iPads report >1.
  const looksLikeMac = /macintosh|mac os x/i.test(ua);
  const hasTouch = navigator.maxTouchPoints > 1;
  return looksLikeMac && hasTouch;
}

export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
}
