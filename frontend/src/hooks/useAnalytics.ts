import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Predictive Analytics Hooks

export const usePredictOutcome = () => {
  return useMutation({
    mutationFn: (data: {
      document_id: number;
      practice_area: string;
      case_type?: string;
      jurisdiction?: string;
    }) => apiService.predictOutcome(data),
  });
};

export const useEstimateSettlement = () => {
  return useMutation({
    mutationFn: (data: {
      document_id: number;
      practice_area: string;
      claim_amount?: number;
      case_type?: string;
    }) => apiService.estimateSettlement(data),
  });
};

export const usePredictTimeline = () => {
  return useMutation({
    mutationFn: (data: {
      practice_area: string;
      case_stage: string;
      case_type?: string;
      jurisdiction?: string;
    }) => apiService.predictTimeline(data),
  });
};

export const useAnalyzeCaseStrength = () => {
  return useMutation({
    mutationFn: (data: {
      document_id: number;
      practice_area: string;
      plaintiff_perspective: boolean;
    }) => apiService.analyzeCaseStrength(data),
  });
};

export const useFullAnalysis = (documentId: number, enabled = true) => {
  return useQuery({
    queryKey: ['full-analysis', documentId],
    queryFn: () => apiService.getFullAnalysis(documentId),
    enabled: enabled && !!documentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePracticeAreas = () => {
  return useQuery({
    queryKey: ['practice-areas'],
    queryFn: () => apiService.getPracticeAreas(),
    staleTime: 60 * 60 * 1000, // 1 hour - practice areas rarely change
  });
};

export const useCaseStages = () => {
  return useQuery({
    queryKey: ['case-stages'],
    queryFn: () => apiService.getCaseStages(),
    staleTime: 60 * 60 * 1000, // 1 hour - case stages rarely change
  });
};
