import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Server,
  Database,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Shield,
  Monitor,
  Thermometer,
  Router,
  Cloud,
  Settings,
  Info,
} from 'lucide-react';
import { apiService, SystemHealth } from '@/services/api';

interface SystemMonitoringProps {
  className?: string;
}

const SystemMonitoring: React.FC<SystemMonitoringProps> = ({ className }) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Fetch system health
  const {
    data: systemHealth,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => apiService.getSystemHealth(),
    refetchInterval: 15000, // Refresh every 15 seconds for real-time monitoring
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Monitor className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getComponentIcon = (componentName: string) => {
    switch (componentName) {
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'vector_database':
        return <Database className="w-5 h-5" />;
      case 'llm_service':
        return <Zap className="w-5 h-5" />;
      case 'system_resources':
        return <Server className="w-5 h-5" />;
      case 'storage':
        return <HardDrive className="w-5 h-5" />;
      case 'network':
        return <Wifi className="w-5 h-5" />;
      case 'security':
        return <Shield className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
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
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Failed to load system health data: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemHealth?.status || 'unknown')}
            {getStatusBadge(systemHealth?.status || 'unknown')}
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemHealth?.status || 'unknown')}
              <div className="text-2xl font-bold capitalize">{systemHealth?.status || 'Unknown'}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {systemHealth?.timestamp ? formatTimestamp(systemHealth.timestamp) : 'Never'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(systemHealth?.uptime_seconds || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Since last restart
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Version</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.version || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              Application version
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      {systemHealth?.components?.system_resources && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>System Resources</span>
            </CardTitle>
            <CardDescription>CPU, memory, and disk usage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CPU Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm">
                    {systemHealth.components.system_resources.cpu_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <Progress
                  value={systemHealth.components.system_resources.cpu_percent || 0}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {systemHealth.components.system_resources.cpu_percent > 80 ? 'High usage' : 'Normal'}
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MemoryStick className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm">
                    {systemHealth.components.system_resources.memory_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <Progress
                  value={systemHealth.components.system_resources.memory_percent || 0}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {systemHealth.components.system_resources.memory_percent > 85 ? 'High usage' : 'Normal'}
                </div>
              </div>

              {/* Disk Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk Usage</span>
                  </div>
                  <span className="text-sm">
                    {systemHealth.components.system_resources.disk_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <Progress
                  value={systemHealth.components.system_resources.disk_percent || 0}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {systemHealth.components.system_resources.disk_percent > 90 ? 'Low space' : 'Normal'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5" />
            <span>Component Health</span>
          </CardTitle>
          <CardDescription>Status of all system components and services</CardDescription>
        </CardHeader>
        <CardContent>
          {systemHealth?.components ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(systemHealth.components).map(([name, component]: [string, any]) => (
                <div
                  key={name}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedComponent === name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedComponent(selectedComponent === name ? null : name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getComponentIcon(name)}
                      <span className="font-medium capitalize">
                        {name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {getStatusBadge(component.status)}
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    {component.details || 'No additional details available'}
                  </div>

                  {component.response_time_ms && (
                    <div className="text-xs text-muted-foreground">
                      Response time: {component.response_time_ms}ms
                    </div>
                  )}

                  {component.error && (
                    <div className="text-xs text-red-600 mt-2">
                      Error: {component.error}
                    </div>
                  )}

                  {/* Expanded details */}
                  {selectedComponent === name && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {Object.entries(component).map(([key, value]: [string, any]) => {
                        if (['status', 'details', 'error'].includes(key)) return null;
                        return (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-mono">
                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No component health data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version:</span>
              <span className="text-sm font-medium">{systemHealth?.version || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="text-sm font-medium capitalize">{systemHealth?.status || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Uptime:</span>
              <span className="text-sm font-medium">
                {formatUptime(systemHealth?.uptime_seconds || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Check:</span>
              <span className="text-sm font-medium">
                {systemHealth?.timestamp ? formatTimestamp(systemHealth.timestamp) : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="w-full justify-start"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Health Check
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <Server className="w-4 h-4 mr-2" />
              Restart Services (Coming Soon)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <Database className="w-4 h-4 mr-2" />
              Run Diagnostics (Coming Soon)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <Cloud className="w-4 h-4 mr-2" />
              Export Logs (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemMonitoring;