/**
 * Medical Assessment Component
 *
 * Displays medical records analysis for personal injury cases:
 * - Injury severity scoring
 * - Treatment summary
 * - Ongoing care requirements
 * - Permanent impairment assessment
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';

interface MedicalAssessmentProps {
  caseId: number;
}

export default function MedicalAssessment({ caseId }: MedicalAssessmentProps) {
  // TODO: Replace with actual API call
  const medicalData = {
    severityScore: 7.5,
    severityLevel: 'Severe',
    injuryTypes: [
      {
        type: 'Traumatic Brain Injury',
        icdCode: 'S06.9',
        severity: 'Moderate',
        location: 'Head',
      },
      {
        type: 'Spinal Injury',
        icdCode: 'S13.4',
        severity: 'Moderate',
        location: 'Cervical Spine',
      },
      {
        type: 'Soft Tissue Injury',
        icdCode: 'S43.4',
        severity: 'Minor',
        location: 'Shoulder',
      },
    ],
    treatment: {
      emergencyTreatment: true,
      hospitalizationDays: 3,
      surgeries: 1,
      physicalTherapySessions: 24,
      treatmentDurationMonths: 8,
      outcome: 'Improving with residual symptoms',
    },
    ongoingCare: {
      required: true,
      estimatedDurationMonths: 12,
      careTypes: [
        'Physical therapy (ongoing)',
        'Pain management',
        'Follow-up imaging',
      ],
      estimatedAnnualCost: 18500,
    },
    permanentImpairment: {
      hasImpairment: true,
      impairmentPercentage: 15,
      functionalLimitations: [
        'Limited range of motion in neck',
        'Chronic pain episodes',
        'Inability to lift heavy objects',
      ],
      impactOnWork: 'Reduced capacity for physical labor',
    },
    timeline: [
      { date: '2024-01-15', event: 'Date of Incident', details: 'Motor vehicle accident' },
      { date: '2024-01-15', event: 'Emergency Room Visit', details: 'Initial evaluation' },
      { date: '2024-01-16', event: 'Hospital Admission', details: '3-day hospitalization' },
      { date: '2024-01-29', event: 'First Follow-up', details: 'Post-discharge evaluation' },
      { date: '2024-02-14', event: 'Physical Therapy Begins', details: '24-session plan' },
    ],
    costs: {
      emergencyRoom: 2500,
      hospitalization: 18000,
      surgery: 35000,
      physicalTherapy: 4800,
      medications: 1200,
      diagnosticImaging: 3200,
      followUpVisits: 1800,
      totalPastMedical: 66500,
      estimatedFutureMedical: 22000,
      totalMedicalCosts: 88500,
    },
  };

  const getSeverityColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'catastrophic':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'severe':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
      {/* Injury Severity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Injury Severity Assessment
          </CardTitle>
          <CardDescription>
            Overall injury severity and impact analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Severity Score
                </p>
                <p className="text-4xl font-bold text-primary">
                  {medicalData.severityScore}/10
                </p>
              </div>
              <Badge className={getSeverityColor(medicalData.severityLevel)} >
                {medicalData.severityLevel}
              </Badge>
            </div>
            <Progress value={medicalData.severityScore * 10} className="h-3" />
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Identified Injuries</h4>
            <div className="space-y-3">
              {medicalData.injuryTypes.map((injury, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{injury.type}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {injury.location} • ICD: {injury.icdCode}
                      </p>
                    </div>
                    <Badge className={getSeverityColor(injury.severity)}>
                      {injury.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Summary</CardTitle>
          <CardDescription>
            Medical treatment received and outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Hospitalization</p>
              <p className="text-2xl font-bold">{medicalData.treatment.hospitalizationDays} days</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Surgeries</p>
              <p className="text-2xl font-bold">{medicalData.treatment.surgeries}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">PT Sessions</p>
              <p className="text-2xl font-bold">{medicalData.treatment.physicalTherapySessions}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Treatment Duration</p>
              <p className="text-2xl font-bold">{medicalData.treatment.treatmentDurationMonths} mo</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">Treatment Outcome</p>
            <p className="text-sm text-blue-800">{medicalData.treatment.outcome}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ongoing Care */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Ongoing Care Requirements
          </CardTitle>
          <CardDescription>
            Future medical care needs and estimated costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicalData.ongoingCare.required ? (
            <>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-yellow-900">Ongoing Care Required</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      Estimated duration: {medicalData.ongoingCare.estimatedDurationMonths} months
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {formatCurrency(medicalData.ongoingCare.estimatedAnnualCost)}/year
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {medicalData.ongoingCare.careTypes.map((care, index) => (
                    <li key={index} className="text-sm text-yellow-800 flex items-center gap-2">
                      <span>•</span>
                      <span>{care}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No ongoing care required</p>
          )}
        </CardContent>
      </Card>

      {/* Permanent Impairment */}
      <Card>
        <CardHeader>
          <CardTitle>Permanent Impairment Assessment</CardTitle>
          <CardDescription>
            Long-term functional limitations and impact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicalData.permanentImpairment.hasImpairment ? (
            <>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-red-900">Permanent Impairment Identified</p>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {medicalData.permanentImpairment.impairmentPercentage}% Impairment
                  </Badge>
                </div>
                <p className="text-sm text-red-800">{medicalData.permanentImpairment.impactOnWork}</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Functional Limitations</p>
                <ul className="space-y-2">
                  {medicalData.permanentImpairment.functionalLimitations.map((limitation, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No permanent impairment identified</p>
          )}
        </CardContent>
      </Card>

      {/* Medical Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Medical Timeline
          </CardTitle>
          <CardDescription>
            Key dates and medical events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {medicalData.timeline.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {index < medicalData.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-border min-h-[40px]" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">{item.event}</p>
                  <p className="text-sm text-muted-foreground">{item.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Medical Costs Breakdown
          </CardTitle>
          <CardDescription>
            Past and estimated future medical expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(medicalData.costs)
              .filter(([key]) => !key.includes('total') && !key.includes('Total'))
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className="font-semibold">{formatCurrency(value as number)}</span>
                </div>
              ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-semibold text-blue-900">Total Past Medical</span>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrency(medicalData.costs.totalPastMedical)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="font-semibold text-yellow-900">Estimated Future Medical</span>
              <span className="text-lg font-bold text-yellow-900">
                {formatCurrency(medicalData.costs.estimatedFutureMedical)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
              <span className="font-bold text-primary">Total Medical Costs</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(medicalData.costs.totalMedicalCosts)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
