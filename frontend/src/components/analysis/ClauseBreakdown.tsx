/**
 * Clause Breakdown Component
 *
 * Displays detailed information about a single contract clause
 * with risk analysis, recommendations, and precedent references
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { useState } from 'react';

interface Clause {
  id: number;
  clauseType: string;
  content: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  pageNumber: number;
  recommendations: string[];
}

interface ClauseBreakdownProps {
  clause: Clause;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ClauseBreakdown({
  clause,
  isSelected = false,
  onClick,
}: ClauseBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getTextRiskColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskSeverity = (score: number): string => {
    if (score >= 8) return 'Critical Risk';
    if (score >= 6) return 'High Risk';
    if (score >= 4) return 'Medium Risk';
    if (score >= 2) return 'Low Risk';
    return 'Minimal Risk';
  };

  return (
    <Card
      className={`
        cursor-pointer transition-all border-l-4
        ${getRiskColor(clause.riskLevel)}
        ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}
      `}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {getRiskIcon(clause.riskLevel)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{clause.clauseType}</CardTitle>
              <CardDescription className="mt-1">
                Page {clause.pageNumber} • {getRiskSeverity(clause.riskScore)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={
                clause.riskLevel === 'critical' || clause.riskLevel === 'high'
                  ? 'destructive'
                  : 'default'
              }
            >
              {clause.riskLevel.toUpperCase()}
            </Badge>
            <div className={`text-xl font-bold ${getTextRiskColor(clause.riskLevel)}`}>
              {clause.riskScore.toFixed(1)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Clause Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Clause Text
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
          <div
            className={`
              text-sm bg-white p-3 rounded border
              ${isExpanded ? '' : 'line-clamp-3'}
            `}
          >
            {clause.content}
          </div>
        </div>

        {/* Recommendations */}
        {clause.recommendations && clause.recommendations.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">
                  Recommendations
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {clause.recommendations.length}
                </Badge>
              </div>
              <ul className="space-y-2">
                {clause.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="text-sm flex items-start gap-2 p-2 rounded bg-white border"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Risk Factors */}
        <Separator />
        <div>
          <span className="text-sm font-semibold block mb-2">Risk Factors</span>
          <div className="space-y-2">
            {clause.riskScore >= 7 && (
              <div className="text-sm p-2 rounded bg-red-100 border border-red-200 text-red-800">
                ⚠️ Unfavorable terms that may result in significant liability
              </div>
            )}
            {clause.clauseType.toLowerCase().includes('indemnification') && (
              <div className="text-sm p-2 rounded bg-orange-100 border border-orange-200 text-orange-800">
                ⚠️ Broad indemnification scope without clear limitations
              </div>
            )}
            {clause.clauseType.toLowerCase().includes('liability') && (
              <div className="text-sm p-2 rounded bg-yellow-100 border border-yellow-200 text-yellow-800">
                ℹ️ Review liability caps and exclusions carefully
              </div>
            )}
            {clause.riskScore < 4 && (
              <div className="text-sm p-2 rounded bg-green-100 border border-green-200 text-green-800">
                ✓ Standard commercial terms with reasonable protections
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              console.log('View related precedents for clause:', clause.id);
            }}
          >
            View Precedents
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Request revision for clause:', clause.id);
            }}
          >
            Request Revision
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
