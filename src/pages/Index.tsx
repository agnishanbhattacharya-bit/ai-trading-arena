import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthForm } from "@/components/AuthForm";
import { Zap, BarChart3, Trophy, Shield, ChevronRight } from "lucide-react";

const features = [
  { icon: Zap, title: "AI-Powered Execution", desc: "Natural language to live paper trades in milliseconds" },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Professional-grade charts with TradingView engine" },
  { icon: Trophy, title: "Global Leaderboard", desc: "Compete with traders worldwide for the top rank" },
  { icon: Shield, title: "Zero Risk", desc: "Paper trading with $100K virtual capital" },
];

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user && !loading) navigate("/dashboard");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-mono font-bold text-sm text-primary tracking-widest">VANGUARD</span>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl text-center"
            >
              {/* Season badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono text-primary">SEASON 1 — LIVE</span>
              </motion.div>

              {/* Kinetic Typography */}
              <div className="space-y-2 mb-6">
                {["THE AI", "TRADING", "TERMINAL"].map((word, i) => (
                  <motion.h1
                    key={word}
                    initial={{ opacity: 0, y: 40, rotateX: -15 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.12,
                      type: "spring",
                      stiffness: 150,
                      damping: 20,
                    }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold font-mono leading-[0.9] tracking-tighter"
                    style={{
                      background: i === 2
                        ? "linear-gradient(135deg, hsl(160 100% 50%), hsl(160 100% 70%))"
                        : "linear-gradient(135deg, hsl(210 20% 92%), hsl(210 20% 72%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {word}
                  </motion.h1>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed"
              >
                Describe your strategy in plain English. Our AI parses, validates, and executes paper trades instantly via Alpaca.
              </motion.p>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px hsl(160 100% 50% / 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAuth(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-mono font-semibold text-sm uppercase tracking-wider transition-shadow"
              >
                Launch Terminal
                <ChevronRight className="w-4 h-4" />
              </motion.button>

              {/* Feature grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
              >
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.08 }}
                    className="glass-card p-4 text-left"
                  >
                    <f.icon className="w-5 h-5 text-primary mb-2" />
                    <h3 className="font-mono font-semibold text-xs text-foreground mb-1">{f.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              className="w-full max-w-sm"
            >
              <button
                onClick={() => setShowAuth(false)}
                className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-6 flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 rotate-180" />
                Back
              </button>
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="font-mono font-bold text-sm text-primary">VANGUARD</span>
                </div>
                <AuthForm />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
