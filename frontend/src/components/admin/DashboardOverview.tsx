import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Shield,
  Server,
  DollarSign,
  AlertTriangle,
  Clock,
  Database,
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { apiService, SystemStats, SystemHealth, AdminDashboardData } from '@/services/api';

const DashboardOverview: React.FC = () => {
  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiService.getAdminDashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Failed to load dashboard data: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = dashboardData?.system_stats;
  const health = dashboardData?.system_health;
  const security = dashboardData?.security_summary;
  const performance = dashboardData?.performance_metrics;

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Degraded</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Unhealthy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Real-time system metrics and health status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getHealthStatusColor(health?.status || 'unknown')}`} />
            {getHealthStatusBadge(health?.status || 'unknown')}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_users || 0} active • {stats?.new_users_today || 0} new today
            </p>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_documents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes((stats?.total_file_size_gb || 0) * 1024 * 1024 * 1024)} total
            </p>
          </CardContent>
        </Card>

        {/* Chat Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_chat_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.messages_today || 0} messages today
            </p>
          </CardContent>
        </Card>

        {/* AI Costs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.estimated_cost_total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.estimated_cost_today || 0)} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>System Health</span>
            </CardTitle>
            <CardDescription>Component status and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {health?.components &&
              Object.entries(health.components).map(([name, component]: [string, any]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getHealthStatusColor(component.status)}`}
                    />
                    <span className="text-sm font-medium capitalize">
                      {name.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{getHealthStatusBadge(component.status)}</div>
                    {component.details && (
                      <div className="text-xs text-muted-foreground">{component.details}</div>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Performance</span>
            </CardTitle>
            <CardDescription>Response times and system metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Avg Response Time</span>
              </div>
              <span className="text-sm font-medium">
                {performance?.avg_response_time_ms || 0}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Requests (24h)</span>
              </div>
              <span className="text-sm font-medium">
                {performance?.total_requests_24h || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Error Rate</span>
              </div>
              <span className="text-sm font-medium">
                {performance?.error_rate_percent || 0}%
              </span>
            </div>
            {health?.components?.system_resources && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">CPU Usage</span>
                  </div>
                  <span className="text-sm font-medium">
                    {health.components.system_resources.cpu_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MemoryStick className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Memory Usage</span>
                  </div>
                  <span className="text-sm font-medium">
                    {health.components.system_resources.memory_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Disk Usage</span>
                  </div>
                  <span className="text-sm font-medium">
                    {health.components.system_resources.disk_percent?.toFixed(1) || 0}%
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Overview</span>
          </CardTitle>
          <CardDescription>Security metrics and recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{security?.total_audit_logs || 0}</div>
              <div className="text-sm text-muted-foreground">Total Audit Logs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {security?.high_risk_events || 0}
              </div>
              <div className="text-sm text-muted-foreground">High Risk Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {security?.failed_logins_24h || 0}
              </div>
              <div className="text-sm text-muted-foreground">Failed Logins (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{security?.active_sessions || 0}</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent User Activity</CardTitle>
          <CardDescription>Latest user actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_activities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{activity.user_email}</div>
                    <div className="text-sm text-muted-foreground">
                      {activity.documents_uploaded} documents • {activity.chat_messages_sent} messages
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      Last seen: {activity.last_activity ? new Date(activity.last_activity).toLocaleDateString() : 'Never'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Risk Score: {activity.risk_score.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No recent activity data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;