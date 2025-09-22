import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Shield,
  Search,
  Download,
  RefreshCw,
  Filter,
  AlertTriangle,
  Calendar as CalendarIcon,
  Eye,
  Activity,
  Users,
  Lock,
  FileWarning,
  Clock,
  MapPin,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { apiService, AuditLogResponse } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SecurityAuditManagementProps {
  className?: string;
}

type ActionFilter = 'all' | 'login' | 'logout' | 'create' | 'read' | 'update' | 'delete' | 'upload' | 'download' | 'chat' | 'admin_action' | 'security_event';
type RiskLevelFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

const SecurityAuditManagement: React.FC<SecurityAuditManagementProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevelFilter>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);

  // Fetch audit logs
  const {
    data: auditData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-audit-logs', { page, perPage, actionFilter, riskFilter, dateFrom, dateTo, searchTerm }],
    queryFn: () =>
      apiService.searchAuditLogs({
        page,
        per_page: perPage,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        date_from: dateFrom?.toISOString(),
        date_to: dateTo?.toISOString(),
      }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter audit logs based on search term (client-side filtering for real-time search)
  const filteredLogs = useMemo(() => {
    if (!auditData?.logs) return [];

    return auditData.logs.filter((log) => {
      const matchesSearch = searchTerm === '' ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm) ||
        log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk = riskFilter === 'all' || log.risk_level === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [auditData?.logs, searchTerm, riskFilter]);

  // Calculate security metrics
  const securityMetrics = useMemo(() => {
    const logs = auditData?.logs || [];
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const metrics = {
      totalLogs: logs.length,
      highRiskEvents: logs.filter(l => l.risk_level === 'high' || l.risk_level === 'critical').length,
      failedLogins: logs.filter(l => l.action === 'login' && l.status_code === 401).length,
      uniqueIPs: new Set(logs.map(l => l.ip_address).filter(Boolean)).size,
      sensitiveActions: logs.filter(l => l.is_sensitive).length,
      adminActions: logs.filter(l => l.action === 'admin_action').length,
      recentActivity: logs.filter(l => new Date(l.timestamp) > last24h).length,
      weeklyTrend: logs.filter(l => new Date(l.timestamp) > lastWeek).length,
    };

    return metrics;
  }, [auditData?.logs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <Lock className="w-4 h-4" />;
      case 'admin_action':
        return <Shield className="w-4 h-4" />;
      case 'security_event':
        return <AlertTriangle className="w-4 h-4" />;
      case 'upload':
      case 'download':
        return <FileWarning className="w-4 h-4" />;
      case 'chat':
        return <Activity className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const actionLabels: Record<string, { label: string; variant: string }> = {
      login: { label: 'Login', variant: 'default' },
      logout: { label: 'Logout', variant: 'secondary' },
      create: { label: 'Create', variant: 'default' },
      read: { label: 'Read', variant: 'secondary' },
      update: { label: 'Update', variant: 'default' },
      delete: { label: 'Delete', variant: 'destructive' },
      upload: { label: 'Upload', variant: 'default' },
      download: { label: 'Download', variant: 'secondary' },
      chat: { label: 'Chat', variant: 'default' },
      admin_action: { label: 'Admin', variant: 'default' },
      security_event: { label: 'Security', variant: 'destructive' },
    };

    const config = actionLabels[action] || { label: action, variant: 'secondary' };

    if (config.variant === 'destructive') {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{config.label}</Badge>;
    } else if (config.variant === 'default') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{config.label}</Badge>;
    } else {
      return <Badge variant="secondary">{config.label}</Badge>;
    }
  };

  const getRiskLevelBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Badge className="bg-red-600 text-white hover:bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleExportLogs = async () => {
    try {
      const blob = await apiService.exportAuditLogs({
        format: 'csv',
        date_from: dateFrom?.toISOString(),
        date_to: dateTo?.toISOString(),
      });

      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Audit logs exported successfully');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security & Audit Management</h2>
          <p className="text-muted-foreground">
            Monitor security events and audit system activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.totalLogs}</div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics.recentActivity} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityMetrics.highRiskEvents}</div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics.sensitiveActions} sensitive actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Lock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{securityMetrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">
              Authentication failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.uniqueIPs}</div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics.adminActions} admin actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Audit Log Viewer</span>
          </CardTitle>
          <CardDescription>Search and analyze security events and system activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by user, description, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={(value: ActionFilter) => setActionFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="admin_action">Admin</SelectItem>
                <SelectItem value="security_event">Security</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={(value: RiskLevelFilter) => setRiskFilter(value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[130px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'MMM dd') : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[130px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'MMM dd') : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                Clear dates
              </Button>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading audit logs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || actionFilter !== 'all' || riskFilter !== 'all' || dateFrom || dateTo
                        ? 'No audit logs match your filters'
                        : 'No audit logs found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className={log.risk_level === 'critical' || log.risk_level === 'high' ? 'bg-red-50' : ''}>
                      <TableCell className="font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {log.user_email || 'System'}
                          </div>
                          {log.user_role && (
                            <div className="text-xs text-muted-foreground">
                              {log.user_role}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.resource_type || '—'}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {log.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip_address || '—'}
                      </TableCell>
                      <TableCell>
                        {getRiskLevelBadge(log.risk_level)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {log.status_code && (
                            <Badge
                              variant={
                                log.status_code >= 200 && log.status_code < 300
                                  ? 'default'
                                  : log.status_code >= 400
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {log.status_code}
                            </Badge>
                          )}
                          {log.is_sensitive && (
                            <Badge variant="outline" className="text-xs">
                              Sensitive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination and Results Summary */}
          {auditData && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {auditData.total} logs
                {searchTerm || riskFilter !== 'all' ? ' (filtered)' : ''}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!auditData.has_prev}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {auditData.page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!auditData.has_next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditManagement;