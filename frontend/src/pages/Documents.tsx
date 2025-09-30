import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Search,
  MoreHorizontal,
  Download,
  Trash2,
  RefreshCw,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileX,
  Eye,
  BarChart3,
  Calendar,
  Users,
  Database,
  Upload,
} from 'lucide-react';
import { apiService, Document } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DocumentsProps {
  className?: string;
}

type ProcessingStatusFilter = 'all' | 'processing' | 'ready' | 'failed' | 'deleted';
type DocumentTypeFilter = 'all' | 'contract' | 'legal_brief' | 'court_filing' | 'memo' | 'research' | 'other';

const Documents: React.FC<DocumentsProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcessingStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showOverview, setShowOverview] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAdmin, user, isLoading: authLoading } = useAuth();

  // Manual document loading to avoid React Query issues
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await apiService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Load documents when user is available
  React.useEffect(() => {
    if (user && !authLoading) {
      loadDocuments();
    }
  }, [user?.id, authLoading]);

  // Manual refetch function
  const refetch = loadDocuments;

  // Get document statistics
  const documentStats = useMemo(() => {
    const stats = {
      total: documents.length,
      processing: documents.filter(d => ['processing', 'ocr_processing', 'embedding'].includes(d.processing_status)).length,
      ready: documents.filter(d => d.processing_status === 'ready').length,
      failed: documents.filter(d => d.processing_status === 'failed').length,
      totalSize: documents.reduce((sum, d) => sum + d.file_size, 0),
      avgProcessingTime: 0, // Would calculate from processing times
      uniqueUsers: isAdmin ? new Set(documents.map(d => d.user_id)).size : 1,
      recentUploads: documents.filter(d => {
        const uploadDate = new Date(d.created_at);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return uploadDate > yesterday;
      }).length,
    };
    return stats;
  }, [documents, isAdmin]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || doc.processing_status === statusFilter;

      const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documents, searchTerm, statusFilter, typeFilter]);

  // Delete document function
  const deleteDocument = async (documentId: number) => {
    try {
      await apiService.deleteDocument(documentId);
      loadDocuments(); // Manual refresh
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(`Failed to delete document: ${error.message}`);
    }
  };

  // Upload document functionality
  const uploadDocument = async (data: { file: File; metadata: any }) => {
    try {
      await apiService.uploadDocument(data.file, data.metadata);
      loadDocuments(); // Manual refresh
      toast.success('Document uploaded successfully');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(`Failed to upload document: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
      case 'ocr_processing':
      case 'embedding':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'deleted':
        return <FileX className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ready</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      case 'ocr_processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">OCR Processing</Badge>;
      case 'embedding':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Embedding</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case 'deleted':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Deleted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type?: string) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;

    const typeLabels: Record<string, string> = {
      contract: 'Contract',
      legal_brief: 'Legal Brief',
      court_filing: 'Court Filing',
      memo: 'Memo',
      research: 'Research',
      other: 'Other',
    };

    return <Badge variant="outline">{typeLabels[type] || type}</Badge>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteDocument = (documentId: number) => {
    deleteDocument(documentId);
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const blob = await apiService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.original_filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadDocument({
      file: file,
      metadata: {
        title: file.name,
        description: `Uploaded from document library: ${file.name}`,
        is_confidential: true,
      }
    });
  };

  // Get recent documents for quick overview
  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="h-full overflow-auto">
      <div className={`p-6 max-w-[1600px] mx-auto space-y-6 ${className || ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Document Management</h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Monitor and manage all system documents' : 'Manage your legal documents'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowOverview(!showOverview)}
              variant="outline"
              size="sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showOverview ? 'Hide Overview' : 'Show Overview'}
            </Button>
            <Button
              onClick={handleUpload}
              className="gradient-primary hover:shadow-gold transition-spring"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards - Collapsible */}
        {showOverview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documentStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(documentStats.totalSize)} total size
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processing</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{documentStats.processing}</div>
                  <p className="text-xs text-muted-foreground">
                    Documents being processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ready</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{documentStats.ready}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documentStats.recentUploads}</div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded in last 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>User Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{documentStats.uniqueUsers}</div>
                    <p className="text-sm text-muted-foreground">Active users with documents</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Storage Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatFileSize(documentStats.totalSize)}</div>
                  <p className="text-sm text-muted-foreground">Total storage consumed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Success Rate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {documentStats.total > 0
                      ? Math.round((documentStats.ready / documentStats.total) * 100)
                      : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Processing success rate</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Document List</span>
            </CardTitle>
            <CardDescription>Search and filter documents by status and type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: ProcessingStatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value: DocumentTypeFilter) => setTypeFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="legal_brief">Legal Brief</SelectItem>
                  <SelectItem value="court_filing">Court Filing</SelectItem>
                  <SelectItem value="memo">Memo</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Documents Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    {isAdmin && <TableHead>User ID</TableHead>}
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading documents...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                          ? 'No documents match your filters'
                          : 'No documents found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-start space-x-2">
                            {getStatusIcon(document.processing_status)}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {document.title || document.original_filename}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {document.filename}
                              </div>
                              {document.processing_error && (
                                <div className="text-xs text-red-600 truncate">
                                  Error: {document.processing_error}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(document.processing_status)}</TableCell>
                        <TableCell>{getTypeBadge(document.document_type)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(document.file_size)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-muted-foreground">
                            {document.user_id}
                          </TableCell>
                        )}
                        <TableCell className="text-muted-foreground">
                          {formatDate(document.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleDownloadDocument(document)}
                                disabled={document.processing_status !== 'ready'}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{document.original_filename}"?
                                      This action cannot be undone and will remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDocument(document.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Results Summary */}
            {filteredDocuments.length > 0 && (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>
                  Showing {filteredDocuments.length} of {documents.length} documents
                </div>
                <div className="flex items-center space-x-4">
                  <span>{filteredDocuments.filter(d => d.processing_status === 'ready').length} ready</span>
                  <span>{filteredDocuments.filter(d => d.processing_status === 'failed').length} failed</span>
                  <span>{filteredDocuments.filter(d => ['processing', 'ocr_processing', 'embedding'].includes(d.processing_status)).length} processing</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default Documents;