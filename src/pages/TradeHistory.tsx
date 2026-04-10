import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TickerTape } from "@/components/TickerTape";
import { Menu, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface TradeLog {
  id: string;
  command_text: string;
  parsed_json: any;
  status: string;
  created_at: string;
}

const TradeHistory = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("trade_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setLogs(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-10 flex items-center border-b border-border/30 px-3 gap-3 bg-card/30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="w-4 h-4" />
            </SidebarTrigger>
            <span className="font-mono font-bold text-xs text-primary tracking-widest">TRADE HISTORY</span>
          </header>
          <TickerTape />
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-2">
              {loading ? (
                <p className="text-center text-muted-foreground font-mono text-sm py-12">Loading...</p>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground font-mono text-sm py-12">No trades yet.</p>
              ) : (
                logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-mono text-sm text-foreground">{log.command_text}</p>
                      <span className={`flex items-center gap-1 text-xs font-mono shrink-0 ml-3 ${
                        log.status === "executed" ? "text-primary" : "text-warning"
                      }`}>
                        {log.status === "executed" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TradeHistory;
