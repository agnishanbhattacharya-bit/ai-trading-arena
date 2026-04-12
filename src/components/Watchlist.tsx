import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

const WATCHLIST_DATA = [
  { symbol: "AAPL", price: 189.45, change: 0.87, high: 191.20, low: 187.30 },
  { symbol: "NVDA", price: 875.30, change: 3.21, high: 882.00, low: 858.50 },
  { symbol: "TSLA", price: 245.67, change: -2.15, high: 252.00, low: 243.10 },
  { symbol: "MSFT", price: 415.23, change: 1.42, high: 418.50, low: 412.00 },
  { symbol: "AMZN", price: 178.90, change: 0.56, high: 180.30, low: 177.20 },
  { symbol: "GOOGL", price: 155.67, change: -0.32, high: 157.00, low: 154.80 },
  { symbol: "AMD", price: 165.34, change: 2.45, high: 168.00, low: 162.10 },
  { symbol: "META", price: 485.12, change: 1.87, high: 490.00, low: 480.50 },
];

interface WatchlistProps {
  onSelectTicker: (ticker: string) => void;
  selectedTicker: string;
}

export const Watchlist = ({ onSelectTicker, selectedTicker }: WatchlistProps) => {
  return (
    <div className="space-y-0.5">
      {WATCHLIST_DATA.map((item, i) => {
        const isPositive = item.change >= 0;
        const isSelected = selectedTicker === item.symbol;
        return (
          <motion.button
            key={item.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelectTicker(item.symbol)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
              isSelected
                ? "bg-foreground/8 border border-foreground/10"
                : "hover:bg-foreground/5 border border-transparent"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-mono font-medium text-sm ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                  {item.symbol}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-mono ${isPositive ? "text-profit" : "text-loss"}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? "+" : ""}{item.change.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">H {item.high.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground font-mono">L {item.low.toFixed(2)}</span>
              </div>
            </div>
            <span className="font-mono font-medium text-sm text-foreground/80">
              ${item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
