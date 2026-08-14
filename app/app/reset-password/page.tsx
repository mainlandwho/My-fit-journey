"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ink, mist, fontBody, fontDisplay } from "@/lib/design-tokens";

function ResetPasswordInner() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase's client automatically exchanges the recovery token in the
    // URL for a temporary session on load — we just need to wait for that
    // before letting the user submit a new password.
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const passwordsValid = password.length >= 8 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsValid) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  return (
    <div className="min-h-screen px-6 pt-6 pb-6 max-w-md mx-auto flex flex-col justify-center" style={{ ...fontBody, background: "#fff" }}>
      {done ? (
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight mb-2" style={{ ...fontDisplay, color: ink }}>Password updated</h1>
          <p className="text-sm opacity-60">Taking you to your dashboard…</p>
        </div>
      ) : !ready ? (
        <p className="text-sm text-center opacity-50">Verifying your reset link…</p>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1" style={{ ...fontDisplay, color: ink }}>Set a new password</h1>
          <p className="text-sm opacity-60 mb-8">Choose something you haven&apos;t used before.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">New password</div>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ background: mist, color: ink }}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="mb-6">
              <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">Confirm new password</div>
              <input
                type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ background: mist, color: ink }}
                placeholder="Re-enter your password"
              />
              {confirmPassword !== "" && password !== confirmPassword && (
                <p className="text-xs mt-1.5" style={{ color: "#DC2626" }}>Passwords don&apos;t match</p>
              )}
            </div>

            {error && <p className="text-sm mb-4 text-center" style={{ color: "#DC2626" }}>{error}</p>}

            <Button type="submit" variant="primary" className="w-full" disabled={loading || !passwordsValid}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
