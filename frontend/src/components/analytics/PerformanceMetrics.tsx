/**
 * Performance Metrics Component
 *
 * Displays historical performance analytics:
 * - Firm-wide success rates
 * - Practice area performance
 * - Attorney performance comparison
 * - Month-over-month trends
 * - Case outcome statistics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Users,
  Calendar,
} from 'lucide-react';

export default function PerformanceMetrics() {
  // TODO: Replace with actual API call
  const performanceData = {
    overall: {
      successRate: 78,
      totalCases: 145,
      wonCases: 113,
      settledCases: 62,
      avgSettlement: 385000,
      trend: 'up',
      trendPercentage: 12,
    },
    practiceAreas: [
      {
        name: 'Personal Injury',
        successRate: 82,
        cases: 45,
        avgSettlement: 425000,
        trend: 'up',
      },
      {
        name: 'Employment Law',
        successRate: 75,
        cases: 38,
        avgSettlement: 185000,
        trend: 'stable',
      },
      {
        name: 'Real Estate',
        successRate: 71,
        cases: 32,
        avgSettlement: 520000,
        trend: 'down',
      },
      {
        name: 'Corporate',
        successRate: 85,
        cases: 22,
        avgSettlement: 750000,
        trend: 'up',
      },
      {
        name: 'Intellectual Property',
        successRate: 68,
        cases: 8,
        avgSettlement: 890000,
        trend: 'stable',
      },
    ],
    monthlyTrends: [
      { month: 'Jan', cases: 12, wins: 9, settlements: 5 },
      { month: 'Feb', cases: 15, wins: 11, settlements: 7 },
      { month: 'Mar', cases: 18, wins: 14, settlements: 8 },
      { month: 'Apr', cases: 14, wins: 10, settlements: 6 },
      { month: 'May', cases: 16, wins: 13, settlements: 7 },
      { month: 'Jun', cases: 19, wins: 15, settlements: 9 },
    ],
    topPerformers: [
      {
        name: 'Sarah Chen',
        role: 'Senior Partner',
        successRate: 89,
        cases: 28,
      },
      {
        name: 'Michael Rodriguez',
        role: 'Partner',
        successRate: 85,
        cases: 32,
      },
      {
        name: 'Emily Thompson',
        role: 'Associate',
        successRate: 78,
        cases: 24,
      },
    ],
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 border-b-2 border-gray-600" />;
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Firm Performance
          </CardTitle>
          <CardDescription>
            Historical success metrics and trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-primary" />
                <div className="flex items-center gap-1">
                  {getTrendIcon(performanceData.overall.trend)}
                  <span className={`text-xs font-semibold ${getTrendColor(performanceData.overall.trend)}`}>
                    {performanceData.overall.trendPercentage}%
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold text-primary">
                {performanceData.overall.successRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Overall Success Rate
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <Award className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">
                {performanceData.overall.totalCases}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Cases Handled
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <Target className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold text-green-600">
                {performanceData.overall.wonCases}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cases Won/Settled
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">
                {formatCurrency(performanceData.overall.avgSettlement)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg. Settlement
              </p>
            </div>
          </div>

          {/* Monthly Trend */}
          <div>
            <h4 className="text-sm font-semibold mb-3">6-Month Case Volume Trend</h4>
            <div className="space-y-2">
              {performanceData.monthlyTrends.map((month, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-10">{month.month}</span>
                  <div className="flex-1 flex gap-1">
                    <div
                      className="bg-green-500 h-6 rounded flex items-center justify-center text-white text-xs font-semibold"
                      style={{ width: `${(month.wins / 20) * 100}%` }}
                      title={`${month.wins} wins`}
                    >
                      {month.wins > 0 && month.wins}
                    </div>
                    <div
                      className="bg-blue-500 h-6 rounded flex items-center justify-center text-white text-xs font-semibold"
                      style={{ width: `${(month.settlements / 20) * 100}%` }}
                      title={`${month.settlements} settlements`}
                    >
                      {month.settlements > 0 && month.settlements}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-16">
                    {month.cases} total
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Wins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Settlements</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Area Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Practice Area</CardTitle>
          <CardDescription>
            Success rates and metrics across different practice areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.practiceAreas.map((area, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{area.name}</span>
                    {getTrendIcon(area.trend)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {area.cases} cases
                    </span>
                    <Badge variant="secondary">
                      Avg: {formatCurrency(area.avgSettlement)}
                    </Badge>
                    <span className={`text-sm font-bold ${getSuccessRateColor(area.successRate)}`}>
                      {area.successRate}%
                    </span>
                  </div>
                </div>
                <Progress value={area.successRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>
            Attorneys with highest success rates this quarter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceData.topPerformers.map((performer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{performer.name}</p>
                    <p className="text-xs text-muted-foreground">{performer.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getSuccessRateColor(performer.successRate)}`}>
                    {performer.successRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {performer.cases} cases
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="text-sm flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>12% improvement</strong> in overall success rate compared to last quarter
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Award className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Corporate practice area</strong> shows strongest performance at 85% success rate
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Calendar className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>
                Case volume trending upward - consider resource allocation to maintain quality
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Users className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>
                Top performers averaging <strong>84% success rate</strong> - consider mentorship program
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
