import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, ChevronRight } from "lucide-react";

interface ParsedCommand {
  action: string;
  target: string;
  amount: number;
  order_type: string;
  stop_loss_pct: number | null;
  take_profit_pct: number | null;
}

function parseCommand(text: string): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  // Simple mock parser: look for patterns like "long $X on TICKER" or "short $X of TICKER"
  const parts = text.split(/,\s*and\s+|,\s+/i);

  for (const part of parts) {
    const longMatch = part.match(/(?:go\s+)?long\s+\$?([\d,]+)\s+(?:on|of|in)\s+(\w+)/i);
    const shortMatch = part.match(/short\s+\$?([\d,]+)\s+(?:on|of|in)\s+(\w+)/i);
    const buyMatch = part.match(/buy\s+\$?([\d,]+)\s+(?:of|in|worth\s+of)\s+(\w+)/i);
    const sellMatch = part.match(/(?:sell|liquidate)\s+(?:\$?([\d,]+)\s+(?:of|in)\s+)?(\w+)/i);
    const stopLossMatch = part.match(/(\d+(?:\.\d+)?)%?\s*stop[- ]?loss/i);
    const takeProfitMatch = part.match(/(\d+(?:\.\d+)?)%?\s*take[- ]?profit/i);

    const stopLoss = stopLossMatch ? parseFloat(stopLossMatch[1]) : null;
    const takeProfit = takeProfitMatch ? parseFloat(takeProfitMatch[1]) : null;
    const orderType = stopLoss || takeProfit ? "Bracket" : "Market";

    if (longMatch) {
      commands.push({
        action: "Buy",
        target: longMatch[2].toUpperCase(),
        amount: parseFloat(longMatch[1].replace(/,/g, "")),
        order_type: orderType,
        stop_loss_pct: stopLoss,
        take_profit_pct: takeProfit,
      });
    } else if (shortMatch) {
      commands.push({
        action: "Short",
        target: shortMatch[2].toUpperCase(),
        amount: parseFloat(shortMatch[1].replace(/,/g, "")),
        order_type: orderType,
        stop_loss_pct: stopLoss,
        take_profit_pct: takeProfit,
      });
    } else if (buyMatch) {
      commands.push({
        action: "Buy",
        target: buyMatch[2].toUpperCase(),
        amount: parseFloat(buyMatch[1].replace(/,/g, "")),
        order_type: orderType,
        stop_loss_pct: stopLoss,
        take_profit_pct: takeProfit,
      });
    } else if (sellMatch) {
      commands.push({
        action: "Liquidate",
        target: sellMatch[2].toUpperCase(),
        amount: sellMatch[1] ? parseFloat(sellMatch[1].replace(/,/g, "")) : 0,
        order_type: "Market",
        stop_loss_pct: null,
        take_profit_pct: null,
      });
    }
  }

  return commands;
}

// Mock price for a ticker
function getMockPrice(ticker: string): number {
  const prices: Record<string, number> = {
    NVDA: 875.30, AAPL: 192.50, MSFT: 420.10, GOOGL: 175.80,
    AMZN: 185.60, META: 510.20, TSLA: 245.70, INTC: 31.50,
    AMD: 165.40, SPY: 520.80,
  };
  return prices[ticker] ?? (50 + Math.random() * 200);
}

const TerminalPage = () => {
  const { user } = useAuth();
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastParsed, setLastParsed] = useState<ParsedCommand[] | null>(null);

  const handleExecute = async () => {
    if (!command.trim() || !user) return;
    setLoading(true);

    const parsed = parseCommand(command);

    if (parsed.length === 0) {
      toast.error("Could not parse your command. Try: 'Go long $10,000 on NVDA with a 5% stop-loss'");
      setLoading(false);
      return;
    }

    setLastParsed(parsed);

    // Log the trade
    await supabase.from("trade_logs").insert({
      user_id: user.id,
      command_text: command,
      parsed_json: parsed as any,
      status: "executed",
    });

    // Mock create positions & update cash
    for (const cmd of parsed) {
      const price = getMockPrice(cmd.target);
      const shares = Math.floor(cmd.amount / price);

      if (cmd.action === "Buy" || cmd.action === "Short") {
        await supabase.from("positions").insert({
          user_id: user.id,
          ticker: cmd.target,
          position_type: cmd.action === "Short" ? "Short" : "Long",
          shares,
          avg_entry_price: price,
          current_price: price,
        });

        // Deduct cash
        const { data: pf } = await supabase
          .from("portfolios")
          .select("cash_balance")
          .eq("user_id", user.id)
          .single();
        if (pf) {
          await supabase
            .from("portfolios")
            .update({ cash_balance: pf.cash_balance - cmd.amount })
            .eq("user_id", user.id);
        }
      }
    }

    toast.success("AI Command Executed Successfully", {
      description: `Parsed ${parsed.length} action(s) from your strategy.`,
    });
    setCommand("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container px-4 py-6 max-w-4xl">
        <div className="bg-terminal border border-border rounded-lg p-6 glow-border">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-mono font-bold text-primary text-lg uppercase tracking-wider">
              AI Trading Terminal
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Enter natural language trading commands. The AI will parse your strategy into structured orders.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block font-mono">
                Enter Advanced AI Strategy
              </label>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., Go long $10,000 on NVDA with a 5% stop-loss, and short $5,000 of INTC"
                rows={4}
                className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground font-mono text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <Button
              onClick={handleExecute}
              disabled={loading || !command.trim()}
              className="w-full font-mono uppercase tracking-wider gap-2"
            >
              <Zap className="w-4 h-4" />
              {loading ? "Processing..." : "Execute AI Command"}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {lastParsed && (
            <div className="mt-6 border border-border rounded-lg p-4 bg-card">
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
                Parsed Strategy Output
              </h3>
              <pre className="text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(lastParsed, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-4 bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Example Commands</h3>
          <div className="space-y-2">
            {[
              "Go long $10,000 on NVDA with a 5% stop-loss",
              "Short $5,000 of INTC",
              "Buy $15,000 of AAPL with a 3% stop-loss and 10% take-profit",
              "Go long $20,000 on MSFT, and short $8,000 of TSLA",
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setCommand(ex)}
                className="block text-left text-sm text-muted-foreground hover:text-primary font-mono transition-colors"
              >
                <ChevronRight className="w-3 h-3 inline mr-1" />
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalPage;
