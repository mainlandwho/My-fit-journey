// public/sw.js
// Registered from app/layout.tsx (see lib/pwa/register-sw.ts).
//
// Strategy:
// - App shell (static assets) → cache-first, so the installed app opens
//   instantly even on a flaky connection.
// - API / Supabase calls → network-first, always falling through to the
//   network so meal plans, workouts, and body metrics are never served
//   stale. If the network fails, we don't fake a response — health/fitness
//   data going stale silently is worse than showing an offline state.
// - Navigation requests that fail offline → fall back to /offline.

const CACHE_VERSION = "v1";
const SHELL_CACHE = `myfitjourney-shell-${CACHE_VERSION}`;

const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("myfitjourney-") && key !== SHELL_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isApiOrDataRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname.endsWith(".supabase.co")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never cache mutations

  const url = new URL(request.url);

  // Never cache API/Supabase data — always go to the network.
  if (isApiOrDataRequest(url)) {
    event.respondWith(
      fetch(request).catch(
        () => new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Navigations (loading a page): network-first, offline fallback page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );
    return;
  }

  // Static assets (JS/CSS/images/fonts): cache-first.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
