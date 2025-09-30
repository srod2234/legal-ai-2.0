import { useState, useEffect } from 'react';
import { Document, DocumentUploadResponse, apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export const useDocuments = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const fetchedDocuments = await apiService.getDocuments();
      setDocuments(fetchedDocuments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File, metadata?: any): Promise<DocumentUploadResponse> => {
    try {
      setIsUploading(true);
      setError(null);
      const result = await apiService.uploadDocument(file, metadata);
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      refetch(); // Refresh the documents list
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setError(new Error(errorMessage));
      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: number): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);
      await apiService.deleteDocument(documentId);
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      refetch(); // Refresh the documents list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(new Error(errorMessage));
      toast({
        title: 'Delete Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  // Load documents when user is available
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user?.id]);

  return {
    documents,
    isLoading,
    error,
    refetch,
    uploadDocument,
    deleteDocument,
    isUploading,
    isDeleting,
  };
};