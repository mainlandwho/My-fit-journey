"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { ink, mist, green, greenDeep, fontDisplay } from "@/lib/design-tokens";
import { MessageCircle, Check, ArrowRight, User as UserIcon } from "lucide-react";

interface Msg {
  sender: string;
  message: string;
}

interface Assignment {
  id: string;
  trainers: { full_name: string; certification: string | null } | null;
}

export function CoachClient({
  initialAiMessages,
  assignment,
  initialTrainerMessages,
}: {
  initialAiMessages: Msg[];
  assignment: Assignment | null;
  initialTrainerMessages: Msg[];
}) {
  const [sub, setSub] = useState<"ai" | "trainer">("ai");
  const [aiMessages, setAiMessages] = useState(initialAiMessages);
  const [trainerMessages, setTrainerMessages] = useState(initialTrainerMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const sendAiMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    setAiMessages((m) => [...m, { sender: "user", message: text }]);
    setSending(true);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.reply) setAiMessages((m) => [...m, { sender: "ai", message: data.reply }]);
    } finally {
      setSending(false);
    }
  };

  const sendTrainerMessage = async () => {
    if (!input.trim() || !assignment) return;
    const text = input;
    setInput("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("trainer_messages").insert({ assignment_id: assignment.id, sender: "user", message: text });
    setTrainerMessages((m) => [...m, { sender: "user", message: text }]);
  };

  const upgrade = async () => {
    setUpgrading(true);
    const res = await fetch("/api/upgrade", { method: "POST" });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setUpgrading(false);
  };

  return (
    <div className="px-6 pt-6 pb-28 flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
      <h2 className="text-xl font-extrabold tracking-tight mb-4" style={{ ...fontDisplay, color: ink }}>Coaching</h2>

      <div className="flex p-1 rounded-2xl mb-5" style={{ background: mist }}>
        {[{ id: "ai" as const, label: "AI Coach" }, { id: "trainer" as const, label: "Live Trainer" }].map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)} type="button" className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={sub === s.id ? { background: "#fff", color: ink, boxShadow: "0 2px 8px -2px rgba(31,41,55,0.15)" } : { color: `${ink}66` }}>
            {s.label}
          </button>
        ))}
      </div>

      {sub === "ai" && (
        <>
          <div className="flex flex-col gap-3 flex-1">
            {aiMessages.length === 0 && (
              <div className="max-w-[80%] p-3.5 rounded-2xl text-[14px] self-start" style={{ background: mist, color: ink }}>
                Hi! I&apos;m your AI Coach — ask me about your meals, workouts, or how to adjust your plan.
              </div>
            )}
            {aiMessages.map((m, i) => (
              <div key={i} className={`max-w-[80%] p-3.5 rounded-2xl text-[14px] ${m.sender === "user" ? "self-end" : "self-start"}`}
                style={m.sender === "user" ? { background: green, color: "#fff" } : { background: mist, color: ink }}>
                {m.message}
              </div>
            ))}
            {sending && <div className="text-xs opacity-40 self-start px-2">Coach is typing…</div>}
          </div>
          <div className="flex gap-2 mt-4">
            <input
              className="flex-1 px-4 py-3 rounded-xl text-[15px]" style={{ background: mist, color: ink }}
              placeholder="Ask your coach anything…" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
            />
            <button onClick={sendAiMessage} type="button" className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: green }}>
              <MessageCircle size={18} color="#fff" />
            </button>
          </div>
        </>
      )}

      {sub === "trainer" && (
        assignment ? (
          <>
            <Card className="p-4 mb-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-white" style={{ background: greenDeep }}>
                {assignment.trainers?.full_name?.split(" ").map((n) => n[0]).join("") ?? "CT"}
              </div>
              <div className="flex-1">
                <div className="font-bold text-[15px]" style={{ color: ink }}>{assignment.trainers?.full_name ?? "Your Trainer"}</div>
                <div className="text-xs opacity-50">{assignment.trainers?.certification ?? "Certified trainer"}</div>
              </div>
            </Card>
            <div className="flex flex-col gap-3 flex-1">
              {trainerMessages.length === 0 && (
                <div className="text-xs opacity-40 text-center py-8">No messages yet — say hello to get started.</div>
              )}
              {trainerMessages.map((m, i) => (
                <div key={i} className={`max-w-[80%] p-3.5 rounded-2xl text-[14px] ${m.sender === "user" ? "self-end" : "self-start"}`}
                  style={m.sender === "user" ? { background: green, color: "#fff" } : { background: mist, color: ink }}>
                  {m.message}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input className="flex-1 px-4 py-3 rounded-xl text-[15px]" style={{ background: mist, color: ink }} placeholder="Message your trainer…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendTrainerMessage()} />
              <button onClick={sendTrainerMessage} type="button" className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: green }}>
                <MessageCircle size={18} color="#fff" />
              </button>
            </div>
          </>
        ) : (
          <>
            <Card className="p-5 mb-4 text-center" style={{ background: `linear-gradient(135deg, ${ink}, #0f151d)` }}>
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: `${green}22` }}>
                <UserIcon size={22} color={green} />
              </div>
              <h3 className="text-white font-bold text-[16px] mt-3" style={fontDisplay}>Talk to a real trainer</h3>
              <p className="text-white opacity-60 text-xs mt-1">Get 1:1 guidance from a certified coach — not just AI.</p>
            </Card>
            <div className="flex flex-col gap-2.5 mb-5">
              {["Weekly video check-in with your assigned trainer", "Personalized nutrition & workout adjustments", "Direct messaging — ask questions anytime", "Priority support and monthly goal planning"].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: ink }}>
                  <Check size={15} color={green} /> <span className="opacity-80">{f}</span>
                </div>
              ))}
            </div>
            <Button variant="primary" className="w-full" disabled={upgrading} onClick={upgrade}>
              {upgrading ? "Redirecting to checkout…" : <>Upgrade to VIP Coaching <ArrowRight size={17} /></>}
            </Button>
          </>
        )
      )}
    </div>
  );
}
