/**
 * Document Viewer Component
 *
 * Displays document with clause highlighting and annotations
 * Supports PDF and text documents with interactive clause selection
 */

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiService } from '@/services/api';
import * as pdfjsLib from 'pdfjs-dist';

interface Clause {
  id: number;
  clauseType: string;
  content: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  pageNumber: number;
  startPosition?: number;
  endPosition?: number;
}

interface DocumentViewerProps {
  documentUrl: string;
  clauses?: Clause[];
  selectedClause?: Clause | null;
  onClauseSelect?: (clause: Clause) => void;
}

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function DocumentViewer({
  documentUrl,
  clauses = [],
  selectedClause,
  onClauseSelect,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1.0);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pages, setPages] = useState<string[]>([]);
  const [isPDF, setIsPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    loadDocument();
  }, [documentUrl]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract document ID from URL
      const urlParts = documentUrl.split('/');
      const documentId = parseInt(urlParts[urlParts.length - 2]);

      if (!documentId || isNaN(documentId)) {
        throw new Error('Invalid document ID');
      }

      // Get documents list to check file type
      const documents = await apiService.getDocuments();
      const doc = documents.find(d => d.id === documentId);

      // Check if it's a PDF
      const isPdf = doc?.content_type === 'application/pdf' || doc?.filename.toLowerCase().endsWith('.pdf');
      setIsPDF(isPdf);

      if (isPdf) {
        // For PDFs, load with pdf.js
        const pdfUrlFull = `http://localhost:8000${documentUrl}`;
        setPdfUrl(pdfUrlFull);

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrlFull);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
        return;
      }

      // For non-PDF documents, fetch text content
      const contentData = await apiService.getDocumentContent(documentId);

      if (contentData && contentData.content) {
        const content = contentData.content;
        setDocumentContent(content);

        // Split content into pages (rough estimation: ~500 words per page)
        const words = content.split(/\s+/);
        const wordsPerPage = 500;
        const pageArray: string[] = [];

        for (let i = 0; i < words.length; i += wordsPerPage) {
          const pageWords = words.slice(i, i + wordsPerPage);
          pageArray.push(pageWords.join(' '));
        }

        setPages(pageArray);
        setTotalPages(Math.max(1, pageArray.length));
        setCurrentPage(1);
      } else {
        setDocumentContent('Document content not available. The document may still be processing.');
        setPages(['Document content not available. The document may still be processing.']);
        setTotalPages(1);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load document:', err);
      setError(err.message || 'Failed to load document. Please try again.');
      setLoading(false);
    }
  };

  // Render PDF page on canvas
  useEffect(() => {
    if (isPDF && pdfDoc && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDoc, zoom, isPDF]);

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const viewport = page.getViewport({ scale: zoom });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering PDF page:', err);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 border-red-500';
      case 'high':
        return 'bg-orange-100 border-orange-500';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500';
      case 'low':
        return 'bg-blue-100 border-blue-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  const highlightClauses = (content: string): JSX.Element[] => {
    if (!clauses || clauses.length === 0) {
      return [<div key="content" className="whitespace-pre-wrap leading-relaxed text-justify">{content}</div>];
    }

    const elements: JSX.Element[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check if this line contains a clause
      const matchingClause = clauses.find(clause =>
        line.toLowerCase().includes(clause.clauseType.toLowerCase())
      );

      if (matchingClause) {
        const isSelected = selectedClause?.id === matchingClause.id;
        elements.push(
          <div
            key={`line-${lineIndex}`}
            className={`
              p-3 my-2 rounded border-l-4 cursor-pointer transition-all
              ${getRiskColor(matchingClause.riskLevel)}
              ${isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}
            `}
            onClick={() => onClauseSelect?.(matchingClause)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant={matchingClause.riskLevel === 'critical' || matchingClause.riskLevel === 'high' ? 'destructive' : 'default'}>
                {matchingClause.clauseType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Risk: {matchingClause.riskScore.toFixed(1)}
              </span>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-justify">
              {line}
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={`line-${lineIndex}`} className="whitespace-pre-wrap leading-relaxed text-justify">
            {line}
          </div>
        );
      }
    });

    return elements;
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDownload = () => {
    if (isPDF && pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-sm font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={loadDocument}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b px-4 py-3 bg-card flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-sm">Document Viewer</span>
          {clauses.length > 0 && (
            <Badge variant="secondary">{clauses.length} clauses identified</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
          {isPDF && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Page Navigation */}
      {(totalPages > 1 || isPDF) && (
        <div className="border-b px-4 py-2 bg-muted/30 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              className="w-16 px-2 py-1 text-sm text-center border rounded"
            />
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Document Content */}
      {isPDF ? (
        <ScrollArea className="flex-1">
          <div className="flex justify-center items-start p-6 bg-gray-100">
            <canvas
              ref={canvasRef}
              className="shadow-lg bg-white"
            />
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-6">
            <Card className="p-8 bg-white shadow-sm max-w-4xl mx-auto">
              <div
                style={{
                  fontSize: `${zoom * 100}%`,
                  lineHeight: '1.8',
                }}
              >
                {highlightClauses(pages[currentPage - 1] || documentContent)}
              </div>
            </Card>
          </div>
        </ScrollArea>
      )}

      {/* Legend */}
      {clauses.length > 0 && (
        <div className="border-t px-4 py-3 bg-card">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">Risk Levels:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Low</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
