import { TrendingUp, TrendingDown } from "lucide-react";

const TICKERS = [
  { symbol: "BTC", price: 67842.50, change: 2.34 },
  { symbol: "ETH", price: 3521.12, change: -1.05 },
  { symbol: "AAPL", price: 189.45, change: 0.87 },
  { symbol: "NVDA", price: 875.30, change: 3.21 },
  { symbol: "TSLA", price: 245.67, change: -2.15 },
  { symbol: "MSFT", price: 415.23, change: 1.42 },
  { symbol: "AMZN", price: 178.90, change: 0.56 },
  { symbol: "GOOGL", price: 155.67, change: -0.32 },
  { symbol: "META", price: 485.12, change: 1.87 },
  { symbol: "AMD", price: 165.34, change: 2.45 },
  { symbol: "SPY", price: 512.78, change: 0.45 },
  { symbol: "QQQ", price: 438.90, change: 0.78 },
];

export const TickerTape = () => {
  const tickerItems = [...TICKERS, ...TICKERS];

  return (
    <div className="w-full h-8 bg-card/50 border-b border-border/20 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="flex items-center h-full ticker-scroll whitespace-nowrap">
        {tickerItems.map((ticker, i) => {
          const isPositive = ticker.change >= 0;
          return (
            <div key={`${ticker.symbol}-${i}`} className="inline-flex items-center gap-1.5 px-4 text-xs">
              <span className="font-mono font-medium text-foreground/80">{ticker.symbol}</span>
              <span className="font-mono text-muted-foreground">
                ${ticker.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className={`font-mono flex items-center gap-0.5 ${isPositive ? "text-profit" : "text-loss"}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{ticker.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
