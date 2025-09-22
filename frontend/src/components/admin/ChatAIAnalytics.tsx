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
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Bot,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Activity,
  Brain,
  Zap,
  Target,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
  Timer,
  Cpu,
} from 'lucide-react';
import { apiService, SystemStats, ChatSession } from '@/services/api';

interface ChatAIAnalyticsProps {
  className?: string;
}

type SessionTypeFilter = 'all' | 'general' | 'document' | 'multi_document';
type TimeRangeFilter = 'today' | 'week' | 'month' | 'all';

const ChatAIAnalytics: React.FC<ChatAIAnalyticsProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<SessionTypeFilter>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRangeFilter>('week');

  // Fetch system stats
  const { data: systemStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: apiService.getSystemStats,
    refetchInterval: 30000,
  });

  // Fetch chat sessions
  const { data: chatSessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['admin-chat-sessions'],
    queryFn: apiService.getChatSessions,
  });

  // Calculate chat analytics
  const chatAnalytics = useMemo(() => {
    if (!chatSessions.length || !systemStats) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const getTimeFilterDate = () => {
      switch (timeRangeFilter) {
        case 'today': return today;
        case 'week': return thisWeek;
        case 'month': return thisMonth;
        default: return new Date(0);
      }
    };

    const filterDate = getTimeFilterDate();
    const filteredSessions = chatSessions.filter(session =>
      new Date(session.created_at) >= filterDate
    );

    // Session type distribution
    const sessionTypes = {
      general: filteredSessions.filter(s => s.session_type === 'general').length,
      document: filteredSessions.filter(s => s.session_type === 'document').length,
      multi_document: filteredSessions.filter(s => s.session_type === 'multi_document').length,
    };

    // Calculate averages and totals
    const totalMessages = filteredSessions.reduce((sum, s) => sum + s.message_count, 0);
    const avgMessagesPerSession = filteredSessions.length > 0 ? totalMessages / filteredSessions.length : 0;
    const activeSessions = filteredSessions.filter(s => {
      const lastActivity = new Date(s.updated_at);
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      return lastActivity > hourAgo;
    }).length;

    // Cost calculations (estimated)
    const totalTokensUsed = systemStats.total_tokens_used || 0;
    const costPerToken = 0.000002; // Estimated cost per token
    const estimatedTotalCost = totalTokensUsed * costPerToken;
    const todayCost = systemStats.estimated_cost_today || 0;

    // Performance metrics
    const avgResponseTime = 800; // Would come from actual metrics
    const successRate = filteredSessions.length > 0 ?
      (filteredSessions.filter(s => s.message_count > 0).length / filteredSessions.length) * 100 : 0;

    return {
      totalSessions: filteredSessions.length,
      totalMessages,
      avgMessagesPerSession,
      activeSessions,
      sessionTypes,
      totalTokensUsed,
      estimatedTotalCost,
      todayCost,
      avgResponseTime,
      successRate,
      uniqueUsers: new Set(filteredSessions.map(s => s.id)).size, // Simplified
      peakHours: {}, // Would calculate from timestamps
    };
  }, [chatSessions, systemStats, timeRangeFilter]);

  // Filter chat sessions based on search and filters
  const filteredSessions = useMemo(() => {
    return chatSessions.filter((session) => {
      const matchesSearch = searchTerm === '' ||
        session.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = sessionTypeFilter === 'all' || session.session_type === sessionTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [chatSessions, searchTerm, sessionTypeFilter]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      general: { label: 'General', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      document: { label: 'Document', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      multi_document: { label: 'Multi-Doc', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
    };

    const config = typeConfig[type] || { label: type, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const isLoading = statsLoading || sessionsLoading;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat & AI Analytics</h2>
          <p className="text-muted-foreground">
            Monitor AI usage, performance metrics, and cost analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRangeFilter} onValueChange={(value: TimeRangeFilter) => setTimeRangeFilter(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { refetchStats(); refetchSessions(); }} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatAnalytics?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {chatAnalytics?.activeSessions || 0} active now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(chatAnalytics?.totalMessages || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Avg {chatAnalytics?.avgMessagesPerSession.toFixed(1) || 0} per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tokens Used</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(systemStats?.total_tokens_used || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(chatAnalytics?.estimatedTotalCost || 0)} estimated cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(systemStats?.estimated_cost_today || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Today's AI usage cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Performance Metrics</span>
            </CardTitle>
            <CardDescription>AI response times and success rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Avg Response Time</span>
              </div>
              <span className="text-sm font-medium">
                {chatAnalytics?.avgResponseTime || 0}ms
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Success Rate</span>
                </div>
                <span className="text-sm font-medium">
                  {chatAnalytics?.successRate.toFixed(1) || 0}%
                </span>
              </div>
              <Progress value={chatAnalytics?.successRate || 0} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Active Users</span>
              </div>
              <span className="text-sm font-medium">
                {chatAnalytics?.uniqueUsers || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Token Efficiency</span>
              </div>
              <span className="text-sm font-medium">
                {chatAnalytics?.totalMessages > 0
                  ? Math.round((chatAnalytics.totalTokensUsed || 0) / chatAnalytics.totalMessages)
                  : 0} tokens/msg
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Session Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Session Types</span>
            </CardTitle>
            <CardDescription>Distribution of chat session types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chatAnalytics?.sessionTypes && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm">General Chat</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{chatAnalytics.sessionTypes.general}</div>
                      <div className="text-xs text-muted-foreground">
                        {chatAnalytics.totalSessions > 0
                          ? Math.round((chatAnalytics.sessionTypes.general / chatAnalytics.totalSessions) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Document Chat</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{chatAnalytics.sessionTypes.document}</div>
                      <div className="text-xs text-muted-foreground">
                        {chatAnalytics.totalSessions > 0
                          ? Math.round((chatAnalytics.sessionTypes.document / chatAnalytics.totalSessions) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span className="text-sm">Multi-Document</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{chatAnalytics.sessionTypes.multi_document}</div>
                      <div className="text-xs text-muted-foreground">
                        {chatAnalytics.totalSessions > 0
                          ? Math.round((chatAnalytics.sessionTypes.multi_document / chatAnalytics.totalSessions) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{chatAnalytics.totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Recent Chat Sessions</span>
          </CardTitle>
          <CardDescription>Latest chat sessions and their activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sessionTypeFilter} onValueChange={(value: SessionTypeFilter) => setSessionTypeFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="multi_document">Multi-Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading chat sessions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || sessionTypeFilter !== 'all'
                        ? 'No sessions match your filters'
                        : 'No chat sessions found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.slice(0, 20).map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.title}</div>
                          <div className="text-xs text-muted-foreground">ID: {session.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getSessionTypeBadge(session.session_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span>{session.message_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(session.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(session.updated_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.message_count > 0 ? 'default' : 'secondary'}>
                          {session.message_count > 0 ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredSessions.length > 20 && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing 20 of {filteredSessions.length} sessions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatAIAnalytics;