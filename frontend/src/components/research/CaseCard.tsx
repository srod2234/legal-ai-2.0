/**
 * Case Card Component
 *
 * Displays case search result with:
 * - Case name and citation
 * - Court and jurisdiction
 * - Decision date
 * - Relevance score
 * - Outcome
 * - Summary
 * - Actions (save, view, cite)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Scale,
  ExternalLink,
  BookmarkPlus,
  Bookmark,
  Copy,
  Share2,
  Calendar,
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
  url?: string;
}

interface CaseCardProps {
  caseData: CaseResult;
  isSaved?: boolean;
  onSave?: () => void;
  showRelevanceScore?: boolean;
}

export default function CaseCard({
  caseData,
  isSaved = false,
  onSave,
  showRelevanceScore = true,
}: CaseCardProps) {
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

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(caseData.citation);
    // TODO: Show toast notification
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Sharing case:', caseData.id);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
                  <button
                    onClick={handleCopyCitation}
                    className="hover:text-foreground transition-colors"
                    title="Copy citation"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
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
                    {formatDate(caseData.decisionDate)}
                  </span>
                </div>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge className={getOutcomeColor(caseData.outcome)}>
              {caseData.outcome}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Relevance Score */}
        {showRelevanceScore && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Relevance</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${getRelevanceColor(caseData.relevanceScore)}`}>
                  {getRelevanceLabel(caseData.relevanceScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(caseData.relevanceScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <Progress value={caseData.relevanceScore * 100} className="h-1.5" />
          </div>
        )}

        {/* Summary */}
        <div>
          <span className="text-sm font-semibold block mb-2">Case Summary</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {caseData.summary}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {caseData.url && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(caseData.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Case
            </Button>
          )}
          <Button
            variant={isSaved ? 'default' : 'outline'}
            size="sm"
            onClick={onSave}
            title={isSaved ? 'Remove from saved' : 'Save case'}
          >
            {isSaved ? (
              <Bookmark className="h-4 w-4 fill-current" />
            ) : (
              <BookmarkPlus className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            title="Share case"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* High Relevance Indicator */}
        {caseData.relevanceScore >= 0.85 && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            <Scale className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">
              Highly applicable precedent for your research
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
