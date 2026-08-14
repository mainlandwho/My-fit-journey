"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ink, mist, fontBody, fontDisplay } from "@/lib/design-tokens";
import { ChevronLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "Incorrect email or password" : signInError.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen px-6 pt-6 pb-6 max-w-md mx-auto flex flex-col" style={{ ...fontBody, background: "#fff" }}>
      <Link href="/"><ChevronLeft size={22} color={ink} /></Link>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1" style={{ ...fontDisplay, color: ink }}>Welcome back</h1>
        <p className="text-sm opacity-60 mb-8">Sign in to continue your journey.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">Email</div>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ background: mist, color: ink }}
              placeholder="jamie@email.com"
            />
          </div>
          <div className="mb-2">
            <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">Password</div>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[15px] outline-none" style={{ background: mist, color: ink }}
              placeholder="••••••••"
            />
          </div>

          <div className="text-right mb-6">
            <Link href="/forgot-password" className="text-xs font-semibold" style={{ color: ink, opacity: 0.6 }}>
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-sm mb-4 text-center" style={{ color: "#DC2626" }}>{error}</p>}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
