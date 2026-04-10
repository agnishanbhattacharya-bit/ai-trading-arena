import { useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TickerTape } from "@/components/TickerTape";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Watchlist } from "@/components/Watchlist";
import { ChartWidget } from "@/components/ChartWidget";
import { AITerminal } from "@/components/AITerminal";
import { LivePositions } from "@/components/LivePositions";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

const Dashboard = () => {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTradeExecuted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-10 flex items-center border-b border-border/30 px-3 gap-3 bg-card/30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="w-4 h-4" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-primary tracking-widest">VANGUARD</span>
              <span className="text-[10px] text-muted-foreground font-mono">COMMAND CENTER</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-muted-foreground">LIVE</span>
            </div>
          </header>

          {/* Ticker Tape */}
          <TickerTape />

          {/* Main Workspace */}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="grid grid-cols-12 gap-3 h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
              {/* Left Column - Market Scanner */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.1 }}
                className="col-span-12 lg:col-span-2 glass-card flex flex-col overflow-hidden"
              >
                <div className="p-3 border-b border-border/30">
                  <GlobalSearch onSelectTicker={setSelectedTicker} selectedTicker={selectedTicker} />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    Watchlist
                  </p>
                  <Watchlist onSelectTicker={setSelectedTicker} selectedTicker={selectedTicker} />
                </div>
              </motion.div>

              {/* Center Column - Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.2 }}
                className="col-span-12 lg:col-span-7 min-h-[400px]"
              >
                <ChartWidget ticker={selectedTicker} />
              </motion.div>

              {/* Right Column - Execution & Portfolio */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.3 }}
                className="col-span-12 lg:col-span-3 flex flex-col gap-3"
              >
                <div className="glass-card flex-1 min-h-[200px] overflow-hidden">
                  <AITerminal onTradeExecuted={handleTradeExecuted} />
                </div>
                <div className="glass-card flex-1 min-h-[200px] overflow-hidden">
                  <LivePositions refreshKey={refreshKey} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
