import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { apiService, Document } from '@/services/api';
import { toast } from 'sonner';

interface DocumentManagementProps {
  className?: string;
}

type ProcessingStatusFilter = 'all' | 'processing' | 'ready' | 'failed' | 'deleted';
type DocumentTypeFilter = 'all' | 'contract' | 'legal_brief' | 'court_filing' | 'memo' | 'research' | 'other';

const DocumentManagement: React.FC<DocumentManagementProps> = ({ className }) => {
  // Manual document loading for admin overview
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAdminDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

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
      uniqueUsers: new Set(documents.map(d => d.user_id)).size,
      recentUploads: documents.filter(d => {
        const uploadDate = new Date(d.created_at);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return uploadDate > yesterday;
      }).length,
    };
    return stats;
  }, [documents]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading document overview...</span>
          </div>
        </div>
      </div>
    );
  }

  // Get recent documents for quick overview
  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ready</Badge>;
      case 'processing':
      case 'ocr_processing':
      case 'embedding':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Overview</h2>
          <p className="text-muted-foreground">
            System-wide document statistics and recent activity
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
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

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Documents</span>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              View All Documents
            </Button>
          </CardTitle>
          <CardDescription>Latest documents uploaded to the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found
            </div>
          ) : (
            <div className="space-y-4">
              {recentDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <div className="font-medium">
                        {document.title || document.original_filename}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        User {document.user_id} • {formatDate(document.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(document.processing_status)}
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize(document.file_size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Reminder */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-blue-800">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Need full document management?</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Visit the main Documents page for complete document management features, including upload, search, filtering, and detailed actions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManagement;