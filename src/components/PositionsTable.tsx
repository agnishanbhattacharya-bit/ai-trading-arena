interface Position {
  id: string;
  ticker: string;
  position_type: string;
  shares: number;
  avg_entry_price: number;
  current_price: number;
}

export const PositionsTable = ({ positions }: { positions: Position[] }) => {
  if (positions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-mono text-sm">
        No active positions. Head to the Terminal to execute your first trade.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="text-left py-3 px-2">Ticker</th>
            <th className="text-left py-3 px-2">Type</th>
            <th className="text-right py-3 px-2">Shares</th>
            <th className="text-right py-3 px-2">Avg Entry</th>
            <th className="text-right py-3 px-2">Current</th>
            <th className="text-right py-3 px-2">PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const pnl = (p.current_price - p.avg_entry_price) * p.shares * (p.position_type === "Short" ? -1 : 1);
            const pnlPct = ((p.current_price - p.avg_entry_price) / p.avg_entry_price) * 100 * (p.position_type === "Short" ? -1 : 1);
            const isProfitable = pnl >= 0;

            return (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-2 font-bold text-foreground">{p.ticker}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    p.position_type === "Long" ? "bg-primary/10 text-profit" : "bg-destructive/10 text-loss"
                  }`}>
                    {p.position_type}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-foreground">{p.shares}</td>
                <td className="py-3 px-2 text-right text-muted-foreground">${p.avg_entry_price.toFixed(2)}</td>
                <td className="py-3 px-2 text-right text-foreground">${p.current_price.toFixed(2)}</td>
                <td className={`py-3 px-2 text-right font-bold ${isProfitable ? "text-profit" : "text-loss"}`}>
                  {isProfitable ? "+" : ""}{pnlPct.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
