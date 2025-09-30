import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, LoginRequest, User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get current user query - uses HTTP-only cookies for authentication
  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => {
      console.log('🔐 useAuth: Making API call to get current user');
      return apiService.getCurrentUser();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !isLoggingOut, // Disable query during logout
    onSuccess: (userData) => {
      console.log('✅ useAuth: Successfully authenticated user:', userData?.email);
    },
    onError: (err) => {
      console.error('❌ useAuth: Authentication failed:', err);
    },
  });

  // Reduced logging to prevent infinite loops
  if (isLoading) {
    console.log('🔐 useAuth: Loading...');
  }


  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => apiService.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
      toast({
        title: 'Success',
        description: 'Successfully logged in',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      setIsLoggingOut(true);
      // Call logout API - don't clear anything until after success
      return apiService.logout();
    },
    onSuccess: () => {
      // Clear only auth-related items from localStorage, preserve chat data
      const authKeysToRemove = ['currentChatSessionId'];
      authKeysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear all sessionStorage (temporary session data)
      sessionStorage.clear();

      // Clear auth-related React Query data
      queryClient.setQueryData(['currentUser'], null);
      queryClient.removeQueries(['currentUser']);
      queryClient.invalidateQueries(['currentUser']);

      // Force a hard redirect with page reload
      window.location.replace('/login');
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Clear only auth-related items even on error
      const authKeysToRemove = ['currentChatSessionId'];
      authKeysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();

      queryClient.setQueryData(['currentUser'], null);
      queryClient.removeQueries(['currentUser']);
      queryClient.invalidateQueries(['currentUser']);
      setIsLoggingOut(false);
      window.location.replace('/login');
    },
  });

  // Token verification (uses HTTP-only cookies)
  const verifyToken = async () => {
    try {
      const result = await apiService.verifyToken();
      if (result.valid) {
        queryClient.setQueryData(['currentUser'], result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  return {
    user: isLoggingOut ? null : user, // Return null user during logout
    isLoading: isLoggingOut ? false : isLoading,
    isError,
    error,
    isAuthenticated: !!user && !isLoggingOut,
    isAdmin: user?.role === 'admin' && !isLoggingOut,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending || isLoggingOut,
    verifyToken,
  };
};