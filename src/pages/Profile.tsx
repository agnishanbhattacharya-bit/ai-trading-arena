import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TickerTape } from "@/components/TickerTape";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, User } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-10 flex items-center border-b border-border/30 px-3 gap-3 bg-card/30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="w-4 h-4" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-mono font-bold text-xs text-primary tracking-widest">PROFILE</span>
            </div>
          </header>
          <TickerTape />
          <div className="flex-1 p-6">
            <div className="max-w-md mx-auto glass-card p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <p className="text-center font-mono text-foreground font-medium">{user?.email}</p>
              <p className="text-center text-xs text-muted-foreground font-mono mt-1">Paper Trading Account</p>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
