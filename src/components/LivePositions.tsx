import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface Position {
  id: string;
  ticker: string;
  position_type: string;
  shares: number;
  avg_entry_price: number;
  current_price: number;
}

interface LivePositionsProps {
  refreshKey?: number;
}

export const LivePositions = ({ refreshKey }: LivePositionsProps) => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalance, setCashBalance] = useState(100000);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: pos } = await supabase.from("positions").select("*").eq("user_id", user.id);
      if (pos) setPositions(pos);
      const { data: pf } = await supabase.from("portfolios").select("cash_balance").eq("user_id", user.id).single();
      if (pf) setCashBalance(pf.cash_balance);
    };
    fetch();
  }, [user, refreshKey]);

  const positionsValue = positions.reduce((sum, p) => {
    const val = p.shares * p.current_price;
    return sum + (p.position_type === "Short" ? -val : val);
  }, 0);

  const totalValue = cashBalance + positionsValue;
  const pnl = ((totalValue - 100000) / 100000) * 100;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <Wallet className="w-4 h-4 text-primary" />
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-muted-foreground">
          Portfolio
        </h3>
      </div>

      <div className="p-3 border-b border-border/30">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono">Total Value</p>
            <p className="font-mono font-bold text-foreground">
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono">PnL</p>
            <p className={`font-mono font-bold flex items-center gap-1 ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
              {pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono">Cash</p>
            <p className="font-mono text-sm text-foreground">
              ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono">Positions</p>
            <p className="font-mono text-sm text-foreground">{positions.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {positions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 font-mono">
            No active positions
          </p>
        ) : (
          <div className="space-y-1">
            {positions.map((p, i) => {
              const pnlVal = p.position_type === "Short"
                ? (p.avg_entry_price - p.current_price) * p.shares
                : (p.current_price - p.avg_entry_price) * p.shares;
              const isProfitable = pnlVal >= 0;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-sm text-foreground">{p.ticker}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        p.position_type === "Long"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {p.position_type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {p.shares} shares @ ${p.avg_entry_price.toFixed(2)}
                    </span>
                  </div>
                  <span className={`font-mono text-xs font-medium ${isProfitable ? "text-profit" : "text-loss"}`}>
                    {isProfitable ? "+" : ""}${pnlVal.toFixed(2)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
