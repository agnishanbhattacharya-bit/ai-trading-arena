import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an advanced quantitative trading algorithm. Your only job is to read the user's trading strategy and extract the parameters into a strictly formatted JSON object. Return ONLY valid JSON, with no markdown tags or conversational text. If the user specifies multiple trades, return a JSON array of objects. If only one trade, still return an array with one object. Each object must include these exact keys: action (Buy/Short/Liquidate/Rebalance), asset (Ticker symbol in uppercase), amount_usd (Number), order_type (Market/Limit/Bracket), stop_loss_pct (Number or null), and take_profit_pct (Number or null).`;

const MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash-lite",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();
    if (!command || typeof command !== "string" || command.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Command text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured. Add it in Cloud → Secrets." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let lastError = "";

    for (const model of MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      let response: Response;
      try {
        response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nUser command: ${command}` }] },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          }),
        });
      } catch (fetchErr) {
        console.error(`Fetch failed for model ${model}:`, fetchErr);
        lastError = `Network error calling ${model}`;
        continue;
      }

      if (response.status === 503 || response.status === 429) {
        const errText = await response.text();
        console.warn(`Model ${model} unavailable (${response.status}), trying next...`, errText);
        lastError = `Model ${model} is temporarily overloaded`;
        continue;
      }

      if (response.status === 404) {
        console.warn(`Model ${model} not found, trying next...`);
        lastError = `Model ${model} not available`;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${model}):`, response.status, errorText);

        if (response.status === 401 || response.status === 403) {
          return new Response(JSON.stringify({ error: "Invalid GEMINI_API_KEY. Please check your key in Cloud → Secrets." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        lastError = `API error ${response.status} from ${model}`;
        continue;
      }

      // Success path
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error(`Empty response from ${model}:`, JSON.stringify(data));
        lastError = `Empty response from ${model}`;
        continue;
      }

      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error(`Invalid JSON from ${model}:`, cleaned);
        lastError = `Model returned unparseable output`;
        continue;
      }

      const trades = Array.isArray(parsed) ? parsed : [parsed];

      return new Response(JSON.stringify({ trades, model }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All models failed
    return new Response(JSON.stringify({ error: `All models failed. Last issue: ${lastError}. Please try again in a moment.` }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-trade error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
