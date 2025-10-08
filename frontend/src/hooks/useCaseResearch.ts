import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Case Research Hooks

export const useSearchCases = (
  params: {
    query: string;
    practice_area?: string;
    jurisdiction?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ['search-cases', params],
    queryFn: () => apiService.searchCases(params),
    enabled: enabled && !!params.query,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCaseDetails = (caseId: string, enabled = true) => {
  return useQuery({
    queryKey: ['case-details', caseId],
    queryFn: () => apiService.getCaseDetails(caseId),
    enabled: enabled && !!caseId,
    staleTime: 30 * 60 * 1000, // 30 minutes - case details don't change often
  });
};

export const useDocumentPrecedents = (documentId: number, enabled = true) => {
  return useQuery({
    queryKey: ['document-precedents', documentId],
    queryFn: () => apiService.getDocumentPrecedents(documentId),
    enabled: enabled && !!documentId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useFindRelevantCases = () => {
  return useMutation({
    mutationFn: (data: {
      document_id: number;
      legal_issue: string;
      practice_area?: string;
      jurisdiction?: string;
    }) => apiService.findRelevantCases(data),
  });
};

export const useCaseAnalytics = (
  filters?: {
    practice_area?: string;
    jurisdiction?: string;
    date_from?: string;
    date_to?: string;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ['case-analytics', filters],
    queryFn: () => apiService.getCaseAnalytics(filters),
    enabled,
    staleTime: 15 * 60 * 1000,
  });
};

export const useSavedCases = (userId?: number, enabled = true) => {
  return useQuery({
    queryKey: ['saved-cases', userId],
    queryFn: () => apiService.getSavedCases(userId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};
