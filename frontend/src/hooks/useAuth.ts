import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, LoginRequest, User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    onSuccess: (userData) => {
      console.log('✅ useAuth: Successfully authenticated user:', userData?.email);
    },
    onError: (err) => {
      console.error('❌ useAuth: Authentication failed:', err);
    },
  });

  console.log('🔐 useAuth: Hook state', {
    isAuthenticated: !!user,
    userEmail: user?.email,
    isLoading,
    hasError: !!error
  });


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
    mutationFn: apiService.logout,
    onSuccess: () => {
      // Clear all React Query data
      queryClient.clear();
      toast({
        title: 'Success',
        description: 'Successfully logged out',
      });
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Clear cache anyway
      queryClient.clear();
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
    user,
    isLoading,
    isError,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    verifyToken,
  };
};