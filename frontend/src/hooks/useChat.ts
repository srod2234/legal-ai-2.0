import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, ChatSession, ChatMessage } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: 'message' | 'typing' | 'error' | 'connected' | 'stream_response';
  data?: ChatMessage | { isTyping: boolean } | unknown;
  message?: string;
  content?: string;
  error?: string;
}

export const useChat = (sessionId?: number) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Helper function to persist messages to localStorage
  const saveMessagesToStorage = (sessionId: number, messages: ChatMessage[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`chatMessages_${sessionId}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  };

  // Helper function to persist sessions to localStorage
  const saveSessionsToStorage = (sessions: ChatSession[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
      } catch (error) {
        console.error('Error saving sessions to localStorage:', error);
      }
    }
  };

  // Helper function to load sessions from localStorage
  const loadSessionsFromStorage = (): ChatSession[] => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chatSessions');
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Error loading sessions from localStorage:', error);
        return [];
      }
    }
    return [];
  };

  // Enhanced setMessages that also persists to localStorage
  const setMessagesWithPersistence = (updater: React.SetStateAction<ChatMessage[]>) => {
    setMessages((prevMessages) => {
      const newMessages = typeof updater === 'function' ? updater(prevMessages) : updater;
      if (sessionId) {
        saveMessagesToStorage(sessionId, newMessages);
      }
      return newMessages;
    });
  };

  // Utility function to clear persisted messages for a session
  const clearPersistedMessages = (sessionId: number) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`chatMessages_${sessionId}`);
        console.log('Cleared persisted messages for session:', sessionId);
      } catch (error) {
        console.error('Error clearing persisted messages:', error);
      }
    }
  };

  // Helper function to generate a chat title from the first user message
  const generateChatTitle = (message: string): string => {
    // Remove extra whitespace and limit to 50 characters
    const cleanMessage = message.trim().replace(/\s+/g, ' ');
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }

    // Find the last space before the 50-character limit
    const truncated = cleanMessage.substring(0, 50);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > 20) { // Only truncate at word boundary if it's reasonably long
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  };

  // Get chat sessions with localStorage persistence
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery<ChatSession[]>({
    queryKey: ['chatSessions'],
    queryFn: apiService.getChatSessions,
    staleTime: 60 * 1000, // 1 minute
    initialData: loadSessionsFromStorage, // Load from localStorage immediately
  });

  // Save sessions to localStorage whenever they're updated
  useEffect(() => {
    if (sessions && sessions.length >= 0) {
      saveSessionsToStorage(sessions);
    }
  }, [sessions]);

  // Get messages for current session
  const {
    data: sessionMessages = [],
    isLoading: isLoadingMessages,
  } = useQuery<ChatMessage[]>({
    queryKey: ['chatMessages', sessionId],
    queryFn: () => sessionId ? apiService.getChatMessages(sessionId) : Promise.resolve([]),
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: ({ title, documentId }: { title?: string; documentId?: number }) => apiService.createChatSession(title, documentId),
    onSuccess: (newSession) => {
      console.log('Session created successfully:', newSession);

      // Update the sessions list immediately with optimistic update
      const updatedSessions = [newSession, ...sessions];
      queryClient.setQueryData(['chatSessions'], updatedSessions);

      // Save updated sessions to localStorage immediately
      saveSessionsToStorage(updatedSessions);

      // Clear any persisted messages for the new session to start fresh
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`chatMessages_${newSession.id}`);
      }

      // Mark this session as not auto-named yet
      autoNamedSessionsRef.current.delete(newSession.id);

      // Refresh to ensure server state is consistent
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });

      console.log('Session creation completed, sessions updated');
    },
    onError: (error: Error) => {
      console.error('Failed to create session:', error);
      toast({
        title: 'Error',
        description: `Failed to create session: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, updates }: {
      sessionId: number;
      updates: {
        title?: string;
        document_id?: number;
        session_type?: string;
      }
    }) => {
      console.log('updateSessionMutation.mutationFn called with:', { sessionId, updates });
      return apiService.updateChatSession(sessionId, updates);
    },
    onSuccess: (updatedSession) => {
      console.log('updateSessionMutation.onSuccess called with:', updatedSession);
      // Update the sessions list immediately
      const updatedSessions = (sessions as ChatSession[]).map((session: ChatSession) =>
        session.id === updatedSession.id ? updatedSession : session
      );
      queryClient.setQueryData(['chatSessions'], updatedSessions);

      // Save updated sessions to localStorage immediately
      saveSessionsToStorage(updatedSessions);

      // Also refresh the sessions to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
    onError: (error: Error) => {
      console.error('updateSessionMutation.onError called with:', error);
      toast({
        title: 'Error',
        description: `Failed to update chat title: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // WebSocket connection with improved stability
  const connectWebSocket = useCallback(async () => {
    // Don't connect if we don't have a sessionId
    if (!sessionId) {
      console.log('useChat: No sessionId provided, skipping WebSocket connection');
      return;
    }

    // Check if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting, skipping');
      return;
    }

    try {
      console.log('Creating WebSocket connection for session:', sessionId);
      const websocket = await apiService.createWebSocket(sessionId);
      wsRef.current = websocket;

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const wsMessage: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', wsMessage.type, wsMessage);

          switch (wsMessage.type) {
            case 'connected':
              console.log('WebSocket connection confirmed by server');
              setIsConnected(true);
              break;

            case 'message':
              if (wsMessage.data && typeof wsMessage.data === 'object' && 'id' in wsMessage.data) {
                console.log('Adding regular message:', wsMessage.data);
                setMessagesWithPersistence(prev => [...prev, wsMessage.data as ChatMessage]);
                setIsTyping(false);
              }
              break;

            case 'stream_response':
              console.log('Stream response received:', { data: wsMessage.data, content: wsMessage.content });

              if (wsMessage.data && typeof wsMessage.data === 'object') {
                const streamData = wsMessage.data as any;
                const messageId = streamData.message_id || Date.now().toString();

                if (streamData.is_complete) {
                  // Final message - finalize with metadata but keep existing content
                  console.log('Final stream message - finalizing assistant message');
                  setMessagesWithPersistence(prev => {
                    const existingIndex = prev.findIndex(msg => msg.id === messageId && msg.type === 'assistant');
                    if (existingIndex >= 0) {
                      // Update existing streaming message with final metadata
                      const updatedMessages = [...prev];
                      updatedMessages[existingIndex] = {
                        ...updatedMessages[existingIndex],
                        // Add final delta content if any
                        content: updatedMessages[existingIndex].content + (wsMessage.content || ''),
                        confidence: streamData.confidence_score || updatedMessages[existingIndex].confidence,
                        sources: streamData.sources || updatedMessages[existingIndex].sources
                      };
                      return updatedMessages;
                    } else {
                      // Create new message if not found (shouldn't happen but fallback)
                      const assistantMessage: ChatMessage = {
                        id: messageId,
                        content: wsMessage.content || '',
                        type: 'assistant',
                        timestamp: new Date().toISOString(),
                        confidence: streamData.confidence_score || 0.8,
                        sources: streamData.sources || []
                      };
                      return [...prev, assistantMessage];
                    }
                  });
                  setIsTyping(false);
                } else {
                  // Streaming in progress - accumulate content deltas
                  console.log('Streaming in progress - accumulating content delta:', wsMessage.content);
                  setMessagesWithPersistence(prev => {
                    const existingIndex = prev.findIndex(msg => msg.id === messageId && msg.type === 'assistant');
                    if (existingIndex >= 0) {
                      // Accumulate delta content to existing message
                      const updatedMessages = [...prev];
                      updatedMessages[existingIndex] = {
                        ...updatedMessages[existingIndex],
                        content: updatedMessages[existingIndex].content + (wsMessage.content || '')
                      };
                      return updatedMessages;
                    } else {
                      // Create new streaming message with initial delta
                      const streamingMessage: ChatMessage = {
                        id: messageId,
                        content: wsMessage.content || '',
                        type: 'assistant',
                        timestamp: new Date().toISOString(),
                        confidence: 0.8,
                        sources: []
                      };
                      return [...prev, streamingMessage];
                    }
                  });
                  setIsTyping(true);
                }
              }
              break;

            case 'typing':
              const typingData = wsMessage.data as { isTyping?: boolean; is_typing?: boolean } | undefined;
              setIsTyping(typingData?.isTyping || typingData?.is_typing || false);
              break;

            case 'error':
              console.error('WebSocket error message:', wsMessage.error);
              toast({
                title: 'Chat Error',
                description: wsMessage.error || 'An error occurred',
                variant: 'destructive',
              });
              setIsTyping(false);
              break;

            default:
              console.log('Unknown WebSocket message type:', wsMessage.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsTyping(false);

        // Only show error if it wasn't a clean close and we had an active session
        if (sessionId && event.code !== 1000 && event.code !== 1001) {
          console.log('WebSocket closed unexpectedly, may need to reconnect');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to chat service. Please check your authentication.',
        variant: 'destructive',
      });
    }
  }, [sessionId]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Track whether auto-naming has been done for this session
  const autoNamedSessionsRef = useRef<Set<number>>(new Set());

  // Wrapper function for updateSession to match expected interface
  const updateSession = async (sessionId: number, updates: {
    title?: string;
    document_id?: number;
    session_type?: string;
  }) => {
    return updateSessionMutation.mutateAsync({ sessionId, updates });
  };

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) => apiService.deleteChatSession(sessionId),
    onSuccess: (data, sessionId) => {
      console.log('Session deleted successfully:', sessionId);

      // Remove session from local state immediately
      const updatedSessions = (sessions as ChatSession[]).filter((session: ChatSession) => session.id !== sessionId);
      queryClient.setQueryData(['chatSessions'], updatedSessions);

      // Save updated sessions to localStorage immediately
      saveSessionsToStorage(updatedSessions);

      // Clear any persisted messages for the deleted session
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`chatMessages_${sessionId}`);
      }

      // Refresh to ensure server state is consistent
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
    onError: (error: Error, sessionId) => {
      console.error('Failed to delete session:', error);
      toast({
        title: 'Error',
        description: `Failed to delete chat: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Wrapper function for deleteSession
  const deleteSession = async (sessionId: number) => {
    return deleteSessionMutation.mutateAsync(sessionId);
  };

  // Send message with improved error handling and auto-naming
  const sendMessage = useCallback((content: string) => {
    if (!sessionId) {
      console.error('No session ID available for sending message');
      toast({
        title: 'Error',
        description: 'No chat session available. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      console.log('Empty message, not sending');
      return;
    }

    // Check WebSocket connection
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not ready, state:', wsRef.current?.readyState);
      toast({
        title: 'Connection Error',
        description: 'Not connected to chat service. Please wait for connection or refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date().toISOString(),
    };

    // Check if this is the first user message for this session (improved auto-naming logic)
    const hasUserMessages = messages.some(msg => msg.type === 'user');
    const hasBeenAutoNamed = autoNamedSessionsRef.current.has(sessionId);
    const shouldAutoName = !hasUserMessages && !hasBeenAutoNamed;

    console.log('Auto-naming check:', {
      sessionId,
      hasUserMessages,
      hasBeenAutoNamed,
      shouldAutoName,
      messagesCount: messages.length
    });

    // Add user message immediately
    console.log('Adding user message:', userMessage);
    setMessagesWithPersistence(prev => [...prev, userMessage]);

    // Auto-name the session if this is the first user message
    if (shouldAutoName) {
      const generatedTitle = generateChatTitle(content.trim());
      console.log('Auto-naming session with title:', generatedTitle);

      // Mark this session as auto-named
      autoNamedSessionsRef.current.add(sessionId);

      // Auto-name immediately - no need for setTimeout since we have proper tracking
      updateSessionMutation.mutate({
        sessionId,
        updates: { title: generatedTitle }
      });
    }

    // Send message via WebSocket
    try {
      const messagePayload = {
        type: 'message',
        content: content.trim(),
        session_id: sessionId,
      };

      console.log('Sending WebSocket message:', messagePayload);
      wsRef.current.send(JSON.stringify(messagePayload));
      setIsTyping(true);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast({
        title: 'Send Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [sessionId, messages, updateSessionMutation]);

  // Effect to load session messages and handle persistence
  useEffect(() => {
    if (!sessionId) {
      // Default welcome message for new chats
      setMessagesWithPersistence([{
        id: '1',
        type: 'assistant',
        content: 'Welcome to Legal AI System! I can help you analyze legal documents and answer questions about them. Upload a document to get started, or ask me anything about legal matters.',
        timestamp: new Date().toISOString(),
        confidence: 0.95
      }]);
      return;
    }

    // Try to load from localStorage first
    const savedMessages = localStorage.getItem(`chatMessages_${sessionId}`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (parsedMessages.length > 0) {
          console.log('Loading messages from localStorage for session:', sessionId);
          setMessages(parsedMessages);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }

    // Fall back to session messages from React Query if no localStorage data
    if (sessionMessages.length > 0) {
      console.log('Loading messages from React Query for session:', sessionId);
      setMessagesWithPersistence(sessionMessages);
    }
  }, [sessionMessages, sessionId]);

  // Effect to handle sessionId changes and load persisted messages
  useEffect(() => {
    if (sessionId) {
      console.log('useChat: SessionId changed, loading messages for session:', sessionId);

      // Reset auto-naming tracking when switching to a new session
      // Check if this session has already been auto-named based on message count
      const currentSession = (sessions as ChatSession[]).find((s: ChatSession) => s.id === sessionId);
      if (currentSession && currentSession.message_count > 0) {
        autoNamedSessionsRef.current.add(sessionId);
      }

      const savedMessages = localStorage.getItem(`chatMessages_${sessionId}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          console.log('useChat: Loaded persisted messages for session:', sessionId, parsedMessages.length);
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error loading messages from localStorage for session:', sessionId, error);
          setMessages([]);
        }
      } else {
        console.log('useChat: No persisted messages found for session:', sessionId);
        setMessages([]);
      }
    } else {
      // Clear messages when no session is active
      console.log('useChat: No active session, clearing messages');
      setMessages([]);
    }
  }, [sessionId, sessions]);

  // Auto-connect WebSocket when sessionId changes
  useEffect(() => {
    console.log('useChat: Setting up WebSocket for session:', sessionId);

    // Don't connect if no sessionId
    if (!sessionId) {
      console.log('useChat: No sessionId, cleaning up any existing connection');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Clean up any existing connection before creating new one
    if (wsRef.current) {
      console.log('useChat: Closing existing WebSocket connection for new session');
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }

    // Connect after a small delay to ensure cleanup is complete
    const timeoutId = setTimeout(() => {
      console.log('useChat: Connecting WebSocket for session:', sessionId);
      connectWebSocket();
    }, 200);

    // Cleanup on unmount or sessionId change
    return () => {
      console.log('useChat: Cleaning up WebSocket effect for session:', sessionId);
      clearTimeout(timeoutId);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
  }, [sessionId]);

  return {
    // Session management
    sessions,
    isLoadingSessions,
    createSession: createSessionMutation.mutateAsync,
    isCreatingSession: createSessionMutation.isPending,
    updateSession,
    isUpdatingSession: updateSessionMutation.isPending,
    deleteSession,
    isDeletingSession: deleteSessionMutation.isPending,
    refetchSessions,

    // Messages
    messages,
    isLoadingMessages,
    sendMessage,
    clearPersistedMessages,

    // WebSocket state
    isConnected,
    isTyping,
    connectWebSocket,
    disconnectWebSocket,
  };
};