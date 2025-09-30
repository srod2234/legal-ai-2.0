import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  Activity,
  Shield,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService, AdminDashboardData } from "@/services/api";
import ChatAIAnalytics from "@/components/admin/ChatAIAnalytics";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper function to format dates for display
const formatChartDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: "success" | "warning" | "error";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  status,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-primary";
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`w-8 h-8 ${getStatusColor()}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

const Analytics = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate]);

  // Fetch dashboard data - fallback to stats if dashboard endpoint fails
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      try {
        return await apiService.getAdminDashboard();
      } catch (err) {
        console.warn("Dashboard endpoint failed, falling back to stats:", err);
        // Fallback to basic stats if dashboard endpoint doesn't exist
        const stats = await apiService.getAdminStats();
        return {
          system_stats: stats,
          system_health: {
            status: "healthy",
            components: {},
            timestamp: new Date().toISOString(),
            uptime_seconds: 0,
            version: "1.0.0"
          },
          security_summary: {
            total_audit_logs: 0,
            high_risk_events: 0,
            failed_logins_24h: 0,
            suspicious_ips: [],
            active_sessions: 0,
            recent_admin_actions: [],
            security_alerts: 0
          },
          performance_metrics: {
            avg_response_time_ms: 0,
            total_requests_24h: 0,
            error_rate_percent: 0,
            document_processing_avg_time: 0,
            chat_response_avg_time: 0,
            database_query_avg_time: 0,
            vector_search_avg_time: 0
          },
          recent_activities: [],
          recent_alerts: []
        };
      }
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (authLoading || !isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Analytics</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the analytics data.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.system_stats;
  const health = dashboardData?.system_health;
  const security = dashboardData?.security_summary;
  const performance = dashboardData?.performance_metrics;

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
              <BarChart3 className="w-8 h-8" />
              <span>Analytics Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive system insights and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {dashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics Overview - Streamlined */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Users"
                value={`${stats?.total_users || 0} (${stats?.active_users || 0} active)`}
                description={`${stats?.user_engagement_score || 0} avg sessions/user`}
                icon={<Users className="w-8 h-8" />}
                trend={{
                  value: stats?.new_users_today || 0,
                  isPositive: (stats?.new_users_today || 0) > 0,
                }}
              />
              <MetricCard
                title="Documents"
                value={stats?.total_documents || 0}
                description={`${stats?.document_processing_success_rate || 100}% success rate`}
                icon={<FileText className="w-8 h-8" />}
                status={
                  (stats?.document_processing_success_rate || 100) < 90 ? "warning" : "success"
                }
              />
              <MetricCard
                title="AI Costs"
                value={`$${stats?.ai_cost_metrics?.total_cost_this_month?.toFixed(2) || 0}`}
                description={`$${stats?.ai_cost_metrics?.total_cost_today?.toFixed(2) || 0} today`}
                icon={<TrendingUp className="w-8 h-8" />}
                trend={{
                  value: Math.abs(stats?.ai_cost_metrics?.cost_trend_percent || 0),
                  isPositive: (stats?.ai_cost_metrics?.cost_trend_percent || 0) >= 0
                }}
              />
              <MetricCard
                title="Performance"
                value={performance?.system_performance_status || "Good"}
                description={`${performance?.avg_response_time_ms?.toFixed(0) || 0}ms avg response`}
                icon={
                  performance?.system_performance_status === "good" ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : performance?.system_performance_status === "fair" ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )
                }
                status={
                  performance?.system_performance_status === "good"
                    ? "success"
                    : performance?.system_performance_status === "fair"
                    ? "warning"
                    : "error"
                }
              />
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Usage & Documents</TabsTrigger>
                <TabsTrigger value="chat">Chat & AI</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Activity Trends */}
                  <Card className="shadow-elegant">
                    <CardHeader>
                      <CardTitle>User Activity Trends</CardTitle>
                      <CardDescription>
                        Daily active users and new registrations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dashboardData?.user_activity_trends?.map(item => ({
                          ...item,
                          displayDate: formatChartDate(item.date)
                        })) || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="displayDate" />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                return new Date(payload[0].payload.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                              }
                              return label;
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stackId="1"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                            name="Active Users"
                          />
                          <Area
                            type="monotone"
                            dataKey="newUsers"
                            stackId="1"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.6}
                            name="New Users"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Document Type Distribution */}
                  <Card className="shadow-elegant">
                    <CardHeader>
                      <CardTitle>Document Types</CardTitle>
                      <CardDescription>
                        Distribution of uploaded document formats
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={dashboardData?.document_type_distribution || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {(dashboardData?.document_type_distribution || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} documents`, 'Count']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle>Recent User Activities</CardTitle>
                    <CardDescription>
                      Latest user actions and system events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.recent_activities?.slice(0, 5).map((activity) => (
                        <div
                          key={activity.user_id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{activity.user_email}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.documents_uploaded} documents,{" "}
                                {activity.chat_messages_sent} messages
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Last activity
                            </p>
                            <p className="text-sm">
                              {activity.last_activity
                                ? new Date(activity.last_activity).toLocaleDateString()
                                : "Never"}
                            </p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-center text-muted-foreground py-8">
                          No recent activities to display
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>



              <TabsContent value="usage" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    title="Storage Used"
                    value={`${stats?.total_file_size_gb?.toFixed(2) || 0} GB`}
                    description="Total file storage"
                    icon={<FileText className="w-8 h-8" />}
                  />
                  <MetricCard
                    title="Total Tokens"
                    value={stats?.total_tokens_used || 0}
                    description="AI processing tokens"
                    icon={<MessageSquare className="w-8 h-8" />}
                  />
                  <MetricCard
                    title="Estimated Cost"
                    value={`$${stats?.estimated_cost_total?.toFixed(2) || 0}`}
                    description={`$${stats?.estimated_cost_today?.toFixed(2) || 0} today`}
                    icon={<TrendingUp className="w-8 h-8" />}
                  />
                </div>

                {/* Document Processing Status */}
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle>Document Processing</CardTitle>
                    <CardDescription>
                      Current document processing pipeline status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border border-border rounded-lg">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{stats?.documents_processed_today || 0}</p>
                        <p className="text-sm text-muted-foreground">Processed Today</p>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{stats?.documents_processing || 0}</p>
                        <p className="text-sm text-muted-foreground">Currently Processing</p>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{stats?.documents_failed || 0}</p>
                        <p className="text-sm text-muted-foreground">Failed Processing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-6">
                <ChatAIAnalytics />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;