"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ink, mist, fontBody, fontDisplay } from "@/lib/design-tokens";
import { ChevronLeft, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    // Always show the same success state regardless of whether the email
    // exists — this avoids leaking which emails have accounts.
    setSent(true);
  };

  return (
    <div className="min-h-screen px-6 pt-6 pb-6 max-w-md mx-auto flex flex-col" style={{ ...fontBody, background: "#fff" }}>
      <Link href="/login"><ChevronLeft size={22} color={ink} /></Link>

      <div className="flex-1 flex flex-col justify-center">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: mist }}>
              <Check size={24} color={ink} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mb-2" style={{ ...fontDisplay, color: ink }}>Check your email</h1>
            <p className="text-sm opacity-60">If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1" style={{ ...fontDisplay, color: ink }}>Reset your password</h1>
            <p className="text-sm opacity-60 mb-8">Enter your email and we&apos;ll send you a reset link.</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">Email</div>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ background: mist, color: ink }}
                  placeholder="jamie@email.com"
                />
              </div>

              {error && <p className="text-sm mb-4 text-center" style={{ color: "#DC2626" }}>{error}</p>}

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
