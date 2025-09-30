import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-14 border-b border-border bg-card-elevated/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-50">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="hover:bg-accent-hover transition-smooth" />
              <div className="text-sm font-medium text-foreground">
                Legal AI System {user && `- Welcome, ${user.full_name || user.email}`}
              </div>
            </div>

          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;