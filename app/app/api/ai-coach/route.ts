import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: mealPlan }, { data: recentMetrics }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("primary_goal, diet_preference, workout_experience, food_allergies").eq("id", user.id).single(),
    supabase.from("meal_plans").select("calorie_target, protein_target_g, carb_target_g, fat_target_g, meals(name, meal_type, calories, is_completed)").eq("user_id", user.id).eq("plan_date", today).maybeSingle(),
    supabase.from("body_metrics").select("recorded_at, weight_kg").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(3),
    supabase.from("ai_coach_messages").select("sender, message").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  await supabase.from("ai_coach_messages").insert({ user_id: user.id, sender: "user", message });

  const systemPrompt = `You are the AI Coach inside My Fit Journey, a fitness and nutrition app. Be warm, encouraging, and concrete — reference the user's actual plan when relevant. Keep replies short (2-4 sentences), mobile-friendly. Never invent medical advice; for symptoms or medical concerns, suggest they consult a doctor.

User's goal: ${profile?.primary_goal ?? "not set"}
Diet preference: ${profile?.diet_preference ?? "not set"}
Experience level: ${profile?.workout_experience ?? "not set"}
Food allergies: ${profile?.food_allergies ?? "none listed"}
Today's calorie target: ${mealPlan?.calorie_target ?? "no plan yet"}
Today's meals: ${mealPlan?.meals?.map((m: any) => `${m.meal_type}: ${m.name} (${m.calories} cal, ${m.is_completed ? "done" : "not yet"})`).join("; ") ?? "none generated"}
Recent weight entries: ${recentMetrics?.map((m: any) => `${m.recorded_at}: ${m.weight_kg}kg`).join(", ") ?? "none logged"}`;

  const conversationHistory = (history ?? [])
    .reverse()
    .map((m: any) => ({ role: m.sender === "user" ? "user" as const : "assistant" as const, content: m.message }));

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: [...conversationHistory, { role: "user", content: message }],
    });

    const replyText = response.content.find((b) => b.type === "text")?.text ?? "Sorry, I couldn't generate a response.";

    await supabase.from("ai_coach_messages").insert({ user_id: user.id, sender: "ai", message: replyText });

    return NextResponse.json({ reply: replyText });
  } catch (err) {
    console.error("AI coach error:", err);
    return NextResponse.json({ error: "The coach is temporarily unavailable" }, { status: 500 });
  }
}
