import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  MessageSquare,
  Activity,
  Server,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  HardDrive,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { apiService, SystemStats, SystemHealth, AdminDashboardData } from '@/services/api';

interface SystemDashboardProps {
  className?: string;
}

const SystemDashboard: React.FC<SystemDashboardProps> = ({ className }) => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: apiService.getAdminDashboard,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Failed to load dashboard data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = dashboardData?.system_stats;
  const health = dashboardData?.system_health;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'unhealthy': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getHealthIcon(health.status)}
                <Badge className={getHealthStatusColor(health.status)}>
                  {health.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Version {health.version}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Uptime: {Math.floor(health.uptime_seconds / 3600)}h {Math.floor((health.uptime_seconds % 3600) / 60)}m
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(health.components).map(([name, component]) => (
                <div key={name} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{name.replace('_', ' ')}</span>
                    <Badge
                      variant="outline"
                      className={getHealthStatusColor(component.status)}
                    >
                      {component.status}
                    </Badge>
                  </div>
                  {component.details && (
                    <p className="text-xs text-muted-foreground mt-1">{component.details}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.total_users)}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.active_users} active
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Users Today</p>
                  <p className="text-2xl font-bold">{stats.new_users_today}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.new_users_this_week} this week
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Document Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.total_documents)}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.total_file_size_gb.toFixed(1)} GB total
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing Status</p>
                  <p className="text-2xl font-bold">{stats.documents_processing}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.documents_failed} failed
                  </p>
                </div>
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          {/* Chat Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chat Sessions</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.total_chat_sessions)}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.active_chat_sessions} active
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Messages Today</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.messages_today)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(stats.messages_this_week)} this week
                  </p>
                </div>
                <Activity className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          {/* AI Usage Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tokens Used</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.total_tokens_used)}</p>
                  <p className="text-xs text-muted-foreground">
                    Total consumption
                  </p>
                </div>
                <Server className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Costs</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.estimated_cost_today)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.estimated_cost_total)} total
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Resources (if available) */}
      {stats && (stats.cpu_usage_percent || stats.memory_usage_percent || stats.disk_usage_percent) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.cpu_usage_percent && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                    <p className="text-2xl font-bold">{stats.cpu_usage_percent.toFixed(1)}%</p>
                  </div>
                  <Cpu className={`w-8 h-8 ${
                    stats.cpu_usage_percent > 80 ? 'text-red-600' :
                    stats.cpu_usage_percent > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
              </CardContent>
            </Card>
          )}

          {stats.memory_usage_percent && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                    <p className="text-2xl font-bold">{stats.memory_usage_percent.toFixed(1)}%</p>
                  </div>
                  <MemoryStick className={`w-8 h-8 ${
                    stats.memory_usage_percent > 85 ? 'text-red-600' :
                    stats.memory_usage_percent > 70 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
              </CardContent>
            </Card>
          )}

          {stats.disk_usage_percent && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Disk Usage</p>
                    <p className="text-2xl font-bold">{stats.disk_usage_percent.toFixed(1)}%</p>
                  </div>
                  <HardDrive className={`w-8 h-8 ${
                    stats.disk_usage_percent > 90 ? 'text-red-600' :
                    stats.disk_usage_percent > 75 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Security Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Security Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.login_attempts_today}</p>
                <p className="text-sm text-muted-foreground">Login Attempts Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.failed_logins_today}</p>
                <p className="text-sm text-muted-foreground">Failed Logins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active_sessions}</p>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.suspicious_activities}</p>
                <p className="text-sm text-muted-foreground">Suspicious Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemDashboard;