/**
 * Metrics Grid Component
 *
 * Displays a grid of key performance metrics for legal operations
 * with trends, comparisons, and visual indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Scale,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Metric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  icon?: LucideIcon;
  color?: string;
  subtitle?: string;
  target?: number;
}

interface MetricsGridProps {
  metrics: Metric[];
  columns?: 2 | 3 | 4;
  compact?: boolean;
}

export default function MetricsGrid({
  metrics,
  columns = 4,
  compact = false,
}: MetricsGridProps) {
  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'md:grid-cols-2';
      case 3:
        return 'md:grid-cols-3';
      case 4:
        return 'md:grid-cols-2 lg:grid-cols-4';
      default:
        return 'md:grid-cols-2 lg:grid-cols-4';
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      case 'stable':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatChange = (change?: number, changeLabel?: string) => {
    if (change === undefined) return null;
    const sign = change > 0 ? '+' : '';
    const label = changeLabel || 'vs last period';
    return `${sign}${change}% ${label}`;
  };

  const getDefaultIcon = (id: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      documents: FileText,
      risk: AlertTriangle,
      pending: Clock,
      completed: CheckCircle2,
      settlement: DollarSign,
      users: Users,
      cases: Scale,
      timeline: Calendar,
      analytics: BarChart3,
    };
    return iconMap[id] || FileText;
  };

  return (
    <div className={`grid gap-4 ${getGridCols()}`}>
      {metrics.map((metric) => {
        const Icon = metric.icon || getDefaultIcon(metric.id);
        const iconColor = metric.color || 'text-muted-foreground';

        return (
          <Card
            key={metric.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader
              className={`flex flex-row items-center justify-between space-y-0 ${
                compact ? 'pb-2' : 'pb-3'
              }`}
            >
              <CardTitle
                className={compact ? 'text-sm font-medium' : 'text-base font-semibold'}
              >
                {metric.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Main Value */}
                <div className={compact ? 'text-2xl font-bold' : 'text-3xl font-bold'}>
                  {metric.value}
                </div>

                {/* Subtitle or Target */}
                {metric.subtitle && (
                  <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                )}

                {/* Change/Trend */}
                {(metric.change !== undefined || metric.trend) && (
                  <div className="flex items-center gap-1 pt-1">
                    {metric.trend && (
                      <span className={getTrendColor(metric.trend)}>
                        {getTrendIcon(metric.trend)}
                      </span>
                    )}
                    {metric.change !== undefined && (
                      <span
                        className={`text-xs font-medium ${getTrendColor(
                          metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'stable'
                        )}`}
                      >
                        {formatChange(metric.change, metric.changeLabel)}
                      </span>
                    )}
                  </div>
                )}

                {/* Target Progress */}
                {metric.target !== undefined && typeof metric.value === 'number' && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">
                        {metric.value} / {metric.target}
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Preset metric configurations
export const presetMetrics = {
  documents: (count: number, change?: number): Metric => ({
    id: 'documents',
    label: 'Total Documents',
    value: count,
    change,
    changeLabel: 'this week',
    icon: FileText,
    color: 'text-blue-600',
  }),

  highRisk: (count: number): Metric => ({
    id: 'risk',
    label: 'High Risk Items',
    value: count,
    subtitle: 'Requiring attention',
    icon: AlertTriangle,
    color: 'text-red-600',
  }),

  pending: (count: number): Metric => ({
    id: 'pending',
    label: 'Pending Reviews',
    value: count,
    subtitle: 'Awaiting review',
    icon: Clock,
    color: 'text-yellow-600',
  }),

  avgRisk: (score: number, trend?: 'up' | 'down' | 'stable'): Metric => ({
    id: 'risk',
    label: 'Avg Risk Score',
    value: score.toFixed(1),
    trend,
    subtitle: 'Out of 10',
    icon: BarChart3,
    color: 'text-orange-600',
  }),

  cases: (count: number, change?: number): Metric => ({
    id: 'cases',
    label: 'Active Cases',
    value: count,
    change,
    changeLabel: 'vs last month',
    icon: Scale,
    color: 'text-purple-600',
  }),

  settlement: (amount: string, trend?: 'up' | 'down'): Metric => ({
    id: 'settlement',
    label: 'Avg Settlement',
    value: amount,
    trend,
    subtitle: 'Based on similar cases',
    icon: DollarSign,
    color: 'text-green-600',
  }),

  timeline: (days: number): Metric => ({
    id: 'timeline',
    label: 'Avg Timeline',
    value: `${days}d`,
    subtitle: 'To case resolution',
    icon: Calendar,
    color: 'text-indigo-600',
  }),

  users: (count: number, limit: number): Metric => ({
    id: 'users',
    label: 'Team Members',
    value: count,
    target: limit,
    subtitle: `${limit - count} seats available`,
    icon: Users,
    color: 'text-cyan-600',
  }),
};
