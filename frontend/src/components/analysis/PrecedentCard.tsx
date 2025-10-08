/**
 * Precedent Card Component
 *
 * Displays legal case precedent information with:
 * - Case name and citation
 * - Jurisdiction and court
 * - Relevance score
 * - Case outcome
 * - Summary and key holdings
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Scale,
  ExternalLink,
  BookmarkPlus,
  Share2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface Precedent {
  id: number;
  caseName: string;
  citation: string;
  jurisdiction: string;
  relevanceScore: number;
  outcome: string;
  summary: string;
  year?: number;
  court?: string;
  keyHoldings?: string[];
  url?: string;
}

interface PrecedentCardProps {
  precedent: Precedent;
  showActions?: boolean;
  onSave?: (precedent: Precedent) => void;
  onShare?: (precedent: Precedent) => void;
}

export default function PrecedentCard({
  precedent,
  showActions = true,
  onSave,
  onShare,
}: PrecedentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOutcomeColor = (outcome: string): string => {
    const lower = outcome.toLowerCase();
    if (lower.includes('plaintiff') || lower.includes('victory') || lower.includes('win')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (lower.includes('defendant')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (lower.includes('settlement')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (lower.includes('dismissed')) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRelevanceLabel = (score: number): string => {
    if (score >= 0.9) return 'Highly Relevant';
    if (score >= 0.7) return 'Very Relevant';
    if (score >= 0.5) return 'Relevant';
    if (score >= 0.3) return 'Somewhat Relevant';
    return 'Limited Relevance';
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Scale className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{precedent.caseName}</CardTitle>
              <CardDescription className="mt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{precedent.citation}</span>
                  {precedent.year && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>{precedent.year}</span>
                    </>
                  )}
                </div>
              </CardDescription>
            </div>
          </div>
          <Badge className={getOutcomeColor(precedent.outcome)}>
            {precedent.outcome}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Jurisdiction */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Jurisdiction</span>
          <span className="text-sm font-medium">{precedent.jurisdiction}</span>
        </div>

        {/* Relevance Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Relevance</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${getRelevanceColor(precedent.relevanceScore)}`}>
                {getRelevanceLabel(precedent.relevanceScore)}
              </span>
              <span className="text-sm text-muted-foreground">
                {(precedent.relevanceScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={precedent.relevanceScore * 100} className="h-2" />
        </div>

        {/* Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Case Summary</span>
            {precedent.keyHoldings && precedent.keyHoldings.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    More
                  </>
                )}
              </Button>
            )}
          </div>
          <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-3'}`}>
            {precedent.summary}
          </p>
        </div>

        {/* Key Holdings (Expanded) */}
        {isExpanded && precedent.keyHoldings && precedent.keyHoldings.length > 0 && (
          <div className="pt-2 border-t">
            <span className="text-sm font-semibold block mb-2">Key Holdings</span>
            <ul className="space-y-2">
              {precedent.keyHoldings.map((holding, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <span className="text-muted-foreground">{holding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {precedent.url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(precedent.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Case
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave?.(precedent)}
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare?.(precedent)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Applicability Badge */}
        {precedent.relevanceScore >= 0.8 && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
            <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-xs text-green-800">
              This case is highly applicable to your document
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
