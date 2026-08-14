import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Pill, JourneyRing } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { ink, mist, green, greenDeep, fontBody, fontDisplay } from "@/lib/design-tokens";
import { Check, ArrowRight } from "lucide-react";

const STEPS = [
  { n: "01", t: "Choose your goal", d: "Weight loss, toning, or muscle — pick the path that fits you." },
  { n: "02", t: "Complete your profile", d: "Two minutes of questions builds a plan around your body." },
  { n: "03", t: "Purchase your plan", d: "Secure checkout with Apple Pay, Google Pay, or card." },
  { n: "04", t: "Instant access", d: "Your dashboard, meals, and workouts unlock immediately." },
  { n: "05", t: "Track your progress", d: "Log weight, meals, and photos — watch the trend line move." },
];

const PROGRAMS = [
  { name: "Weight Loss", d: "Maximum fat loss while preserving lean muscle.", tag: "Most popular" },
  { name: "Weight Loss + Toning", d: "Burn fat while sharpening definition and shape.", tag: "Best balance" },
  { name: "Muscle Building", d: "Progressive training and surplus nutrition for lean size.", tag: "For strength" },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: tiers } = await supabase
    .from("membership_tiers")
    .select("name, duration_days, price_cents, features")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div style={{ ...fontBody, background: "#fff" }}>
      <section
        style={{
          background: `radial-gradient(120% 100% at 50% 0%, #24303f 0%, ${ink} 55%, #0f151d 100%)`,
          color: "#fff", padding: "56px 24px 64px", position: "relative", overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle, ${green}55 0%, transparent 70%)`, top: -120, right: -100, filter: "blur(10px)" }} />
        <div className="flex items-center justify-between mb-10 relative">
          <span className="font-bold text-lg tracking-tight" style={fontDisplay}>My Fit Journey</span>
          <Link href="/login" className="text-sm font-semibold" style={{ color: "#fff", opacity: 0.85 }}>Sign In</Link>
        </div>
        <div className="relative">
          <Pill active>Science-backed · Personalized</Pill>
          <h1 className="mt-5 text-[38px] leading-[1.08] font-extrabold tracking-tight" style={fontDisplay}>
            Transform your body,<br />one day at a time.
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed opacity-80 max-w-sm">
            Personalized nutrition, meal plans, workouts, and progress tracking — built around your goal, not a template.
          </p>
          <div className="mt-8 flex justify-center">
            <JourneyRing dark size={200} center={<><span className="text-3xl font-extrabold" style={fontDisplay}>Day 1</span><span className="text-xs opacity-70 mt-1">of your journey</span></>} />
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/onboarding"><Button variant="primary" className="w-full">Start Your Journey <ArrowRight size={17} /></Button></Link>
            <Link href="/programs"><Button variant="ghostLight" className="w-full">View Programs</Button></Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <h2 className="text-[22px] font-bold tracking-tight" style={{ ...fontDisplay, color: ink }}>How it works</h2>
        <p className="text-sm mt-1 opacity-60">Five steps from sign-up to your first workout.</p>
        <div className="mt-6 flex flex-col">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex gap-4 pb-6 relative">
              {i < STEPS.length - 1 && <div className="absolute left-[19px] top-9 bottom-0 w-[2px]" style={{ background: `${green}33` }} />}
              <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold z-10" style={{ background: mist, color: greenDeep }}>{s.n}</div>
              <div>
                <div className="font-semibold text-[15px]" style={{ color: ink }}>{s.t}</div>
                <div className="text-sm opacity-60 mt-0.5">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-10" style={{ background: mist }}>
        <h2 className="text-[22px] font-bold tracking-tight" style={{ ...fontDisplay, color: ink }}>Programs built for your goal</h2>
        <div className="mt-6 flex flex-col gap-4">
          {PROGRAMS.map((p) => (
            <Card key={p.name} className="p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[17px]" style={{ color: ink, ...fontDisplay }}>{p.name}</span>
                <Pill active>{p.tag}</Pill>
              </div>
              <p className="text-sm opacity-60 mt-2">{p.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 py-12">
        <h2 className="text-[22px] font-bold tracking-tight" style={{ ...fontDisplay, color: ink }}>Membership tiers</h2>
        <div className="mt-6 flex flex-col gap-4">
          {(tiers ?? []).map((t) => (
            <Card key={t.name} className="p-5" style={t.name === "Complete" ? { border: `2px solid ${green}` } : {}}>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-[17px]" style={{ color: ink, ...fontDisplay }}>{t.name}</span>
                <span className="text-xs opacity-50">{t.duration_days / 7} weeks</span>
              </div>
              <div className="text-2xl font-extrabold mt-1" style={{ color: greenDeep, ...fontDisplay }}>
                ${(t.price_cents / 100).toFixed(0)}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {((t.features as string[]) ?? []).map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm" style={{ color: ink }}>
                    <Check size={14} color={green} /> <span className="opacity-80">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/onboarding">
                <Button variant={t.name === "Complete" ? "primary" : "ghost"} className="w-full mt-4">Choose {t.name}</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs opacity-40" style={{ color: ink }}>
        My Fit Journey · Your Journey. Your Transformation.
      </footer>
    </div>
  );
}
