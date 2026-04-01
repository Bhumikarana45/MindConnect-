import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { moodSummary, journalSummary, avgScore, trend } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ insight: "AI service not configured." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a compassionate mental health wellness assistant. Analyze the following user data and provide a brief, supportive mood insight (3-4 paragraphs max).

Average mood score: ${avgScore}/5
Recent trend: ${trend}

Recent mood entries:
${moodSummary}

${journalSummary ? `Recent journal excerpts:\n${journalSummary}` : "No journal entries available."}

Provide:
1. A summary of their mood patterns
2. Observations about any triggers or patterns you notice
3. Supportive, actionable suggestions (meditation, exercise, journaling tips, or professional help if scores are consistently low)

Keep the tone warm, non-clinical, and encouraging. Use emoji sparingly for friendliness.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
      }),
    });

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "Unable to generate insight.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ insight: "An error occurred generating insights." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
