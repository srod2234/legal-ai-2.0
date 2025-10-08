import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Risk Assessment Hooks

export const useAnalyzeDocumentRisk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, options }: {
      documentId: number;
      options?: { include_precedents?: boolean; force_reanalysis?: boolean }
    }) => apiService.analyzeDocumentRisk(documentId, options),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['risk-assessment', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-clauses', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['risk-summary', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['risk-recommendations', variables.documentId] });
    },
  });
};

export const useRiskAssessment = (documentId: number, enabled = true) => {
  return useQuery({
    queryKey: ['risk-assessment', documentId],
    queryFn: () => apiService.getRiskAssessment(documentId),
    enabled: enabled && !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDocumentClauses = (
  documentId: number,
  filters?: { risk_level?: string; clause_type?: string },
  enabled = true
) => {
  return useQuery({
    queryKey: ['document-clauses', documentId, filters],
    queryFn: () => apiService.getDocumentClauses(documentId, filters),
    enabled: enabled && !!documentId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRiskRecommendations = (documentId: number, enabled = true) => {
  return useQuery({
    queryKey: ['risk-recommendations', documentId],
    queryFn: () => apiService.getRiskRecommendations(documentId),
    enabled: enabled && !!documentId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRiskSummary = (documentId: number, enabled = true) => {
  return useQuery({
    queryKey: ['risk-summary', documentId],
    queryFn: () => apiService.getRiskSummary(documentId),
    enabled: enabled && !!documentId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useReanalyzeDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => apiService.reanalyzeDocument(documentId),
    onSuccess: (_, documentId) => {
      // Invalidate all risk-related queries for this document
      queryClient.invalidateQueries({ queryKey: ['risk-assessment', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-clauses', documentId] });
      queryClient.invalidateQueries({ queryKey: ['risk-summary', documentId] });
      queryClient.invalidateQueries({ queryKey: ['risk-recommendations', documentId] });
    },
  });
};
