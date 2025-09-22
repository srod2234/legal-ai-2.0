import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Document, DocumentUploadResponse } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useDocuments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get documents query
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: () => {
      console.log('📤 useDocuments: Making API call to fetch documents');
      return apiService.getDocuments();
    },
    staleTime: 30 * 1000, // 30 seconds
    onSuccess: (data) => {
      console.log('✅ useDocuments: Successfully fetched documents:', data.length);
    },
    onError: (err) => {
      console.error('❌ useDocuments: Error fetching documents:', err);
    },
  });

  console.log('📋 useDocuments: Hook state', {
    documentsCount: documents.length,
    isLoading,
    hasError: !!error
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      metadata,
    }: {
      file: File;
      metadata?: {
        title?: string;
        description?: string;
        tags?: string;
        is_confidential?: boolean;
        session_id?: number;
      };
    }) => apiService.uploadDocument(file, metadata),
    onSuccess: (uploadResponse: DocumentUploadResponse) => {
      // Invalidate and refetch documents to get the complete document data
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Success',
        description: uploadResponse.message || 'Document uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => apiService.deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      queryClient.setQueryData(['documents'], (old: Document[] = []) =>
        old.filter((doc) => doc.id !== documentId)
      );
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    documents,
    isLoading,
    error,
    refetch,
    uploadDocument: uploadMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};