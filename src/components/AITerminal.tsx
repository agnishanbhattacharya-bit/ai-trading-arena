import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChevronRight, Loader2, CheckCircle2, XCircle, AlertTriangle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  "Buy $15,000 of AAPL with 3% stop-loss and 10% take-profit",
];

interface AITerminalProps {
  onTradeExecuted?: () => void;
}

export const AITerminal = ({ onTradeExecuted }: AITerminalProps) => {
  const { user } = useAuth();
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [executionResults, setExecutionResults] = useState<AlpacaResult[] | null>(null);

  const handleExecute = async () => {
    if (!command.trim() || !user) return;
    setLoading(true);
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
      setExecutionResults(results);

      await supabase.from("trade_logs").insert({
        user_id: user.id,
        command_text: command,
        parsed_json: trades as any,
        status: results.every((r) => r.success) ? "executed" : "partial",
      });

      for (const result of results) {
        if (!result.success) continue;
        const trade = result.trade;
        if (trade.action === "Buy" || trade.action === "Short") {
          await supabase.from("positions").insert({
            user_id: user.id,
            ticker: trade.asset,
            position_type: trade.action === "Short" ? "Short" : "Long",
            shares: 0,
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

      const successes = results.filter((r) => r.success).length;
      const failures = results.filter((r) => !r.success);

      if (successes > 0) {
        toast.success("Trades Submitted", {
          description: `${successes} order(s) accepted.`,
        });
        onTradeExecuted?.();
      }
      for (const result of results) {
        if (result.success && result.rounding_info) {
          toast.info(`${result.trade.asset}: ${result.rounding_info}`);
        }
      }
      for (const fail of failures) {
        toast.error(`Rejected: ${fail.trade.asset}`, {
          description: fail.error || "Unknown error",
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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <h3 className="font-medium text-xs text-foreground/70 uppercase tracking-wider">
          Command Center
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence mode="wait">
          {executionResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {executionResults.map((result, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 border text-xs font-mono ${
                    result.success
                      ? "bg-[hsl(var(--profit))]/5 border-[hsl(var(--profit))]/15"
                      : "bg-destructive/5 border-destructive/15"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">
                      {result.trade.action} {result.trade.asset}
                    </span>
                    {result.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-profit" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    ${result.trade.amount_usd?.toLocaleString()}
                  </span>
                  {!result.success && result.error && (
                    <div className="mt-1.5 flex items-start gap-1 text-destructive">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{result.error}</span>
                    </div>
                  )}
                  {result.alpaca_order_id && (
                    <div className="mt-1 text-muted-foreground">
                      ID: {result.alpaca_order_id.slice(0, 8)}…
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!executionResults && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground mb-2">Quick commands</p>
            {EXAMPLE_COMMANDS.map((ex) => (
              <button
                key={ex}
                onClick={() => setCommand(ex)}
                className="block w-full text-left text-xs text-muted-foreground hover:text-foreground font-mono transition-colors py-1.5 px-2 rounded-md hover:bg-foreground/5"
              >
                <ChevronRight className="w-3 h-3 inline mr-1 opacity-40" />
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border/30">
        <div className="relative">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleExecute();
              }
            }}
            placeholder="Enter strategy… (Shift+Enter for newline)"
            rows={2}
            className="w-full bg-foreground/[0.03] border border-border/50 rounded-lg px-3 py-2.5 pr-12 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
          />
          <button
            onClick={handleExecute}
            disabled={loading || !command.trim()}
            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-md transition-all disabled:opacity-20 hover:bg-foreground/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Send className="w-4 h-4 text-foreground/70" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
