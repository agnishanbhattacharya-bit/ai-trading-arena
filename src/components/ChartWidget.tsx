import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { motion } from "framer-motion";

interface ChartWidgetProps {
  ticker: string;
}

const TIME_INTERVALS = [
  { label: "1m", value: "1Min" },
  { label: "5m", value: "5Min" },
  { label: "15m", value: "15Min" },
  { label: "1H", value: "1Hour" },
  { label: "1D", value: "1Day" },
];

function generateMockCandles(ticker: string, interval: string): { candles: CandlestickData<Time>[]; volumes: HistogramData<Time>[] } {
  const candles: CandlestickData<Time>[] = [];
  const volumes: HistogramData<Time>[] = [];
  const now = Math.floor(Date.now() / 1000);
  const hash = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let basePrice = 50 + (hash % 900);
  const barCount = 120;
  const intervalSec = interval === "1Min" ? 60 : interval === "5Min" ? 300 : interval === "15Min" ? 900 : interval === "1Hour" ? 3600 : 86400;

  for (let i = barCount; i >= 0; i--) {
    const time = (now - i * intervalSec) as Time;
    const volatility = basePrice * 0.015;
    const open = basePrice + (Math.random() - 0.48) * volatility;
    const close = open + (Math.random() - 0.47) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    basePrice = close;
    candles.push({ time, open, high, low, close });
    volumes.push({
      time,
      value: Math.floor(Math.random() * 1000000 + 100000),
      color: close >= open ? "rgba(74, 160, 120, 0.25)" : "rgba(180, 80, 80, 0.25)",
    });
  }
  return { candles, volumes };
}

export const ChartWidget = ({ ticker }: ChartWidgetProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [interval, setInterval] = useState("1Day");

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#a1a1aa", width: 1, style: 2, labelBackgroundColor: "#27272a" },
        horzLine: { color: "#a1a1aa", width: 1, style: 2, labelBackgroundColor: "#27272a" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#4ade80",
      downColor: "#f87171",
      borderDownColor: "#f87171",
      borderUpColor: "#4ade80",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    const { candles, volumes } = generateMockCandles(ticker, interval);
    candleSeries.setData(candles);
    volumeSeries.setData(volumes);
    chart.timeScale().fitContent();

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    });
    observer.observe(container);

    return () => { observer.disconnect(); chart.remove(); };
  }, [ticker, interval]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold text-lg text-foreground">{ticker}</span>
          <span className="text-xs text-muted-foreground font-mono">USD</span>
        </div>
        <div className="flex items-center gap-0.5">
          {TIME_INTERVALS.map((ti) => (
            <button
              key={ti.value}
              onClick={() => setInterval(ti.value)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                interval === ti.value
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {ti.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1 min-h-0" />
    </motion.div>
  );
};
