import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, BarChart3, Terminal, Trophy } from "lucide-react";

export const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/terminal", label: "Terminal", icon: Terminal },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="font-mono font-bold text-primary text-lg tracking-tight">ALPHA</span>
            <span className="font-mono text-muted-foreground text-xs">TERMINAL</span>
          </button>

          {user && (
            <nav className="flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                    location.pathname === path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
