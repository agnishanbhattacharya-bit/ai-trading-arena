import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Logged in successfully");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username || email.split("@")[0] } },
      });
      if (error) toast.error(error.message);
      else toast.success("Account created! Check your email to confirm.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg p-8 glow-border">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-mono">
          {isLogin ? "ACCESS TERMINAL" : "CREATE ACCOUNT"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {isLogin ? "Enter your credentials to continue" : "Register for the competition"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block font-mono">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="trader_alpha"
                className="bg-secondary border-border text-foreground font-mono"
              />
            </div>
          )}
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block font-mono">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@example.com"
              required
              className="bg-secondary border-border text-foreground font-mono"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block font-mono">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-secondary border-border text-foreground font-mono"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-mono uppercase tracking-wider">
            {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
          </Button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};
