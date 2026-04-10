import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TickerTape } from "@/components/TickerTape";
import { Menu, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  username: string;
  pnl_pct: number;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, username");
      const { data: portfolios } = await supabase.from("portfolios").select("user_id, cash_balance");
      if (!profiles || !portfolios) { setLoading(false); return; }
      const results: LeaderboardEntry[] = profiles.map((profile) => {
        const pf = portfolios.find((p) => p.user_id === profile.user_id);
        const cashBalance = pf?.cash_balance ?? 100000;
        const pnl_pct = ((cashBalance - 100000) / 100000) * 100;
        return { username: profile.username, pnl_pct };
      });
      results.sort((a, b) => b.pnl_pct - a.pnl_pct);
      setEntries(results);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-10 flex items-center border-b border-border/30 px-3 gap-3 bg-card/30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="w-4 h-4" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-mono font-bold text-xs text-primary tracking-widest">LEADERBOARD</span>
            </div>
          </header>
          <TickerTape />
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="glass-card overflow-hidden">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border/30 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left py-3 px-4">Rank</th>
                      <th className="text-left py-3 px-4">Trader</th>
                      <th className="text-right py-3 px-4">PnL %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
                    ) : entries.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-12 text-muted-foreground">No traders yet.</td></tr>
                    ) : (
                      entries.map((entry, i) => {
                        const isProfitable = entry.pnl_pct >= 0;
                        return (
                          <motion.tr
                            key={entry.username}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-border/20 hover:bg-accent/20 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <span className={`font-bold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                                #{i + 1}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-foreground font-medium">{entry.username}</td>
                            <td className={`py-3 px-4 text-right font-bold flex items-center justify-end gap-1 ${isProfitable ? "text-profit" : "text-loss"}`}>
                              {isProfitable ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {isProfitable ? "+" : ""}{entry.pnl_pct.toFixed(2)}%
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Leaderboard;
