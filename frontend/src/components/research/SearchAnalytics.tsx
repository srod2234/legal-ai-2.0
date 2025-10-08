/**
 * Search Analytics Component
 *
 * Displays analytics for search results:
 * - Outcome distribution
 * - Jurisdiction breakdown
 * - Timeline analysis
 * - Court hierarchy
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  MapPin,
} from 'lucide-react';

interface CaseResult {
  id: number;
  caseName: string;
  citation: string;
  court: string;
  jurisdiction: string;
  decisionDate: string;
  relevanceScore: number;
  outcome: string;
  summary: string;
}

interface SearchAnalyticsProps {
  results: CaseResult[];
}

export default function SearchAnalytics({ results }: SearchAnalyticsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
        <p className="text-muted-foreground">
          Perform a search to see analytics on case outcomes and trends
        </p>
      </div>
    );
  }

  // Calculate outcome distribution
  const outcomeStats = results.reduce((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate jurisdiction distribution
  const jurisdictionStats = results.reduce((acc, r) => {
    acc[r.jurisdiction] = (acc[r.jurisdiction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate average relevance
  const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Search Analytics</h2>
        <p className="text-muted-foreground">
          Statistical analysis of your search results
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{results.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Relevance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(avgRelevance * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jurisdictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.keys(jurisdictionStats).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Outcome Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of case outcomes in your search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(outcomeStats).map(([outcome, count]) => (
            <div key={outcome}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{outcome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {count} case{count !== 1 ? 's' : ''}
                  </span>
                  <Badge variant="secondary">
                    {((count / results.length) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <Progress value={(count / results.length) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Jurisdiction Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Jurisdiction Distribution
          </CardTitle>
          <CardDescription>
            Geographic breakdown of cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(jurisdictionStats)
            .sort(([, a], [, b]) => b - a)
            .map(([jurisdiction, count]) => (
              <div key={jurisdiction}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{jurisdiction}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {count} case{count !== 1 ? 's' : ''}
                    </span>
                    <Badge variant="secondary">
                      {((count / results.length) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={(count / results.length) * 100} className="h-2" />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Insights
          </CardTitle>
          <CardDescription>
            Notable patterns in your search results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {avgRelevance >= 0.8 && (
              <li className="text-sm flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>High average relevance score indicates strong search results</span>
              </li>
            )}
            {Object.keys(jurisdictionStats).length > 1 && (
              <li className="text-sm flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Cases span multiple jurisdictions - consider regional variations</span>
              </li>
            )}
            {results.length < 5 && (
              <li className="text-sm flex items-start gap-2">
                <span className="text-yellow-600">!</span>
                <span>Limited results - consider broadening your search criteria</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
