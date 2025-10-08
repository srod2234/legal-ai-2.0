/**
 * Outcome Probability Component
 *
 * Displays litigation outcome predictions with:
 * - Probability breakdown (plaintiff/defendant/settlement/dismissal)
 * - Visual probability chart
 * - Confidence scoring
 * - Strength indicators
 * - Historical comparison
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Scale,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Handshake,
} from 'lucide-react';

interface OutcomeProbabilityProps {
  documentId: number;
}

export default function OutcomeProbability({ documentId }: OutcomeProbabilityProps) {
  // TODO: Replace with actual API call
  const outcomeData = {
    plaintiffVictory: 68,
    defendantVictory: 12,
    settlement: 18,
    dismissal: 2,
    confidence: 85,
    caseStrength: 7.5,
    strengths: [
      'Clear evidence of negligence',
      'Strong witness testimony',
      'Favorable jurisdiction precedents',
      'Well-documented damages',
    ],
    weaknesses: [
      'Potential contributory negligence claim',
      'Some evidence gaps in timeline',
    ],
    keyFactors: [
      {
        factor: 'Evidence Quality',
        score: 8.5,
        impact: 'Strong',
      },
      {
        factor: 'Legal Precedent',
        score: 7.8,
        impact: 'Strong',
      },
      {
        factor: 'Witness Credibility',
        score: 7.2,
        impact: 'Medium',
      },
      {
        factor: 'Damages Documentation',
        score: 8.0,
        impact: 'Strong',
      },
      {
        factor: 'Procedural Position',
        score: 6.5,
        impact: 'Medium',
      },
    ],
  };

  const outcomes = [
    {
      name: 'Plaintiff Victory',
      probability: outcomeData.plaintiffVictory,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      description: 'Favorable verdict or judgment',
    },
    {
      name: 'Settlement',
      probability: outcomeData.settlement,
      icon: Handshake,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      description: 'Parties reach agreement',
    },
    {
      name: 'Defendant Victory',
      probability: outcomeData.defendantVictory,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      description: 'Case decided against plaintiff',
    },
    {
      name: 'Dismissal',
      probability: outcomeData.dismissal,
      icon: AlertCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: 'Case dismissed before trial',
    },
  ];

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 7) return 'text-blue-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'strong':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Strong</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'weak':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Weak</Badge>;
      default:
        return <Badge variant="secondary">{impact}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Outcome Probabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Outcome Probabilities
          </CardTitle>
          <CardDescription>
            Predicted likelihood of different case outcomes based on analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence Score */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Prediction Confidence
              </p>
              <p className="text-2xl font-bold text-primary">
                {outcomeData.confidence}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Overall Case Strength
              </p>
              <p className="text-2xl font-bold text-primary">
                {outcomeData.caseStrength}/10
              </p>
            </div>
          </div>

          {/* Outcome Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {outcomes.map((outcome) => {
              const Icon = outcome.icon;
              return (
                <div
                  key={outcome.name}
                  className={`p-4 rounded-lg border-2 ${outcome.borderColor} ${outcome.bgColor}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${outcome.color}`} />
                      <span className="font-semibold">{outcome.name}</span>
                    </div>
                    <span className={`text-2xl font-bold ${outcome.color}`}>
                      {outcome.probability}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {outcome.description}
                  </p>
                  <Progress
                    value={outcome.probability}
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>

          {/* Visual Breakdown */}
          <div>
            <p className="text-sm font-medium mb-3">Probability Distribution</p>
            <div className="h-12 flex rounded-lg overflow-hidden">
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${outcomeData.plaintiffVictory}%` }}
              >
                {outcomeData.plaintiffVictory}%
              </div>
              <div
                className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${outcomeData.settlement}%` }}
              >
                {outcomeData.settlement}%
              </div>
              <div
                className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${outcomeData.defendantVictory}%` }}
              >
                {outcomeData.defendantVictory}%
              </div>
              <div
                className="bg-gray-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${outcomeData.dismissal}%` }}
              >
                {outcomeData.dismissal}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Strength Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Case Strength Analysis</CardTitle>
          <CardDescription>
            Key factors contributing to outcome predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {outcomeData.keyFactors.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.factor}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getImpactBadge(item.impact)}
                  <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                    {item.score}/10
                  </span>
                </div>
              </div>
              <Progress value={item.score * 10} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Case Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {outcomeData.strengths.map((strength, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Potential Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {outcomeData.weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-yellow-600 flex-shrink-0 mt-0.5">!</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="text-sm flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600 flex-shrink-0 font-bold">1.</span>
              <span>
                <strong>Leverage strong evidence position</strong> - With {outcomeData.plaintiffVictory}%
                plaintiff victory probability, consider aggressive negotiation from position of strength
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-600 flex-shrink-0 font-bold">2.</span>
              <span>
                <strong>Address timeline gaps</strong> - Strengthen the case by filling evidence gaps
                to reduce defendant counterarguments
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-yellow-600 flex-shrink-0 font-bold">3.</span>
              <span>
                <strong>Settlement timing</strong> - With {outcomeData.settlement}% settlement probability,
                consider settlement discussions after discovery phase
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
