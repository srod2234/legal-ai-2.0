/**
 * Risk Panel Component
 *
 * Displays comprehensive risk assessment overview with:
 * - Overall risk score
 * - Risk breakdown by category
 * - High-priority issues
 * - Recommendations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  FileText,
  Shield,
} from 'lucide-react';

interface RiskAssessment {
  id: number;
  overallRiskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  totalClauses: number;
  criticalClauses: number;
  highRiskClauses: number;
  analyzedAt: string;
}

interface Clause {
  id: number;
  clauseType: string;
  content: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  pageNumber: number;
  recommendations: string[];
}

interface RiskPanelProps {
  assessment: RiskAssessment;
  clauses: Clause[];
  onClauseClick?: (clause: Clause) => void;
}

export default function RiskPanel({
  assessment,
  clauses,
  onClauseClick,
}: RiskPanelProps) {
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskDescription = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'Immediate attention required - significant legal exposure';
      case 'high':
        return 'Review recommended - potential legal concerns identified';
      case 'medium':
        return 'Monitor - standard commercial terms with some concerns';
      case 'low':
        return 'Acceptable - minimal legal risk identified';
      default:
        return '';
    }
  };

  const highPriorityClauses = clauses
    .filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const allRecommendations = highPriorityClauses
    .flatMap(c => c.recommendations)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getRiskIcon(assessment.riskLevel)}
                Overall Risk Assessment
              </CardTitle>
              <CardDescription>
                {getRiskDescription(assessment.riskLevel)}
              </CardDescription>
            </div>
            <Badge
              variant={
                assessment.riskLevel === 'critical' || assessment.riskLevel === 'high'
                  ? 'destructive'
                  : 'default'
              }
              className="text-lg px-4 py-2"
            >
              {assessment.riskLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Risk Score</span>
                <span className={`text-2xl font-bold ${getRiskColor(assessment.riskLevel)}`}>
                  {assessment.overallRiskScore.toFixed(1)} / 10
                </span>
              </div>
              <Progress value={assessment.overallRiskScore * 10} className="h-3" />
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{assessment.totalClauses}</div>
                <div className="text-xs text-muted-foreground">Total Clauses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {assessment.criticalClauses}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {assessment.highRiskClauses}
                </div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Priority Issues */}
      {highPriorityClauses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              High Priority Issues
            </CardTitle>
            <CardDescription>
              Issues requiring immediate review and attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPriorityClauses.map((clause) => (
                <div
                  key={clause.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onClauseClick?.(clause)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(clause.riskLevel)}
                      <span className="font-medium text-sm">{clause.clauseType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Page {clause.pageNumber}
                      </Badge>
                      <span className={`text-sm font-semibold ${getRiskColor(clause.riskLevel)}`}>
                        {clause.riskScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Recommendations */}
      {allRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Key Recommendations
            </CardTitle>
            <CardDescription>
              Suggested actions to mitigate identified risks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {allRecommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risk Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Risk Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of risks by clause category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Indemnification', 'Liability', 'Termination', 'IP Rights', 'Confidentiality'].map((category) => {
              const categoryClauses = clauses.filter(c =>
                c.clauseType.toLowerCase().includes(category.toLowerCase())
              );
              const avgRisk = categoryClauses.length > 0
                ? categoryClauses.reduce((sum, c) => sum + c.riskScore, 0) / categoryClauses.length
                : 0;

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {categoryClauses.length} clause{categoryClauses.length !== 1 ? 's' : ''}
                      </span>
                      {avgRisk > 0 && (
                        <span className="text-sm font-semibold">
                          {avgRisk.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={avgRisk * 10} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="flex-1">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Predictive Analytics
        </Button>
        <Button variant="outline" className="flex-1">
          Export Report
        </Button>
      </div>
    </div>
  );
}
