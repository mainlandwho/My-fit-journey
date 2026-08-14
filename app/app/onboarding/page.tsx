"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, JourneyRing } from "@/components/ui/primitives";
import { ink, mist, green, fontBody, fontDisplay } from "@/lib/design-tokens";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const ONBOARD_STEPS = ["Goal", "About you", "Body", "Lifestyle", "Health", "Review"];

// IMPORTANT: these must live at module scope, not inside OnboardingPage.
// Defining a component inside another component's body means React sees a
// brand-new component type on every re-render (every keystroke, since that
// updates state) — it then unmounts the old <input> and mounts a new one,
// which drops focus and dismisses the keyboard after a single character.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold opacity-50 mb-1.5 uppercase tracking-wide">{label}</div>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} type="button"
          className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
          style={value === o ? { background: green, color: "#fff" } : { background: mist, color: ink }}>
          {o}
        </button>
      ))}
    </div>
  );
}

const inputStyle = "w-full px-4 py-3 rounded-xl text-[15px] outline-none";
const inputBg = { background: mist, color: ink };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [data, setData] = useState({
    goal: "Weight Loss + Toning", name: "", email: "", password: "",
    age: "", gender: "Female", heightCm: "", weightKg: "", goalWeightKg: "", bodyFatPct: "",
    activity: "Moderately active", location: "Both", days: "4", exp: "Beginner",
    diet: "Standard", meals: "3", allergies: "", dislikes: "",
    occupation: "", conditions: "", medications: "", targetDate: "", agree: false,
  });
  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));
  const pct = ((step + 1) / ONBOARD_STEPS.length) * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          tierName: "Complete",
          onboardingData: {
            name: data.name,
            age: Number(data.age),
            gender: data.gender,
            heightCm: Number(data.heightCm),
            weightKg: Number(data.weightKg),
            goalWeightKg: Number(data.goalWeightKg),
            bodyFatPct: data.bodyFatPct ? Number(data.bodyFatPct) : null,
            activity: data.activity,
            location: data.location,
            days: data.days,
            exp: data.exp,
            diet: data.diet,
            meals: data.meals,
            allergies: data.allergies || null,
            dislikes: data.dislikes || null,
            occupation: data.occupation || null,
            conditions: data.conditions || null,
            medications: data.medications || null,
            goal: data.goal,
            targetDate: data.targetDate || null,
            agree: data.agree,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save onboarding");
      const { pendingSignupId } = await res.json();
      router.push(`/programs?pending=${pendingSignupId}`);
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ ...fontBody, background: "#fff" }}>
      <div className="px-6 pt-6 pb-4 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))} type="button">
            <ChevronLeft size={22} color={ink} />
          </button>
          <span className="text-xs font-semibold opacity-50">{ONBOARD_STEPS[step]} · {step + 1}/{ONBOARD_STEPS.length}</span>
          <div style={{ width: 22 }} />
        </div>
        <div className="h-1.5 rounded-full" style={{ background: mist }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: green }} />
        </div>
      </div>

      <div className="px-6 pb-32 flex-1 max-w-md mx-auto w-full">
        {step === 0 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight mb-1" style={{ ...fontDisplay, color: ink }}>What&apos;s your goal?</h2>
            <p className="text-sm opacity-60 mb-6">We&apos;ll shape your calories, macros, and workouts around it.</p>
            <div className="flex flex-col gap-3">
              {["Weight Loss", "Weight Loss + Toning", "Muscle Building"].map((g) => (
                <button key={g} type="button" onClick={() => set("goal", g)}
                  className="text-left p-4 rounded-2xl flex items-center justify-between"
                  style={data.goal === g ? { border: `2px solid ${green}`, background: `${green}0d` } : { border: `2px solid ${mist}` }}>
                  <span className="font-semibold" style={{ color: ink }}>{g}</span>
                  {data.goal === g && <Check size={18} color={green} />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Tell us about you</h2>
            <Field label="Full name"><input className={inputStyle} style={inputBg} value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Jamie Rivera" /></Field>
            <Field label="Email"><input type="email" className={inputStyle} style={inputBg} value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="jamie@email.com" /></Field>
            <Field label="Password"><input type="password" className={inputStyle} style={inputBg} value={data.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" /></Field>
            <Field label="Age"><input inputMode="numeric" className={inputStyle} style={inputBg} value={data.age} onChange={(e) => set("age", e.target.value)} placeholder="29" /></Field>
            <Field label="Gender"><Chips options={["Female", "Male", "Other"]} value={data.gender} onChange={(v) => set("gender", v)} /></Field>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Your body</h2>
            <Field label="Height (cm)"><input inputMode="decimal" className={inputStyle} style={inputBg} value={data.heightCm} onChange={(e) => set("heightCm", e.target.value)} placeholder="168" /></Field>
            <Field label="Current weight (kg)"><input inputMode="decimal" className={inputStyle} style={inputBg} value={data.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="76" /></Field>
            <Field label="Goal weight (kg)"><input inputMode="decimal" className={inputStyle} style={inputBg} value={data.goalWeightKg} onChange={(e) => set("goalWeightKg", e.target.value)} placeholder="66" /></Field>
            <Field label="Body fat % (optional)"><input inputMode="decimal" className={inputStyle} style={inputBg} value={data.bodyFatPct} onChange={(e) => set("bodyFatPct", e.target.value)} placeholder="Optional" /></Field>
            <Field label="Workout experience"><Chips options={["Beginner", "Intermediate", "Advanced"]} value={data.exp} onChange={(v) => set("exp", v)} /></Field>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Lifestyle</h2>
            <Field label="Activity level"><Chips options={["Sedentary", "Lightly active", "Moderately active", "Very active"]} value={data.activity} onChange={(v) => set("activity", v)} /></Field>
            <Field label="Preferred workout location"><Chips options={["Home", "Gym", "Both"]} value={data.location} onChange={(v) => set("location", v)} /></Field>
            <Field label="Workout days per week"><Chips options={["2", "3", "4", "5", "6"]} value={data.days} onChange={(v) => set("days", v)} /></Field>
            <Field label="Diet preference"><Chips options={["Standard", "Vegetarian", "Vegan", "Keto", "Low Carb", "Mediterranean"]} value={data.diet} onChange={(v) => set("diet", v)} /></Field>
            <Field label="Meals per day"><Chips options={["2", "3", "4", "5"]} value={data.meals} onChange={(v) => set("meals", v)} /></Field>
            <Field label="Food allergies"><input className={inputStyle} style={inputBg} value={data.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="e.g. peanuts, shellfish" /></Field>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ ...fontDisplay, color: ink }}>Health check</h2>
            <Field label="Medical conditions"><input className={inputStyle} style={inputBg} value={data.conditions} onChange={(e) => set("conditions", e.target.value)} placeholder="None, or list conditions" /></Field>
            <Field label="Current medications"><input className={inputStyle} style={inputBg} value={data.medications} onChange={(e) => set("medications", e.target.value)} placeholder="None, or list medications" /></Field>
            <Field label="Target date"><input type="date" className={inputStyle} style={inputBg} value={data.targetDate} onChange={(e) => set("targetDate", e.target.value)} /></Field>
            <div className="mt-2 p-4 rounded-2xl flex gap-3" style={{ background: mist }}>
              <input type="checkbox" checked={data.agree} onChange={(e) => set("agree", e.target.checked)} className="mt-1 w-5 h-5 accent-green-600" />
              <p className="text-xs opacity-70 leading-relaxed">
                I confirm the information above is accurate and I agree to the Medical Disclaimer — this program is not a substitute for professional medical advice.
              </p>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2" style={{ ...fontDisplay, color: ink }}>Your plan is ready</h2>
            <p className="text-sm opacity-60 mb-6">Built from your profile — adjust anytime after checkout.</p>
            <div className="flex justify-center mb-6">
              <JourneyRing size={180} center={<><span className="text-2xl font-extrabold" style={{ ...fontDisplay, color: ink }}>{data.goal}</span></>} />
            </div>
            <Card className="p-4 mb-3 flex items-center justify-between"><span className="text-sm font-semibold opacity-70">Diet style</span><span className="text-sm font-bold" style={{ color: ink }}>{data.diet}</span></Card>
            <Card className="p-4 mb-3 flex items-center justify-between"><span className="text-sm font-semibold opacity-70">Workout days/week</span><span className="text-sm font-bold" style={{ color: ink }}>{data.days}</span></Card>
            <Card className="p-4 mb-3 flex items-center justify-between"><span className="text-sm font-semibold opacity-70">Experience</span><span className="text-sm font-bold" style={{ color: ink }}>{data.exp}</span></Card>
            {submitError && <p className="text-sm text-center mt-3" style={{ color: "#DC2626" }}>{submitError}</p>}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white" style={{ boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.15)" }}>
        <div className="max-w-md mx-auto">
          <Button
            variant="primary" className="w-full" disabled={submitting}
            onClick={() => (step === ONBOARD_STEPS.length - 1 ? handleSubmit() : setStep(step + 1))}
          >
            {submitting ? "Saving…" : step === ONBOARD_STEPS.length - 1 ? "Continue to Programs" : "Continue"}
            {!submitting && <ChevronRight size={17} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
