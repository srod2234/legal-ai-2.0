/**
 * Comparable Cases Component
 *
 * Displays similar personal injury cases with outcomes:
 * - Case comparisons
 * - Settlement amounts
 * - Relevance scoring
 * - Key factors analysis
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Scale,
  ExternalLink,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
} from 'lucide-react';

interface ComparableCasesProps {
  caseId: number;
}

export default function ComparableCases({ caseId }: ComparableCasesProps) {
  // TODO: Replace with actual API call
  const comparableCases = [
    {
      caseId: 1,
      caseName: 'Johnson v. Metro Transit',
      citation: '234 F. Supp. 3d 890 (S.D.N.Y. 2023)',
      jurisdiction: 'Federal - S.D.N.Y.',
      court: 'Southern District of New York',
      decisionDate: '2023-08-15',
      outcome: 'Plaintiff Verdict',
      settlementAmount: 485000,
      injuryDescription: 'TBI and spinal injuries from bus accident with permanent disability',
      relevanceScore: 0.92,
      keyFactors: [
        'Similar injury severity',
        'Permanent disability (18% impairment)',
        'Strong liability case',
        'Comparable medical costs ($72K)',
      ],
    },
    {
      caseId: 2,
      caseName: 'Martinez v. Corporate Logistics Inc.',
      citation: '567 F.3d 234 (2nd Cir. 2023)',
      jurisdiction: 'Federal - 2nd Circuit',
      court: '2nd Circuit Court of Appeals',
      decisionDate: '2023-11-20',
      outcome: 'Settlement',
      settlementAmount: 425000,
      injuryDescription: 'Multiple injuries from commercial vehicle collision',
      relevanceScore: 0.88,
      keyFactors: [
        'Comparable medical costs ($65K)',
        'Similar age plaintiff (42 years)',
        'Lost earning capacity component',
        'Moderate permanent impairment',
      ],
    },
    {
      caseId: 3,
      caseName: 'Thompson v. City Transportation',
      citation: '123 N.E.3d 456 (N.Y. 2024)',
      jurisdiction: 'State - New York',
      court: 'New York Court of Appeals',
      decisionDate: '2024-02-10',
      outcome: 'Plaintiff Verdict',
      settlementAmount: 520000,
      injuryDescription: 'TBI and orthopedic injuries with ongoing care needs',
      relevanceScore: 0.85,
      keyFactors: [
        'Ongoing care requirements',
        'Clear negligence finding',
        'Significant pain and suffering award',
        'Future medical needs documented',
      ],
    },
    {
      caseId: 4,
      caseName: 'Williams Personal Injury Settlement',
      citation: 'Case No. 2023-CV-8901 (settled)',
      jurisdiction: 'State - New York',
      court: 'New York Supreme Court',
      decisionDate: '2024-01-15',
      outcome: 'Settlement',
      settlementAmount: 395000,
      injuryDescription: 'Spinal and soft tissue injuries with partial recovery',
      relevanceScore: 0.78,
      keyFactors: [
        'Partial recovery achieved',
        'Shorter treatment duration',
        'Lower permanent impairment (10%)',
        'Disputed liability element',
      ],
    },
    {
      caseId: 5,
      caseName: 'Davis v. Public Transit Authority',
      citation: '890 F. Supp. 3d 234 (E.D.N.Y. 2023)',
      jurisdiction: 'Federal - E.D.N.Y.',
      court: 'Eastern District of New York',
      decisionDate: '2023-09-22',
      outcome: 'Plaintiff Verdict',
      settlementAmount: 510000,
      injuryDescription: 'Multiple trauma with surgical interventions',
      relevanceScore: 0.82,
      keyFactors: [
        'Multiple surgeries required',
        'High medical costs ($78K)',
        'Permanent functional limitations',
        'Strong expert testimony',
      ],
    },
  ];

  const statistics = {
    averageSettlement: 467000,
    medianSettlement: 485000,
    range: { low: 395000, high: 520000 },
    totalCases: comparableCases.length,
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getOutcomeColor = (outcome: string): string => {
    if (outcome.includes('Plaintiff')) return 'bg-green-100 text-green-800 border-green-200';
    if (outcome.includes('Settlement')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparable Cases Statistics
          </CardTitle>
          <CardDescription>
            Analysis of {statistics.totalCases} similar personal injury cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Average Settlement</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(statistics.averageSettlement)}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Median Settlement</p>
              <p className="text-2xl font-bold">{formatCurrency(statistics.medianSettlement)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Settlement Range</p>
              <p className="text-lg font-bold">
                {formatCurrency(statistics.range.low)} - {formatCurrency(statistics.range.high)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparable Cases List */}
      <div className="space-y-4">
        {comparableCases.map((caseData) => (
          <Card key={caseData.caseId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Scale className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight">
                      {caseData.caseName}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span>{caseData.citation}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {caseData.jurisdiction}
                        </span>
                        <span>•</span>
                        <span>{caseData.court}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(caseData.decisionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge className={getOutcomeColor(caseData.outcome)}>
                    {caseData.outcome}
                  </Badge>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(caseData.settlementAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Relevance Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Case Relevance</span>
                  <span className="text-sm font-semibold text-primary">
                    {(caseData.relevanceScore * 100).toFixed(0)}% match
                  </span>
                </div>
                <Progress value={caseData.relevanceScore * 100} className="h-2" />
              </div>

              {/* Injury Description */}
              <div>
                <span className="text-sm font-semibold block mb-2">Injury Description</span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {caseData.injuryDescription}
                </p>
              </div>

              {/* Key Factors */}
              <div>
                <span className="text-sm font-semibold block mb-2">Key Similarity Factors</span>
                <div className="grid gap-2 md:grid-cols-2">
                  {caseData.keyFactors.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm p-2 bg-muted rounded"
                    >
                      <span className="text-primary flex-shrink-0">✓</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Case
                </Button>
                <Button variant="ghost" size="sm">
                  Compare
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Comparable Case Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="text-sm flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600 flex-shrink-0">✓</span>
              <span>
                <strong>Strong precedent support:</strong> All comparable cases resulted in favorable
                outcomes with settlements averaging {formatCurrency(statistics.averageSettlement)}
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>
                <strong>Injury similarity:</strong> Cases involve comparable injury types (TBI, spinal injuries)
                with similar severity levels and permanent impairment
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>
                <strong>Jurisdiction consistency:</strong> All cases within same or similar jurisdictions
                with consistent application of damages principles
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-yellow-600 flex-shrink-0">!</span>
              <span>
                <strong>Settlement range:</strong> Based on comparable outcomes, estimated settlement
                should fall within {formatCurrency(statistics.range.low)} to {formatCurrency(statistics.range.high)}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
