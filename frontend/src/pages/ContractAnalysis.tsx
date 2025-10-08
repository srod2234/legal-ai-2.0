/**
 * Contract Analysis Page
 *
 * Split-screen interface for contract review with:
 * - Document viewer with highlighting
 * - Risk assessment panel
 * - Clause-by-clause breakdown
 * - Precedent case references
 * - Recommendations
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  Share2,
  AlertTriangle,
  FileText,
  Scale,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import DocumentViewer from '@/components/analysis/DocumentViewer';
import RiskPanel from '@/components/analysis/RiskPanel';
import ClauseBreakdown from '@/components/analysis/ClauseBreakdown';
import PrecedentCard from '@/components/analysis/PrecedentCard';
import { toast } from 'sonner';
import { useDocuments } from '../hooks/useDocuments';
import {
  useRiskAssessment,
  useDocumentClauses,
  useAnalyzeDocumentRisk,
  useReanalyzeDocument,
} from '../hooks/useRiskAssessment';
import { useDocumentPrecedents } from '../hooks/useCaseResearch';
import { apiService } from '../services/api';

interface Document {
  id: number;
  filename: string;
  fileUrl: string;
  uploadedAt: string;
  status: string;
}

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

interface Precedent {
  id: number;
  caseName: string;
  citation: string;
  jurisdiction: string;
  relevanceScore: number;
  outcome: string;
  summary: string;
}

export default function ContractAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documentId = id ? parseInt(id) : 0;

  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);

  // Fetch data using React Query hooks
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { data: riskAssessmentData, isLoading: assessmentLoading, error: assessmentError } =
    useRiskAssessment(documentId, !!documentId);
  const { data: clausesData, isLoading: clausesLoading } =
    useDocumentClauses(documentId, undefined, !!documentId);
  const { data: precedentsData, isLoading: precedentsLoading } =
    useDocumentPrecedents(documentId, !!documentId);

  // Mutations
  const analyzeDocument = useAnalyzeDocumentRisk();
  const reanalyzeDocument = useReanalyzeDocument();

  // Find the document - try from list first, then fetch if not found
  let document = documents?.find(d => d.id === documentId);

  // If document not in list, fetch it directly
  const [fetchedDocument, setFetchedDocument] = useState<any>(null);
  const [fetchingDocument, setFetchingDocument] = useState(false);

  useEffect(() => {
    if (documentId && !document && !documentsLoading && !fetchingDocument) {
      setFetchingDocument(true);
      apiService.getDocument(documentId)
        .then(doc => {
          setFetchedDocument(doc);
          setFetchingDocument(false);
        })
        .catch(err => {
          console.error('Failed to fetch document:', err);
          setFetchingDocument(false);
        });
    }
  }, [documentId, document, documentsLoading, fetchingDocument]);

  // Use fetched document if available
  if (!document && fetchedDocument) {
    document = fetchedDocument;
  }

  // Transform data for components
  const riskAssessment: RiskAssessment | null = riskAssessmentData ? {
    id: riskAssessmentData.id,
    overallRiskScore: riskAssessmentData.overall_risk_score || 0,
    riskLevel: (riskAssessmentData.overall_risk_level?.toLowerCase() || 'medium') as any,
    totalClauses: riskAssessmentData.total_clauses_analyzed || 0,
    criticalClauses: riskAssessmentData.critical_clause_count || 0,
    highRiskClauses: riskAssessmentData.high_risk_clause_count || 0,
    analyzedAt: riskAssessmentData.analysis_date || new Date().toISOString(),
  } : null;

  const clauses: Clause[] = clausesData?.clauses?.map((c: any) => ({
    id: c.id,
    clauseType: c.clause_type,
    content: c.clause_text,
    riskScore: c.risk_score || 0,
    riskLevel: (c.risk_level?.toLowerCase() || 'low') as any,
    pageNumber: c.page_number || 1,
    recommendations: c.risk_factors || [],
  })) || [];

  const precedents: Precedent[] = precedentsData?.precedents?.map((p: any) => ({
    id: p.id,
    caseName: p.case_name,
    citation: p.citation,
    jurisdiction: p.jurisdiction,
    relevanceScore: p.relevance_score || 0,
    outcome: p.outcome || 'Unknown',
    summary: p.summary || '',
  })) || [];

  const loading = documentsLoading || assessmentLoading || fetchingDocument;

  const handleAnalyze = async () => {
    if (!documentId) return;

    try {
      toast.loading('Analyzing document...', { id: 'analyze' });
      await analyzeDocument.mutateAsync({
        documentId,
        options: { include_precedents: true, force_reanalysis: false }
      });
      toast.success('Document analyzed successfully', { id: 'analyze' });
    } catch (error: any) {
      console.error('Failed to analyze document:', error);
      toast.error(error.message || 'Failed to analyze document', { id: 'analyze' });
    }
  };

  const handleReanalyze = async () => {
    if (!documentId) return;

    try {
      toast.loading('Reanalyzing document...', { id: 'reanalyze' });
      await reanalyzeDocument.mutateAsync(documentId);
      toast.success('Document reanalyzed successfully', { id: 'reanalyze' });
    } catch (error: any) {
      console.error('Failed to reanalyze document:', error);
      toast.error(error.message || 'Failed to reanalyze document', { id: 'reanalyze' });
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analysis report...');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Sharing analysis...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading contract analysis...</p>
        </div>
      </div>
    );
  }

  if (!document && !documentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Document Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The requested document could not be found.
          </p>
          <Button className="mt-4" onClick={() => navigate('/documents')}>
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  // Show "Analyze" button if no risk assessment exists
  const showAnalyzeButton = !assessmentLoading && assessmentError && document;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/documents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {document?.original_filename || document?.filename}
              </h1>
              <p className="text-sm text-muted-foreground">
                {riskAssessment
                  ? `Analyzed ${new Date(riskAssessment.analyzedAt).toLocaleString()}`
                  : 'Not yet analyzed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {riskAssessment && (
              <Badge
                variant={
                  riskAssessment.riskLevel === 'critical' || riskAssessment.riskLevel === 'high'
                    ? 'destructive'
                    : 'default'
                }
              >
                Risk: {riskAssessment.riskLevel.toUpperCase()}
              </Badge>
            )}
            {showAnalyzeButton && (
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={analyzeDocument.isPending}
              >
                <Sparkles className={`h-4 w-4 mr-2 ${analyzeDocument.isPending ? 'animate-pulse' : ''}`} />
                Analyze Document
              </Button>
            )}
            {riskAssessment && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReanalyze}
                disabled={reanalyzeDocument.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${reanalyzeDocument.isPending ? 'animate-spin' : ''}`} />
                Reanalyze
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Document Viewer */}
        <div className="w-1/2 border-r overflow-y-auto">
          <DocumentViewer
            documentUrl={`/api/documents/${documentId}/download`}
            clauses={clauses}
            selectedClause={selectedClause}
            onClauseSelect={setSelectedClause}
          />
        </div>

        {/* Right Side - Analysis Panels */}
        <div className="w-1/2 overflow-y-auto">
          <Tabs defaultValue="overview" className="h-full">
            <div className="border-b px-4 bg-card sticky top-0 z-10">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="clauses" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Clauses ({clauses.length})
                </TabsTrigger>
                <TabsTrigger value="precedents" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Precedents ({precedents.length})
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                {assessmentLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading risk assessment...</p>
                  </div>
                ) : riskAssessment ? (
                  <RiskPanel
                    assessment={riskAssessment}
                    clauses={clauses}
                    onClauseClick={setSelectedClause}
                  />
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Risk Assessment</h3>
                    <p className="text-muted-foreground mb-4">
                      This document hasn't been analyzed yet.
                    </p>
                    <Button onClick={handleAnalyze} disabled={analyzeDocument.isPending}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Document
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clauses" className="mt-0 space-y-4">
                {clausesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading clauses...</p>
                  </div>
                ) : clauses.length > 0 ? (
                  clauses.map((clause) => (
                    <ClauseBreakdown
                      key={clause.id}
                      clause={clause}
                      isSelected={selectedClause?.id === clause.id}
                      onClick={() => setSelectedClause(clause)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No clauses extracted yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="precedents" className="mt-0 space-y-4">
                {precedentsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading precedents...</p>
                  </div>
                ) : precedents.length > 0 ? (
                  precedents.map((precedent) => (
                    <PrecedentCard
                      key={precedent.id}
                      precedent={precedent}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No precedent cases found yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <div className="space-y-4">
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Predictive Analytics
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Advanced analytics for this contract
                    </p>
                    <Button onClick={() => navigate(`/analytics/document/${id}`)}>
                      View Full Analytics
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
