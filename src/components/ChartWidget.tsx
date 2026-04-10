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

// Generate mock candle data since we don't have a live data feed yet
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
      color: close >= open ? "rgba(0, 255, 136, 0.3)" : "rgba(239, 68, 68, 0.3)",
    });
  }
  return { candles, volumes };
}

export const ChartWidget = ({ ticker }: ChartWidgetProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [interval, setInterval] = useState("1Day");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(215, 15%, 50%)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "hsl(240, 5%, 10%)" },
        horzLines: { color: "hsl(240, 5%, 10%)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "hsl(160, 100%, 50%)", width: 1, style: 2, labelBackgroundColor: "hsl(160, 100%, 50%)" },
        horzLine: { color: "hsl(160, 100%, 50%)", width: 1, style: 2, labelBackgroundColor: "hsl(160, 100%, 50%)" },
      },
      rightPriceScale: {
        borderColor: "hsl(240, 5%, 12%)",
      },
      timeScale: {
        borderColor: "hsl(240, 5%, 12%)",
        timeVisible: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(160, 100%, 50%)",
      downColor: "hsl(0, 72%, 51%)",
      borderDownColor: "hsl(0, 72%, 51%)",
      borderUpColor: "hsl(160, 100%, 50%)",
      wickDownColor: "hsl(0, 72%, 45%)",
      wickUpColor: "hsl(160, 100%, 45%)",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const { candles, volumes } = generateMockCandles(ticker, interval);
    candleSeries.setData(candles);
    volumeSeries.setData(volumes);
    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [ticker, interval]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card flex flex-col h-full"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-lg text-primary">{ticker}</span>
          <span className="text-xs text-muted-foreground font-mono">USD</span>
        </div>
        <div className="flex items-center gap-1">
          {TIME_INTERVALS.map((ti) => (
            <button
              key={ti.value}
              onClick={() => setInterval(ti.value)}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                interval === ti.value
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
