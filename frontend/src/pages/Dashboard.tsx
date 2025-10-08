/**
 * LEGAL 3.0 Dashboard
 *
 * Enterprise legal intelligence dashboard with:
 * - Risk summary overview
 * - Recent document activity
 * - Analytics highlights
 * - Quick actions
 * - Firm metrics (if multi-tenant)
 */

import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  FileText,
  Scale,
  TrendingUp,
  Users,
  Building2,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDocuments } from '../hooks/useDocuments';
import { Document } from '../services/api';

interface DashboardStats {
  totalDocuments: number;
  recentDocuments: number;
  highRiskDocuments: number;
  averageRiskScore: number;
  totalCases: number;
  pendingReviews: number;
}

interface RiskLevel {
  level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  count: number;
  percentage: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: documents, isLoading, error } = useDocuments();

  // Calculate dashboard stats from real document data
  const stats: DashboardStats = {
    totalDocuments: documents?.length || 0,
    recentDocuments: documents?.filter(doc => {
      const uploadedAt = new Date(doc.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return uploadedAt >= weekAgo;
    }).length || 0,
    highRiskDocuments: documents?.filter(doc =>
      (doc as any).risk_level === 'high' || (doc as any).risk_level === 'critical'
    ).length || 0,
    averageRiskScore: documents?.length
      ? documents.reduce((sum, doc) => sum + ((doc as any).overall_risk_score || 0), 0) / documents.length
      : 0,
    totalCases: 0, // TODO: Implement case counting when case model is available
    pendingReviews: documents?.filter(doc =>
      doc.processing_status === 'processing' || doc.processing_status === 'uploaded'
    ).length || 0,
  };

  // Get recent documents (top 5)
  const recentDocs = documents
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(doc => ({
      id: doc.id,
      filename: doc.original_filename,
      riskLevel: ((doc as any).risk_level || 'low') as 'critical' | 'high' | 'medium' | 'low',
      riskScore: (doc as any).overall_risk_score || 0,
      uploadedAt: doc.created_at,
      status: doc.processing_status,
    })) || [];

  // Calculate risk distribution
  const riskDistribution: RiskLevel[] = [
    { level: 'critical', count: 0, percentage: 0 },
    { level: 'high', count: 0, percentage: 0 },
    { level: 'medium', count: 0, percentage: 0 },
    { level: 'low', count: 0, percentage: 0 },
  ];

  if (documents && documents.length > 0) {
    documents.forEach(doc => {
      const riskLevel = (doc as any).risk_level as string;
      const item = riskDistribution.find(r => r.level === riskLevel);
      if (item) {
        item.count++;
      } else {
        // Default to low if no risk level
        riskDistribution[3].count++;
      }
    });

    riskDistribution.forEach(item => {
      item.percentage = (item.count / documents.length) * 100;
    });
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <XCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="mt-4 text-muted-foreground">Failed to load dashboard data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Legal Intelligence Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here's an overview of your legal documents and cases.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentDocuments} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRiskDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRiskScore.toFixed(1)}</div>
            <Progress value={stats.averageRiskScore * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Documents awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              Latest uploaded documents with risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {getRiskIcon(doc.riskLevel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRiskColor(doc.riskLevel) as any}>
                      {doc.riskLevel.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">{doc.riskScore}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/documents')}
            >
              View All Documents
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button
                className="justify-start h-auto py-4"
                variant="outline"
                onClick={() => navigate('/documents')}
              >
                <FileText className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Upload Document</div>
                  <div className="text-xs text-muted-foreground">
                    Analyze contracts and legal documents
                  </div>
                </div>
              </Button>

              <Button
                className="justify-start h-auto py-4"
                variant="outline"
                onClick={() => navigate('/analytics')}
              >
                <Scale className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Case Research</div>
                  <div className="text-xs text-muted-foreground">
                    Search legal precedents and case law
                  </div>
                </div>
              </Button>

              <Button
                className="justify-start h-auto py-4"
                variant="outline"
                onClick={() => navigate('/analytics')}
              >
                <TrendingUp className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Predictive Analytics</div>
                  <div className="text-xs text-muted-foreground">
                    Litigation outcome predictions
                  </div>
                </div>
              </Button>

              <Button
                className="justify-start h-auto py-4"
                variant="outline"
                onClick={() => navigate('/admin')}
              >
                <Users className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">User Management</div>
                  <div className="text-xs text-muted-foreground">
                    Manage team members and permissions
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>
            Overview of document risk levels across your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskDistribution.map((risk) => (
              <div key={risk.level}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{risk.level} Risk</span>
                  <span className="text-sm text-muted-foreground">
                    {risk.count} document{risk.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <Progress value={risk.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
