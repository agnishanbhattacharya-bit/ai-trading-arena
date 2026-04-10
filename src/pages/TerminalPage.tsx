import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";

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
  error?: string;
  rounding_info?: string;
}

const EXAMPLE_COMMANDS = [
  "Go long $10,000 on NVDA with a 5% stop-loss",
  "Short $5,000 of INTC",
  "Buy $15,000 of AAPL with a 3% stop-loss and 10% take-profit",
  "Go long $20,000 on MSFT, and short $8,000 of TSLA",
  "Rebalance my portfolio: liquidate INTC and buy $12,000 of AMD",
];

const TerminalPage = () => {
  const { user } = useAuth();
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastParsed, setLastParsed] = useState<ParsedTrade[] | null>(null);
  const [executionResults, setExecutionResults] = useState<AlpacaResult[] | null>(null);

  const handleExecute = async () => {
    if (!command.trim() || !user) return;
    setLoading(true);
    setLastParsed(null);
    setExecutionResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("parse-trade", {
        body: { command },
      });

      if (error) {
        toast.error("AI parsing failed", { description: error.message });
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast.error("AI parsing error", { description: data.error });
        setLoading(false);
        return;
      }

      const trades: ParsedTrade[] = data.trades;
      const results: AlpacaResult[] = data.results || [];
      setLastParsed(trades);
      setExecutionResults(results);

      // Log the trade
      await supabase.from("trade_logs").insert({
        user_id: user.id,
        command_text: command,
        parsed_json: trades as any,
        status: results.every((r) => r.success) ? "executed" : "partial",
      });

      // Sync DB for successful trades
      for (const result of results) {
        if (!result.success) continue;
        const trade = result.trade;

        if (trade.action === "Buy" || trade.action === "Short") {
          const price = trade.amount_usd; // notional amount sent
          await supabase.from("positions").insert({
            user_id: user.id,
            ticker: trade.asset,
            position_type: trade.action === "Short" ? "Short" : "Long",
            shares: 0, // actual fill comes from Alpaca async
            avg_entry_price: 0,
            current_price: 0,
          });

          const { data: pf } = await supabase
            .from("portfolios")
            .select("cash_balance")
            .eq("user_id", user.id)
            .single();
          if (pf) {
            await supabase
              .from("portfolios")
              .update({ cash_balance: pf.cash_balance - trade.amount_usd })
              .eq("user_id", user.id);
          }
        }
      }

      // Show toast per result
      const successes = results.filter((r) => r.success).length;
      const failures = results.filter((r) => !r.success);

      if (successes > 0) {
        toast.success("Trades Submitted to Alpaca", {
          description: `${successes} order(s) accepted by Alpaca Paper Trading.`,
        });
      }
      // Show rounding info toasts
      for (const result of results) {
        if (result.success && result.rounding_info) {
          toast.info(`${result.trade.asset}: ${result.rounding_info}`);
        }
      }
      for (const fail of failures) {
        toast.error(`Alpaca rejected: ${fail.trade.asset}`, {
          description: fail.error || "Unknown Alpaca error",
        });
      }

      setCommand("");
    } catch (err: any) {
      toast.error("Unexpected error", { description: err.message });
    } finally {
      setLoading(false);
    }
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
            Enter natural language trading commands. AI parses your strategy, then executes via Alpaca Paper Trading.
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
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is analyzing & executing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Execute AI Command
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {lastParsed && (
            <div className="mt-6 border border-border rounded-lg overflow-hidden">
              <div className="bg-primary/10 px-4 py-2 border-b border-border">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary">
                  AI-Parsed Strategy — {lastParsed.length} Trade{lastParsed.length > 1 ? "s" : ""}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {lastParsed.map((trade, i) => {
                  const result = executionResults?.[i];
                  return (
                    <div key={i} className="p-4 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">Trade #{i + 1}</span>
                        {result && (
                          <span className={`flex items-center gap-1 text-xs font-mono ${result.success ? "text-primary" : "text-destructive"}`}>
                            {result.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {result.success ? "Submitted" : "Rejected"}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm font-mono">
                        <div>
                          <span className="text-muted-foreground text-xs block">Action</span>
                          <span className={trade.action === "Short" || trade.action === "Liquidate" ? "text-destructive" : "text-primary"}>
                            {trade.action}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Asset</span>
                          <span className="text-foreground font-bold">{trade.asset}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Amount</span>
                          <span className="text-foreground">${trade.amount_usd?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Order Type</span>
                          <span className="text-foreground">{trade.order_type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Stop Loss</span>
                          <span className="text-foreground">{trade.stop_loss_pct != null ? `${trade.stop_loss_pct}%` : "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Take Profit</span>
                          <span className="text-foreground">{trade.take_profit_pct != null ? `${trade.take_profit_pct}%` : "—"}</span>
                        </div>
                      </div>
                      {result && !result.success && (
                        <div className="mt-2 text-xs font-mono text-destructive bg-destructive/10 rounded px-3 py-2">
                          ⚠ {result.error}
                        </div>
                      )}
                      {result?.alpaca_order_id && (
                        <div className="mt-2 text-xs font-mono text-muted-foreground">
                          Order ID: {result.alpaca_order_id}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="bg-secondary/50 px-4 py-2 border-t border-border">
                <details className="text-xs font-mono text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground transition-colors">Raw JSON</summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-foreground">
                    {JSON.stringify({ trades: lastParsed, results: executionResults }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Example Commands</h3>
          <div className="space-y-2">
            {EXAMPLE_COMMANDS.map((ex) => (
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
