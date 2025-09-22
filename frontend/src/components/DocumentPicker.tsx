import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Document } from '@/services/api';
import { useDocuments } from '@/hooks/useDocuments';
import { FileText, Search, Calendar, User, Check } from 'lucide-react';

interface DocumentPickerProps {
  onSelectDocument: (document: Document) => void;
  trigger: React.ReactNode;
  selectedDocumentId?: number;
}

const DocumentPicker = ({ onSelectDocument, trigger, selectedDocumentId }: DocumentPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const { documents, isLoading } = useDocuments();

  // Filter documents based on search query and processing status
  const filteredDocuments = documents.filter(doc => {
    if (doc.processing_status !== 'ready') return false;

    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.original_filename.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query)
    );
  });

  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleConfirmSelection = () => {
    if (selectedDocument) {
      onSelectDocument(selectedDocument);
      setIsOpen(false);
      setSelectedDocument(null);
      setSearchQuery('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select a Document for Chat</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col min-h-0 flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search documents by name, title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Documents List Container */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="max-h-[50vh] overflow-y-auto pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading documents...</div>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                    <div className="text-muted-foreground">
                      {searchQuery ? 'No documents match your search' : 'No ready documents available'}
                    </div>
                    {!searchQuery && documents.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {documents.length} document(s) are still processing
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map((document) => (
                      <Card
                        key={document.id}
                        className={`p-4 cursor-pointer transition-all hover:bg-accent/50 ${
                          selectedDocument?.id === document.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border'
                        }`}
                        onClick={() => handleSelectDocument(document)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-semibold text-foreground truncate">
                                {document.title || document.original_filename}
                              </h3>
                              {selectedDocument?.id === document.id && (
                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{formatFileSize(document.file_size)}</span>
                              </span>

                              {document.page_count && (
                                <span>{document.page_count} page{document.page_count !== 1 ? 's' : ''}</span>
                              )}

                              {document.word_count && (
                                <span>{document.word_count.toLocaleString()} words</span>
                              )}

                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(document.created_at)}</span>
                              </span>
                            </div>

                            {document.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {document.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {document.document_type || 'Document'}
                              </Badge>
                              {document.is_confidential && (
                                <Badge variant="outline" className="text-xs">
                                  Confidential
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t bg-background">
            <div className="text-sm text-muted-foreground max-w-md truncate">
              {selectedDocument ? (
                `Selected: ${selectedDocument.title || selectedDocument.original_filename}`
              ) : (
                'Select a document to start a chat with context'
              )}
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedDocument(null);
                  setSearchQuery('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedDocument}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Chat with Document
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPicker;