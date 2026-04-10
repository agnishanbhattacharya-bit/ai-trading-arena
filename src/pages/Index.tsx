import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BarChart3, Zap, Trophy, Shield } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) navigate("/dashboard");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
      </div>
    );
  }

  const features = [
    { icon: BarChart3, title: "Portfolio Tracking", desc: "Real-time portfolio analytics with $100K starting capital" },
    { icon: Zap, title: "AI Trading Terminal", desc: "Execute complex strategies with natural language commands" },
    { icon: Trophy, title: "Global Leaderboard", desc: "Compete with traders worldwide for the top PnL ranking" },
    { icon: Shield, title: "Risk-Free Trading", desc: "Paper trade with simulated capital — zero financial risk" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="font-mono font-bold text-primary text-lg tracking-tight">ALPHA</span>
            <span className="font-mono text-muted-foreground text-xs">TERMINAL</span>
          </div>
        </div>
      </header>

      <main className="container px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <span className="text-xs font-mono text-primary uppercase tracking-wider">Season 1 — Now Live</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              AI Paper Trading
              <br />
              <span className="text-primary">Competition</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Deploy advanced AI-driven trading strategies. Compete for the highest returns using natural language commands and $100K in simulated capital.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <f.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AuthForm />
        </div>
      </main>
    </div>
  );
};

export default Index;
