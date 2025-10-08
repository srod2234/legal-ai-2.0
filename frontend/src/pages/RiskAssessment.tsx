/**
 * Risk Assessment Page
 *
 * List view of documents with their risk assessments
 * Allows users to view and analyze document risk
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, Document } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Search,
  FileText,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function RiskAssessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await apiService.getDocuments();
      // Filter to only show ready documents
      setDocuments(data.filter(d => d.processing_status === 'ready'));
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDocument = async (documentId: number) => {
    try {
      toast.loading('Analyzing document risk...', { id: 'analyze' });
      await apiService.analyzeDocumentRisk(documentId, {
        include_precedents: true,
        force_reanalysis: false,
      });
      toast.success('Risk analysis completed', { id: 'analyze' });
      navigate(`/documents/${documentId}/analysis`);
    } catch (error: any) {
      console.error('Failed to analyze document:', error);
      toast.error(error.message || 'Failed to analyze document', { id: 'analyze' });
    }
  };

  const getRiskBadge = (score?: number) => {
    if (!score) return <Badge variant="secondary">Not Analyzed</Badge>;

    if (score >= 8) return <Badge variant="destructive">Critical</Badge>;
    if (score >= 6) return <Badge className="bg-orange-500">High</Badge>;
    if (score >= 4) return <Badge className="bg-yellow-500">Medium</Badge>;
    if (score >= 2) return <Badge className="bg-blue-500">Low</Badge>;
    return <Badge className="bg-green-500">Minimal</Badge>;
  };

  const getRiskIcon = (score?: number) => {
    if (!score) return <AlertCircle className="h-5 w-5 text-gray-400" />;

    if (score >= 8) return <XCircle className="h-5 w-5 text-red-500" />;
    if (score >= 6) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    if (score >= 4) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    if (score >= 2) return <Shield className="h-5 w-5 text-blue-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: documents.length,
    analyzed: documents.filter(d => d.confidence_score).length,
    highRisk: documents.filter(d => d.confidence_score && d.confidence_score >= 6).length,
    needsReview: documents.filter(d => !d.confidence_score).length,
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Assessment</h1>
        <p className="text-muted-foreground">
          Analyze and review document risk across your organization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Ready for analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analyzed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.analyzed / stats.total) * 100) : 0}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needsReview}</div>
            <p className="text-xs text-muted-foreground">Not yet analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Select a document to perform risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No documents match your search' : 'No documents available for analysis'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRiskIcon(doc.confidence_score)}
                        <div>
                          <div className="font-medium">{doc.title || doc.original_filename}</div>
                          <div className="text-sm text-muted-foreground">{doc.filename}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.document_type || 'Document'}</Badge>
                    </TableCell>
                    <TableCell>{getRiskBadge(doc.confidence_score)}</TableCell>
                    <TableCell>
                      {doc.confidence_score ? (
                        <span className="font-mono">{doc.confidence_score.toFixed(1)}/10</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => analyzeDocument(doc.id)}
                      >
                        {doc.confidence_score ? 'View Analysis' : 'Analyze'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
