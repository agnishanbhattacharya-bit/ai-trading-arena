import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { PositionsTable } from "@/components/PositionsTable";
import { TrendingUp, TrendingDown, DollarSign, Wallet, PieChart } from "lucide-react";

interface Portfolio {
  cash_balance: number;
}

interface Position {
  id: string;
  ticker: string;
  position_type: string;
  shares: number;
  avg_entry_price: number;
  current_price: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: pf } = await supabase
        .from("portfolios")
        .select("cash_balance")
        .eq("user_id", user.id)
        .single();
      if (pf) setPortfolio(pf);

      const { data: pos } = await supabase
        .from("positions")
        .select("*")
        .eq("user_id", user.id);
      if (pos) setPositions(pos);
    };
    fetchData();
  }, [user]);

  const positionsValue = positions.reduce((sum, p) => {
    const val = p.shares * p.current_price;
    return sum + (p.position_type === "Short" ? -val : val);
  }, 0);

  const totalValue = (portfolio?.cash_balance ?? 100000) + positionsValue;
  const totalPnl = ((totalValue - 100000) / 100000) * 100;
  const isProfitable = totalPnl >= 0;

  const stats = [
    {
      label: "Portfolio Value",
      value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: PieChart,
      color: "text-primary",
    },
    {
      label: "Cash Balance",
      value: `$${(portfolio?.cash_balance ?? 100000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "text-foreground",
    },
    {
      label: "Positions Value",
      value: `$${positionsValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-foreground",
    },
    {
      label: "Total PnL",
      value: `${isProfitable ? "+" : ""}${totalPnl.toFixed(2)}%`,
      icon: isProfitable ? TrendingUp : TrendingDown,
      color: isProfitable ? "text-profit" : "text-loss",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Active Positions</h2>
          <PositionsTable positions={positions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
