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

const ALPACA_BASE = "https://paper-api.alpaca.markets";

interface ParsedTrade {
  action: string;
  asset: string;
  amount_usd: number;
  order_type: string;
  stop_loss_pct: number | null;
  take_profit_pct: number | null;
}

interface AlpacaResult {
  trade: ParsedTrade;
  success: boolean;
  alpaca_order_id?: string;
  filled_qty?: number;
  filled_avg_price?: number;
  error?: string;
  rounding_info?: string;
}

const CRYPTO_TICKERS = new Set(["BTC", "ETH", "LTC", "BCH", "DOGE", "SHIB", "SOL", "AVAX", "UNI", "LINK", "AAVE", "DOT", "MATIC"]);

function isCrypto(asset: string): boolean {
  const base = asset.replace(/USD$/, "").replace(/\/USD$/, "");
  return CRYPTO_TICKERS.has(base.toUpperCase());
}

async function fetchCurrentPrice(asset: string, alpacaKey: string, alpacaSecret: string): Promise<number | null> {
  try {
    // Try stocks/latest quote first
    const url = `${ALPACA_BASE}/../data.alpaca.markets/v2/stocks/${asset}/trades/latest`;
    // Use Alpaca data API
    const res = await fetch(`https://data.alpaca.markets/v2/stocks/${asset}/trades/latest`, {
      headers: {
        "APCA-API-KEY-ID": alpacaKey,
        "APCA-API-SECRET-KEY": alpacaSecret,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.trade?.p || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function buildAlpacaOrder(trade: ParsedTrade, alpacaKey: string, alpacaSecret: string): Promise<{ order: Record<string, unknown>; rounding_info?: string }> {
  const side = trade.action === "Short" ? "sell" : "buy";
  const orderType = trade.order_type === "Limit" ? "limit" : "market";

  const order: Record<string, unknown> = {
    symbol: trade.asset,
    side,
    type: orderType,
    time_in_force: "day",
  };

  if (trade.action === "Short") {
    const crypto = isCrypto(trade.asset);
    const price = await fetchCurrentPrice(trade.asset, alpacaKey, alpacaSecret);

    if (price && price > 0) {
      if (crypto) {
        // Crypto supports fractional shorting
        const qty = trade.amount_usd / price;
        order.qty = qty.toFixed(8);
      } else {
        // Stocks: round down to whole shares
        const rawQty = trade.amount_usd / price;
        const wholeQty = Math.floor(rawQty);
        if (wholeQty < 1) {
          return { order, rounding_info: `Cannot short: $${trade.amount_usd} < 1 share at $${price.toFixed(2)}` };
        }
        order.qty = wholeQty.toString();
        const executedAmount = wholeQty * price;
        const diff = trade.amount_usd - executedAmount;
        let rounding_info: string | undefined;
        if (diff > 1) {
          rounding_info = `Short rounded to ${wholeQty} share(s) ($${executedAmount.toFixed(0)} executed at ~$${price.toFixed(2)}/share)`;
        }
        return { order, rounding_info };
      }
    } else {
      // Fallback: can't get price, try notional and let Alpaca decide
      order.notional = trade.amount_usd.toString();
    }
  } else {
    // Buy/Rebalance: use notional (supports fractional)
    order.notional = trade.amount_usd.toString();
  }

  return { order };
}

async function submitToAlpaca(trade: ParsedTrade, alpacaKey: string, alpacaSecret: string): Promise<AlpacaResult> {
  try {
    const order = mapToAlpacaOrder(trade);

    const res = await fetch(`${ALPACA_BASE}/v2/orders`, {
      method: "POST",
      headers: {
        "APCA-API-KEY-ID": alpacaKey,
        "APCA-API-SECRET-KEY": alpacaSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    const body = await res.json();

    if (!res.ok) {
      const msg = body?.message || body?.error || `Alpaca rejected (${res.status})`;
      return { trade, success: false, error: msg };
    }

    return {
      trade,
      success: true,
      alpaca_order_id: body.id,
      filled_qty: Number(body.filled_qty) || 0,
      filled_avg_price: Number(body.filled_avg_price) || 0,
    };
  } catch (err) {
    return { trade, success: false, error: err instanceof Error ? err.message : "Network error calling Alpaca" };
  }
}

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
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALPACA_API_KEY = Deno.env.get("ALPACA_API_KEY");
    const ALPACA_SECRET_KEY = Deno.env.get("ALPACA_SECRET_KEY");
    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "ALPACA_API_KEY or ALPACA_SECRET_KEY is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 1: Parse with Gemini ---
    let trades: ParsedTrade[] | null = null;
    let usedModel = "";
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

      if (response.status === 503 || response.status === 429 || response.status === 404) {
        console.warn(`Model ${model} unavailable (${response.status}), trying next...`);
        lastError = `Model ${model} unavailable (${response.status})`;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${model}):`, response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          return new Response(JSON.stringify({ error: "Invalid GEMINI_API_KEY." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        lastError = `API error ${response.status} from ${model}`;
        continue;
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        lastError = `Empty response from ${model}`;
        continue;
      }

      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
      }

      try {
        const parsed = JSON.parse(cleaned);
        trades = Array.isArray(parsed) ? parsed : [parsed];
        usedModel = model;
        break;
      } catch {
        lastError = `Model returned unparseable output`;
        continue;
      }
    }

    if (!trades) {
      return new Response(JSON.stringify({ error: `All models failed. Last issue: ${lastError}` }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 2: Execute each trade via Alpaca ---
    const results: AlpacaResult[] = [];
    for (const trade of trades) {
      if (trade.action === "Liquidate") {
        // Close position via Alpaca
        try {
          const closeRes = await fetch(`${ALPACA_BASE}/v2/positions/${trade.asset}`, {
            method: "DELETE",
            headers: {
              "APCA-API-KEY-ID": ALPACA_API_KEY,
              "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
            },
          });
          const closeBody = await closeRes.json();
          if (!closeRes.ok) {
            results.push({ trade, success: false, error: closeBody?.message || `Liquidation failed (${closeRes.status})` });
          } else {
            results.push({ trade, success: true, alpaca_order_id: closeBody.id });
          }
        } catch (err) {
          results.push({ trade, success: false, error: err instanceof Error ? err.message : "Liquidation network error" });
        }
      } else {
        const result = await submitToAlpaca(trade, ALPACA_API_KEY, ALPACA_SECRET_KEY);
        results.push(result);
      }
    }

    return new Response(JSON.stringify({ trades, results, model: usedModel }), {
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
