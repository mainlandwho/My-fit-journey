"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ink, mist, fontBody, fontDisplay } from "@/lib/design-tokens";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    fetch(`/api/auth/exchange?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("exchange failed");
        return res.json();
      })
      .then(({ magicLink }) => {
        // Consuming this URL is what actually sets the Supabase session cookie
        window.location.href = magicLink;
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
        textAlign: "center", background: "#fff", ...fontBody,
      }}
    >
      {status === "loading" ? (
        <>
          <div
            style={{
              width: 40, height: 40, borderRadius: "50%",
              border: `3px solid ${mist}`, borderTopColor: "#34C759",
              animation: "spin 0.8s linear infinite", marginBottom: 20,
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h1 style={{ ...fontDisplay, fontSize: 18, fontWeight: 800, color: ink }}>
            Setting up your account…
          </h1>
          <p style={{ fontSize: 13, opacity: 0.5, marginTop: 6 }}>This only takes a second.</p>
        </>
      ) : (
        <>
          <h1 style={{ ...fontDisplay, fontSize: 18, fontWeight: 800, color: ink }}>
            Payment received, but login link expired
          </h1>
          <p style={{ fontSize: 13, opacity: 0.6, marginTop: 6, maxWidth: 280 }}>
            Your account was created — check your email for a login link, or try signing in directly.
          </p>
        </>
      )}
    </div>
  );
}
