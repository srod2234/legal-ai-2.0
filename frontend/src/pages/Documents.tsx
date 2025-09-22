import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Search,
  FileText,
  Calendar,
  Eye,
  Trash2,
  Download,
  Grid3X3,
  List,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/hooks/useDocuments";
import { apiService } from "@/services/api";

// Remove local Document interface - we use the one from API service

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Use documents hook for real data
  const { documents, isLoading, uploadDocument, deleteDocument, isUploading, isDeleting } = useDocuments();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case 'processing':
      case 'ocr_processing':
      case 'embedding':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'uploading':
      case 'uploaded':
        return <Badge className="bg-blue-100 text-blue-800">Uploading</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'deleted':
        return <Badge variant="secondary">Deleted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadDocument({
        file: file,
        metadata: {
          title: file.name,
          description: `Uploaded from document library: ${file.name}`,
          is_confidential: true,
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      // Error handling is done in the useDocuments hook
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(documentId);
      } catch (error) {
        console.error('Delete error:', error);
        // Error handling is done in the useDocuments hook
      }
    }
  };

  const handleView = async (documentId: number) => {
    try {
      const content = await apiService.getDocumentContent(documentId);

      // Create a modal or new window to display content
      const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Document Content</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                .content { white-space: pre-wrap; }
                .stats { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>Document Content</h2>
                <p><strong>Document ID:</strong> ${content.document_id}</p>
              </div>
              <div class="content">${content.content || 'No content available'}</div>
              <div class="stats">
                <p><strong>Word Count:</strong> ${content.word_count || 'N/A'}</p>
                <p><strong>Language:</strong> ${content.language || 'N/A'}</p>
                <p><strong>OCR Used:</strong> ${content.has_ocr ? 'Yes' : 'No'}</p>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: 'View Failed',
        description: 'Failed to load document content',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (documentId: number, originalFilename: string) => {
    try {
      const blob = await apiService.downloadDocument(documentId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFilename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Document downloaded successfully',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card-elevated/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Document Library</h1>
              <p className="text-muted-foreground mt-1">
                Manage and analyze your legal documents
              </p>
            </div>
            <Button
              onClick={handleUpload}
              className="gradient-primary hover:shadow-gold transition-spring"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-smooth focus:ring-2 focus:ring-primary/20 focus:border-input-focus"
              />
            </div>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>

            <div className="flex border border-border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="shadow-elegant hover:shadow-gold transition-spring">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <FileText className="w-8 h-8 text-primary" />
                      {getStatusBadge(document.processing_status)}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{document.title || document.filename}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 text-sm">
                      <span>{document.document_type || 'Document'}</span>
                      <span>•</span>
                      <span>{formatFileSize(document.file_size)}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Uploaded</p>
                        <p className="font-medium">{formatDate(document.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">{document.processing_status}</p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-muted-foreground">File Name</p>
                      <p className="font-medium text-sm text-muted-foreground truncate">{document.filename}</p>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={document.processing_status !== 'ready'}
                        onClick={() => handleView(document.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(document.id, document.original_filename)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(document.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="shadow-elegant hover:shadow-gold transition-spring">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">{document.title || document.filename}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{document.document_type || 'Document'}</span>
                            <span>•</span>
                            <span>{formatFileSize(document.file_size)}</span>
                            <span>•</span>
                            <span>Uploaded {formatDate(document.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">File Name</p>
                          <p className="font-medium text-sm truncate max-w-32">{document.filename}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Status</p>
                          {getStatusBadge(document.processing_status)}
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={document.processing_status !== 'ready'}
                            onClick={() => handleView(document.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownload(document.id, document.original_filename)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(document.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms." : "Upload your first document to get started."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Documents;