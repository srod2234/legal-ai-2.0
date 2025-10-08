/**
 * Risk Summary Card Component
 *
 * Displays summarized risk information for a document or portfolio
 * with visual indicators and quick actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

export interface RiskSummary {
  overallScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  totalClauses: number;
  criticalClauses: number;
  highRiskClauses: number;
  mediumRiskClauses: number;
  lowRiskClauses: number;
  trend?: 'up' | 'down' | 'stable';
  lastAnalyzed?: string;
}

interface RiskSummaryCardProps {
  summary: RiskSummary;
  title?: string;
  description?: string;
  onViewDetails?: () => void;
  showActions?: boolean;
}

export default function RiskSummaryCard({
  summary,
  title = 'Risk Assessment Summary',
  description = 'Overall risk evaluation',
  onViewDetails,
  showActions = true,
}: RiskSummaryCardProps) {
  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      case 'minimal':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (level: string): 'default' | 'destructive' | 'secondary' => {
    switch (level) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'low':
      case 'minimal':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not analyzed yet';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getRiskIcon(summary.riskLevel)}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={getRiskBadgeVariant(summary.riskLevel)}>
            {summary.riskLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Risk Score</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getRiskColor(summary.riskLevel)}`}>
                {summary.overallScore.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 10</span>
              {summary.trend && getTrendIcon(summary.trend)}
            </div>
          </div>
          <Progress
            value={summary.overallScore * 10}
            className="h-3"
          />
        </div>

        {/* Risk Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Risk Distribution</h4>

          {summary.criticalClauses > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span>Critical Risk</span>
              </div>
              <span className="font-medium">{summary.criticalClauses}</span>
            </div>
          )}

          {summary.highRiskClauses > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                <span>High Risk</span>
              </div>
              <span className="font-medium">{summary.highRiskClauses}</span>
            </div>
          )}

          {summary.mediumRiskClauses > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                <span>Medium Risk</span>
              </div>
              <span className="font-medium">{summary.mediumRiskClauses}</span>
            </div>
          )}

          {summary.lowRiskClauses > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span>Low Risk</span>
              </div>
              <span className="font-medium">{summary.lowRiskClauses}</span>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total Clauses</span>
              <span>{summary.totalClauses}</span>
            </div>
          </div>
        </div>

        {/* Last Analyzed */}
        {summary.lastAnalyzed && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            Last analyzed: {formatDate(summary.lastAnalyzed)}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={onViewDetails}
            >
              View Details
            </Button>
            <Button variant="outline" className="flex-1">
              Export Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
