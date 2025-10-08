import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Firm Management Hooks

export const useCreateFirm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      firm_code: string;
      subscription_tier?: string;
      max_users?: number;
      max_documents?: number;
    }) => apiService.createFirm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firms'] });
    },
  });
};

export const useFirm = (firmId: number, enabled = true) => {
  return useQuery({
    queryKey: ['firm', firmId],
    queryFn: () => apiService.getFirm(firmId),
    enabled: enabled && !!firmId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateFirm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ firmId, data }: { firmId: number; data: any }) =>
      apiService.updateFirm(firmId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['firm', variables.firmId] });
      queryClient.invalidateQueries({ queryKey: ['firms'] });
    },
  });
};

export const useFirmUsers = (firmId: number, enabled = true) => {
  return useQuery({
    queryKey: ['firm-users', firmId],
    queryFn: () => apiService.getFirmUsers(firmId),
    enabled: enabled && !!firmId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddFirmUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ firmId, userId }: { firmId: number; userId: number }) =>
      apiService.addFirmUser(firmId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['firm-users', variables.firmId] });
      queryClient.invalidateQueries({ queryKey: ['firm-statistics', variables.firmId] });
    },
  });
};

export const useRemoveFirmUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ firmId, userId }: { firmId: number; userId: number }) =>
      apiService.removeFirmUser(firmId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['firm-users', variables.firmId] });
      queryClient.invalidateQueries({ queryKey: ['firm-statistics', variables.firmId] });
    },
  });
};

export const useFirmStatistics = (firmId: number, enabled = true) => {
  return useQuery({
    queryKey: ['firm-statistics', firmId],
    queryFn: () => apiService.getFirmStatistics(firmId),
    enabled: enabled && !!firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes - statistics should be relatively fresh
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
};

export const useFirmLimits = (firmId: number, enabled = true) => {
  return useQuery({
    queryKey: ['firm-limits', firmId],
    queryFn: () => apiService.checkFirmLimits(firmId),
    enabled: enabled && !!firmId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useListFirms = (enabled = true) => {
  return useQuery({
    queryKey: ['firms'],
    queryFn: () => apiService.listFirms(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFirmByCode = (firmCode: string, enabled = true) => {
  return useQuery({
    queryKey: ['firm-by-code', firmCode],
    queryFn: () => apiService.getFirmByCode(firmCode),
    enabled: enabled && !!firmCode,
    staleTime: 10 * 60 * 1000,
  });
};
