/**
 * Timeline Estimator Component
 *
 * Displays case timeline predictions with:
 * - Phase-by-phase breakdown
 * - Milestone predictions
 * - Duration estimates (optimistic/expected/pessimistic)
 * - Timeline visualization
 * - Jurisdiction-based adjustments
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';

interface TimelineEstimatorProps {
  documentId: number;
}

export default function TimelineEstimator({ documentId }: TimelineEstimatorProps) {
  // TODO: Replace with actual API call
  const timelineData = {
    totalMonths: {
      optimistic: 10,
      expected: 14,
      pessimistic: 20,
    },
    currentPhase: 'Discovery',
    phases: [
      {
        name: 'Filing & Initial Pleadings',
        status: 'completed',
        optimistic: 1,
        expected: 2,
        pessimistic: 3,
        startDate: '2024-01-15',
        endDate: '2024-03-01',
        milestones: [
          { name: 'Complaint Filed', completed: true },
          { name: 'Answer Filed', completed: true },
          { name: 'Initial Conference', completed: true },
        ],
      },
      {
        name: 'Discovery',
        status: 'in_progress',
        optimistic: 4,
        expected: 6,
        pessimistic: 8,
        startDate: '2024-03-01',
        estimatedEndDate: '2024-09-01',
        milestones: [
          { name: 'Document Requests', completed: true },
          { name: 'Depositions', completed: false },
          { name: 'Expert Discovery', completed: false },
        ],
      },
      {
        name: 'Pre-Trial Motions',
        status: 'pending',
        optimistic: 2,
        expected: 3,
        pessimistic: 5,
        estimatedStartDate: '2024-09-01',
        estimatedEndDate: '2024-12-01',
        milestones: [
          { name: 'Summary Judgment Motion', completed: false },
          { name: 'Motion Hearing', completed: false },
          { name: 'Pre-Trial Conference', completed: false },
        ],
      },
      {
        name: 'Trial',
        status: 'pending',
        optimistic: 1,
        expected: 2,
        pessimistic: 3,
        estimatedStartDate: '2024-12-01',
        estimatedEndDate: '2025-02-01',
        milestones: [
          { name: 'Jury Selection', completed: false },
          { name: 'Trial', completed: false },
          { name: 'Verdict', completed: false },
        ],
      },
      {
        name: 'Post-Trial',
        status: 'pending',
        optimistic: 2,
        expected: 1,
        pessimistic: 1,
        estimatedStartDate: '2025-02-01',
        estimatedEndDate: '2025-03-01',
        milestones: [
          { name: 'Judgment Entry', completed: false },
          { name: 'Settlement/Resolution', completed: false },
        ],
      },
    ],
    acceleratingFactors: [
      'Straightforward liability issues',
      'Cooperative opposing counsel',
      'Limited expert testimony needed',
    ],
    delayingFactors: [
      'Court calendar congestion',
      'Complex discovery issues',
      'Potential appeals',
    ],
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const totalExpectedMonths = timelineData.phases.reduce(
    (sum, phase) => sum + phase.expected,
    0
  );

  const completedMonths = timelineData.phases
    .filter(phase => phase.status === 'completed')
    .reduce((sum, phase) => sum + phase.expected, 0);

  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Case Timeline Estimate
          </CardTitle>
          <CardDescription>
            Predicted duration from filing to resolution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Duration Estimates */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs font-medium text-green-800 mb-1">
                Optimistic
              </p>
              <p className="text-3xl font-bold text-green-700">
                {timelineData.totalMonths.optimistic} mo
              </p>
              <p className="text-xs text-green-600 mt-1">Best case scenario</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
              <p className="text-xs font-medium text-blue-800 mb-1">
                Expected
              </p>
              <p className="text-3xl font-bold text-blue-700">
                {timelineData.totalMonths.expected} mo
              </p>
              <p className="text-xs text-blue-600 mt-1">Most likely duration</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs font-medium text-yellow-800 mb-1">
                Pessimistic
              </p>
              <p className="text-3xl font-bold text-yellow-700">
                {timelineData.totalMonths.pessimistic} mo
              </p>
              <p className="text-xs text-yellow-600 mt-1">If complications arise</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedMonths} of {totalExpectedMonths} months completed
              </span>
            </div>
            <Progress
              value={(completedMonths / totalExpectedMonths) * 100}
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Phase Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phase-by-Phase Timeline</CardTitle>
          <CardDescription>
            Detailed breakdown of case phases and milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timelineData.phases.map((phase, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                phase.status === 'in_progress'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Phase Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(phase.status)}
                  <div>
                    <h3 className="font-semibold">{phase.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(phase.status)}>
                        {phase.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {phase.expected} months expected
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {phase.startDate && (
                    <p>Started: {formatDate(phase.startDate)}</p>
                  )}
                  {phase.endDate && (
                    <p>Ended: {formatDate(phase.endDate)}</p>
                  )}
                  {phase.estimatedStartDate && !phase.startDate && (
                    <p>Est. Start: {formatDate(phase.estimatedStartDate)}</p>
                  )}
                  {phase.estimatedEndDate && !phase.endDate && (
                    <p>Est. End: {formatDate(phase.estimatedEndDate)}</p>
                  )}
                </div>
              </div>

              {/* Duration Range */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Duration range</span>
                  <span className="text-muted-foreground">
                    {phase.optimistic}-{phase.pessimistic} months
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-yellow-400"
                    style={{
                      width: `${(phase.expected / phase.pessimistic) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Key Milestones
                </p>
                {phase.milestones.map((milestone, mIndex) => (
                  <div
                    key={mIndex}
                    className="flex items-center gap-2 text-sm"
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span
                      className={
                        milestone.completed
                          ? 'text-muted-foreground line-through'
                          : ''
                      }
                    >
                      {milestone.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Timeline Factors */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Accelerating Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Accelerating Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {timelineData.acceleratingFactors.map((factor, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Delaying Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Potential Delays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {timelineData.delayingFactors.map((factor, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-yellow-600 flex-shrink-0 mt-0.5">!</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="text-sm flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Currently in <strong>{timelineData.currentPhase}</strong> phase -
                estimated completion in <strong>6 months</strong>
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                Case is <strong>on track</strong> with {completedMonths} months completed
                out of {totalExpectedMonths} months expected
              </span>
            </li>
            <li className="text-sm flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Settlement window</strong> - Consider settlement negotiations
                before trial phase to save 2-3 months
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
