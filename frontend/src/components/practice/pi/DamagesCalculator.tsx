/**
 * Damages Calculator Component
 *
 * Calculates comprehensive damages for personal injury cases:
 * - Economic damages (medical, lost wages, etc.)
 * - Non-economic damages (pain, suffering, etc.)
 * - Total damages summary
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface DamagesCalculatorProps {
  caseId: number;
}

export default function DamagesCalculator({ caseId }: DamagesCalculatorProps) {
  // TODO: Replace with actual API call
  const damagesData = {
    economic: {
      pastMedical: 66500,
      futureMedical: 22000,
      pastLostWages: 10685,
      futureLostEarnings: 243750,
      propertyDamage: 8500,
      outOfPocket: 2200,
      total: 353635,
    },
    nonEconomic: {
      painAndSuffering: 221250,
      lossOfEnjoyment: 75000,
      emotionalDistress: 35000,
      multiplier: 2.5,
      total: 331250,
    },
    totalDamages: 684885,
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Total Damages Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Damages Calculation
          </CardTitle>
          <CardDescription>
            Comprehensive damages assessment for personal injury claim
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-8 bg-primary/5 rounded-lg border-2 border-primary/20">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Total Damages
            </p>
            <p className="text-5xl font-bold text-primary mb-4">
              {formatCurrency(damagesData.totalDamages)}
            </p>
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Economic</p>
                <p className="text-lg font-semibold">{formatCurrency(damagesData.economic.total)}</p>
              </div>
              <div className="text-2xl text-muted-foreground">+</div>
              <div>
                <p className="text-xs text-muted-foreground">Non-Economic</p>
                <p className="text-lg font-semibold">{formatCurrency(damagesData.nonEconomic.total)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-1">Economic Damages</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(damagesData.economic.total)}
              </p>
              <p className="text-xs text-blue-800 mt-1">Quantifiable financial losses</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-purple-900 mb-1">Non-Economic Damages</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(damagesData.nonEconomic.total)}
              </p>
              <p className="text-xs text-purple-800 mt-1">Pain, suffering, and loss</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economic Damages Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Economic Damages</CardTitle>
          <CardDescription>
            Quantifiable financial losses and expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Past Medical Expenses</p>
                <p className="text-xs text-muted-foreground">Treatment costs incurred to date</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.economic.pastMedical)}</p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Future Medical Expenses</p>
                <p className="text-xs text-muted-foreground">Estimated ongoing treatment costs</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.economic.futureMedical)}</p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Past Lost Wages</p>
                <p className="text-xs text-muted-foreground">Income lost due to injury</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.economic.pastLostWages)}</p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
              <div>
                <p className="font-medium">Future Lost Earning Capacity</p>
                <p className="text-xs text-muted-foreground">Reduced earnings due to impairment</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.economic.futureLostEarnings)}</p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Property Damage</p>
                <p className="text-xs text-muted-foreground">Vehicle and personal property</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.economic.propertyDamage)}</p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Out-of-Pocket Expenses</p>
                <p className="text-xs text-muted-foreground">Transportation, equipment, etc.</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.economic.outOfPocket)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200 mt-4">
            <p className="font-bold text-blue-900">Total Economic Damages</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(damagesData.economic.total)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Non-Economic Damages Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Non-Economic Damages</CardTitle>
          <CardDescription>
            Pain, suffering, and intangible losses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-purple-900">Calculation Method</p>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                {damagesData.nonEconomic.multiplier}x Multiplier
              </Badge>
            </div>
            <p className="text-xs text-purple-800">
              Applied {damagesData.nonEconomic.multiplier}x multiplier to medical expenses based on injury severity
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Pain and Suffering</p>
                <p className="text-xs text-muted-foreground">Physical pain and discomfort</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.nonEconomic.painAndSuffering)}</p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Loss of Enjoyment of Life</p>
                <p className="text-xs text-muted-foreground">Reduced quality of life</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.nonEconomic.lossOfEnjoyment)}</p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Emotional Distress</p>
                <p className="text-xs text-muted-foreground">Psychological impact</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(damagesData.nonEconomic.emotionalDistress)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200 mt-4">
            <p className="font-bold text-purple-900">Total Non-Economic Damages</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(damagesData.nonEconomic.total)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Calculation Assumptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>Medical costs based on actual bills and estimates from treating physicians</span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>Future medical costs assume standard treatment protocols and 3% inflation</span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>Lost wages calculated using pre-injury earnings and verified employment records</span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>Future lost earning capacity assumes retirement at age 67 with 15% impairment rating</span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>Pain and suffering multiplier ({damagesData.nonEconomic.multiplier}x) based on injury severity and case law</span>
            </li>
            <li className="text-sm flex items-start gap-2">
              <span className="text-blue-600 flex-shrink-0">•</span>
              <span>Punitive damages not included (reserved for separate analysis)</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Settlement Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Settlement Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-900 mb-1">Strengths</p>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Clear liability documentation</li>
                <li>• Comprehensive medical evidence</li>
                <li>• Permanent impairment supports high damages</li>
                <li>• Strong future medical needs documentation</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-900 mb-1">Considerations</p>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Settlement negotiations typically 70-85% of calculated damages</li>
                <li>• Jury awards can be unpredictable for non-economic damages</li>
                <li>• Consider litigation costs and timeline in settlement decisions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
