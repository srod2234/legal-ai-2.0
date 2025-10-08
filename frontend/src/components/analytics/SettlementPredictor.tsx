/**
 * Settlement Predictor Component
 *
 * Displays settlement amount predictions with:
 * - Statistical analysis (low/expected/high estimates)
 * - Range visualization
 * - Historical comparison
 * - Confidence intervals
 * - Factor breakdown
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface SettlementPredictorProps {
  documentId: number;
}

export default function SettlementPredictor({ documentId }: SettlementPredictorProps) {
  // TODO: Replace with actual API call
  const settlementData = {
    expected: 425000,
    low: 320000,
    high: 580000,
    confidence: 82,
    historicalMedian: 380000,
    factors: [
      {
        name: 'Injury Severity',
        impact: 'High',
        contribution: 35,
        direction: 'increase',
      },
      {
        name: 'Clear Liability',
        impact: 'Medium',
        contribution: 25,
        direction: 'increase',
      },
      {
        name: 'Defendant Financial Status',
        impact: 'Medium',
        contribution: 20,
        direction: 'increase',
      },
      {
        name: 'Jurisdiction Trends',
        impact: 'Low',
        contribution: 12,
        direction: 'neutral',
      },
      {
        name: 'Plaintiff Credibility',
        impact: 'Low',
        contribution: 8,
        direction: 'decrease',
      },
    ],
    comparableCases: [
      { name: 'Similar Case A', amount: 450000, outcome: 'Settled' },
      { name: 'Similar Case B', amount: 380000, outcome: 'Settled' },
      { name: 'Similar Case C', amount: 520000, outcome: 'Verdict' },
      { name: 'Similar Case D', amount: 310000, outcome: 'Settled' },
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

  const getImpactColor = (impact: string): string => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Settlement Range Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Settlement Amount Prediction
          </CardTitle>
          <CardDescription>
            Based on case factors and historical data from similar cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expected Amount */}
          <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Expected Settlement Amount
            </p>
            <p className="text-5xl font-bold text-primary mb-2">
              {formatCurrency(settlementData.expected)}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">
                {settlementData.confidence}% confidence
              </Badge>
              <Badge variant="outline">
                {((settlementData.expected / settlementData.historicalMedian - 1) * 100).toFixed(0)}%
                above historical median
              </Badge>
            </div>
          </div>

          {/* Range Visualization */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Settlement Range</span>
                <span className="text-xs text-muted-foreground">
                  Low to High estimate
                </span>
              </div>
              <div className="relative">
                <div className="h-12 bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 rounded-lg relative overflow-hidden">
                  {/* Expected marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-primary"
                    style={{
                      left: `${((settlementData.expected - settlementData.low) / (settlementData.high - settlementData.low)) * 100}%`,
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold whitespace-nowrap">
                      Expected
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div>
                    <p className="font-semibold">Low</p>
                    <p className="text-muted-foreground">{formatCurrency(settlementData.low)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">High</p>
                    <p className="text-muted-foreground">{formatCurrency(settlementData.high)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Low Estimate</p>
                <p className="font-semibold">{formatCurrency(settlementData.low)}</p>
                <p className="text-xs text-muted-foreground mt-1">25th percentile</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className="font-semibold text-primary">{formatCurrency(settlementData.expected)}</p>
                <p className="text-xs text-muted-foreground mt-1">Most likely</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High Estimate</p>
                <p className="font-semibold">{formatCurrency(settlementData.high)}</p>
                <p className="text-xs text-muted-foreground mt-1">75th percentile</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributing Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Contributing Factors</CardTitle>
          <CardDescription>
            Key factors influencing the settlement amount prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settlementData.factors.map((factor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(factor.direction)}
                    <span className="text-sm font-medium">{factor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getImpactColor(factor.impact)}>
                      {factor.impact} Impact
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {factor.contribution}%
                    </span>
                  </div>
                </div>
                <Progress value={factor.contribution} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparable Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Comparable Cases</CardTitle>
          <CardDescription>
            Historical settlements from similar cases in this jurisdiction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settlementData.comparableCases.map((caseItem, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{caseItem.name}</p>
                  <p className="text-xs text-muted-foreground">{caseItem.outcome}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(caseItem.amount)}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {caseItem.amount >= settlementData.low && caseItem.amount <= settlementData.high ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">Within range</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Outside range</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="text-sm flex items-start gap-2">
              <span className="text-green-600 flex-shrink-0">✓</span>
              <span>
                Settlement amount is <strong>12% above</strong> historical median for similar cases
              </span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>
                <strong>High injury severity</strong> is the primary driver, contributing 35% to the estimate
              </span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>
                Comparable cases show a <strong>consistent settlement pattern</strong> in this jurisdiction
              </span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-yellow-600 flex-shrink-0">!</span>
              <span>
                Consider defendant's financial status - may support higher settlement negotiations
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
