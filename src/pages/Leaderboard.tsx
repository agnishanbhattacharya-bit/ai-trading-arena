import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface LeaderboardEntry {
  username: string;
  pnl_pct: number;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Get all profiles with portfolios
      const { data: profiles } = await supabase.from("profiles").select("user_id, username");
      const { data: portfolios } = await supabase.from("portfolios").select("user_id, cash_balance");

      if (!profiles || !portfolios) {
        setLoading(false);
        return;
      }

      const results: LeaderboardEntry[] = profiles.map((profile) => {
        const pf = portfolios.find((p) => p.user_id === profile.user_id);
        const cashBalance = pf?.cash_balance ?? 100000;
        // Simplified: just use cash balance difference for PnL since we can't query positions cross-user
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
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container px-4 py-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="font-mono font-bold text-xl text-foreground uppercase tracking-wider">
            Global Leaderboard
          </h1>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-secondary/30">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Trader</th>
                <th className="text-right py-3 px-4">PnL %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-muted-foreground">Loading...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-muted-foreground">No traders yet. Be the first!</td>
                </tr>
              ) : (
                entries.map((entry, i) => {
                  const isProfitable = entry.pnl_pct >= 0;
                  return (
                    <tr key={entry.username} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
