import EnterpriseSidebar from "./layout/EnterpriseSidebar";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <EnterpriseSidebar
        firmName={user?.firm_name || "Your Law Firm"}
        userName={user?.full_name || user?.email || "User"}
        userRole={user?.role || "Attorney"}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;