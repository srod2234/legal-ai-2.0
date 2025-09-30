import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Users,
  Shield,
  Server,
  FileText,
} from "lucide-react";
import UserManagement from "@/components/UserManagement";
import DashboardOverview from "@/components/admin/DashboardOverview";
import SecurityAuditManagement from "@/components/admin/SecurityAuditManagement";
import SystemMonitoring from "@/components/admin/SystemMonitoring";
import DocumentManagement from "@/components/admin/DocumentManagement";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  console.log('Admin component - Auth state:', { isAdmin, authLoading, userRole: user?.role });

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      console.log('Not admin, redirecting to home');
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show not authorized for non-admins
  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  // Admin content
  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive system management and monitoring
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentManagement />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityAuditManagement />
          </TabsContent>


          <TabsContent value="system" className="space-y-6">
            <SystemMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;