import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Paperclip, FileText, User, Bot, Upload, Edit3, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { apiService, Document } from "@/services/api";
import DocumentContextHeader from "@/components/DocumentContextHeader";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: Array<{
    pageNumber: number;
    excerpt: string;
    relevanceScore: number;
  }>;
}

const ChatInterface = () => {
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<number | undefined>(undefined);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [sessionDocument, setSessionDocument] = useState<Document | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Use chat hook for real-time messaging
  const { messages, sendMessage, isTyping, isConnected, createSession, sessions, updateSession, isUpdatingSession, refetchSessions, isLoadingSessions } = useChat(sessionId);

  // Use documents hook for file uploads
  const { uploadDocument, isUploading, documents, refetch: refetchDocuments } = useDocuments();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Get current session
  const currentSession = sessions.find(s => s.id === sessionId);

  // Debug log
  console.log('ChatInterface Debug:', {
    sessionId,
    sessionsLength: sessions.length,
    currentSession: currentSession?.title,
    sessions: sessions.map(s => ({ id: s.id, title: s.title }))
  });

  // Fallback title if session not found but we have a sessionId
  const displayTitle = currentSession?.title || (sessionId ? `Chat ${sessionId}` : 'New Chat');

  // Title editing functions
  const startEditingTitle = () => {
    if (sessionId) {
      setEditTitleValue(displayTitle);
      setIsEditingTitle(true);
      // Focus the input after a small delay
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 100);
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditTitleValue("");
  };

  const saveTitle = async () => {
    console.log('saveTitle called with:', { sessionId, editTitleValue });

    if (!sessionId || sessionId === undefined || !editTitleValue.trim()) {
      console.log('saveTitle early return - missing sessionId or empty title:', { sessionId, hasTitle: !!editTitleValue.trim() });
      cancelEditingTitle();
      return;
    }

    try {
      console.log('Calling updateSession with:', sessionId, { title: editTitleValue.trim() });
      const result = await updateSession(sessionId, { title: editTitleValue.trim() });
      console.log('updateSession result:', result);

      setIsEditingTitle(false);
      setEditTitleValue("");
      // Refetch sessions to update the sidebar
      await refetchSessions();
      toast({
        title: "Success",
        description: "Chat title updated successfully!",
      });
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Error",
        description: "Failed to update chat title. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  // Create a session when component mounts if none exists
  useEffect(() => {
    const initializeSession = async () => {
      console.log('ChatInterface: initializeSession called', {
        sessionId,
        sessionsLength: sessions.length,
        isLoadingSessions,
        sessions: sessions.map(s => ({ id: s.id, title: s.title }))
      });

      // First, try to restore session from localStorage
      const savedSessionId = localStorage.getItem('currentChatSessionId');
      if (savedSessionId && !sessionId) {
        const savedId = parseInt(savedSessionId, 10);
        console.log('ChatInterface: Found saved session ID:', savedId);

        // Check if the saved session exists in the sessions list
        if (sessions.length > 0) {
          const sessionExists = sessions.find(s => s.id === savedId);
          if (sessionExists) {
            console.log('ChatInterface: Restoring session from localStorage:', savedId);
            setSessionId(savedId);
            return;
          } else {
            // Saved session doesn't exist anymore, clear it
            console.log('ChatInterface: Saved session no longer exists, clearing localStorage');
            localStorage.removeItem('currentChatSessionId');
          }
        } else if (sessions.length === 0 && !isLoadingSessions) {
          // Sessions are loaded but empty, set the ID and let it validate later
          console.log('ChatInterface: No sessions found, but setting saved ID anyway:', savedId);
          setSessionId(savedId);
          return;
        }
      }

      // If no saved session or it doesn't exist, create/use a session
      if (!sessionId && !isLoadingSessions) {
        if (sessions.length === 0) {
          try {
            console.log('ChatInterface: Creating initial session');
            const newSession = await createSession('New Chat');
            setSessionId(newSession.id);
            localStorage.setItem('currentChatSessionId', newSession.id.toString());
          } catch (error) {
            console.error('Failed to create initial session:', error);
          }
        } else {
          // Use the most recent session
          console.log('ChatInterface: Using most recent session:', sessions[0].id);
          setSessionId(sessions[0].id);
          localStorage.setItem('currentChatSessionId', sessions[0].id.toString());
        }
      }
    };

    // Only initialize if sessions are loaded (not loading)
    if (!isLoadingSessions) {
      initializeSession();
    }
  }, [sessionId, sessions.length, isLoadingSessions]); // Added isLoadingSessions dependency

  // Load document information when session changes
  useEffect(() => {
    const loadSessionDocument = async () => {
      if (!sessionId || !currentSession) {
        setSessionDocument(null);
        return;
      }

      // If current session has a document_id, try to find the document
      if (currentSession.document_id) {
        const document = documents.find(doc => doc.id === currentSession.document_id);
        if (document) {
          setSessionDocument(document);
        } else {
          // If document not found in local cache, this could be a backend issue
          // For now, we'll set it to null
          setSessionDocument(null);
        }
      } else {
        setSessionDocument(null);
      }
    };

    loadSessionDocument();
  }, [sessionId, currentSession, documents]);

  // Save sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('currentChatSessionId', sessionId.toString());
    }
  }, [sessionId]);

  // Listen for session change events from sidebar
  useEffect(() => {
    const handleNewChat = (event: any) => {
      const newSessionId = event.detail.sessionId;
      console.log('Received new chat event:', newSessionId);

      // Cancel any ongoing title editing when switching sessions
      if (isEditingTitle) {
        setIsEditingTitle(false);
        setEditTitleValue("");
      }

      setSessionId(newSessionId);
    };

    const handleSessionChange = (event: any) => {
      const newSessionId = event.detail.sessionId;
      console.log('Received session change event:', newSessionId);

      // Cancel any ongoing title editing when switching sessions
      if (isEditingTitle) {
        setIsEditingTitle(false);
        setEditTitleValue("");
      }

      // Handle null sessionId (when a chat is deleted)
      if (newSessionId === null || newSessionId === undefined) {
        setSessionId(undefined);
        return;
      }

      setSessionId(newSessionId);
    };

    window.addEventListener('newChatCreated', handleNewChat);
    window.addEventListener('chatSessionChanged', handleSessionChange);

    return () => {
      window.removeEventListener('newChatCreated', handleNewChat);
      window.removeEventListener('chatSessionChanged', handleSessionChange);
    };
  }, [isEditingTitle]);

  useEffect(() => {
    // Always scroll to bottom for new messages, but allow manual scrolling
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated before scrolling
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]); // Only trigger on message count change, not content changes

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue;
    setInputValue("");

    try {
      sendMessage(messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadMetadata: {
        title: string;
        description: string;
        is_confidential: boolean;
        session_id?: number;
      } = {
        title: file.name,
        description: `Uploaded via chat: ${file.name}`,
        is_confidential: true,
      };

      // If we have an active session, link the document to it
      if (sessionId) {
        uploadMetadata.session_id = sessionId;
      }

      const result = await uploadDocument({
        file: file,
        metadata: uploadMetadata
      });

      toast({
        title: "Success",
        description: "Document uploaded and processed successfully!",
      });

      // If we have an active session, link the document to it and update session type
      if (sessionId && result.document_id) {
        try {
          console.log('Linking document to session:', { sessionId, documentId: result.document_id });

          // Update the session to link the document and change type to 'document'
          await updateSession(sessionId, {
            document_id: result.document_id,
            session_type: 'document'
          });

          console.log('Session updated successfully with document link');

          // Refresh both sessions and documents to get updated info
          await Promise.all([
            refetchSessions(),
            refetchDocuments()
          ]);

          toast({
            title: "Document Linked",
            description: "Document has been linked to this chat as context!",
          });
        } catch (error) {
          console.error('Error linking document to session:', error);
          toast({
            title: "Warning",
            description: "Document uploaded but failed to link to chat. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Error handling is done in the useDocuments hook
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewDocument = async () => {
    if (sessionDocument) {
      try {
        const content = await apiService.getDocumentContent(sessionDocument.id);
        // You could open a modal or navigate to a document view page
        console.log('Document content:', content);
        toast({
          title: "Document Content",
          description: `Document has ${content.word_count} words`,
        });
      } catch (error) {
        console.error('Error fetching document content:', error);
        toast({
          title: "Error",
          description: "Failed to load document content",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadDocument = async () => {
    if (sessionDocument) {
      try {
        const blob = await apiService.downloadDocument(sessionDocument.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = sessionDocument.original_filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "Document downloaded successfully!",
        });
      } catch (error) {
        console.error('Error downloading document:', error);
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Document Context Header */}
      {sessionDocument && (
        <div className="border-b border-border bg-background p-4">
          <div className="max-w-4xl mx-auto">
            <DocumentContextHeader document={sessionDocument} />
          </div>
        </div>
      )}

      {/* Chat Title Header */}
      {sessionId && (
        <div className="border-b border-border bg-card p-4">
          <div className="max-w-4xl mx-auto flex items-center space-x-2">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2 flex-1">
                <Input
                  ref={titleInputRef}
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  className="flex-1 text-lg font-semibold"
                  placeholder="Enter chat title..."
                  disabled={isUpdatingSession}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveTitle}
                  disabled={isUpdatingSession || !editTitleValue.trim()}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEditingTitle}
                  disabled={isUpdatingSession}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 flex-1 group">
                <h1 className="text-lg font-semibold text-foreground flex-1 truncate">
                  {displayTitle}
                </h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startEditingTitle}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                  title="Edit chat title"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 custom-scrollbar">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className={`flex space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'gradient-primary' 
                    : 'bg-accent border border-border'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-accent-foreground" />
                  )}
                </div>

                {/* Message Content */}
                <Card className={`p-4 shadow-message ${
                  message.type === 'user' 
                    ? 'message-user' 
                    : 'message-assistant'
                }`}>
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed">
                      {message.content}
                    </p>

                    {/* Message metadata */}
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.confidence && (
                        <span className="flex items-center space-x-1">
                          <span>Confidence:</span>
                          <span className="font-medium">
                            {Math.round(message.confidence * 100)}%
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium mb-2 opacity-80">Sources:</p>
                        {message.sources.map((source, index) => (
                          <div key={index} className="text-xs bg-accent/30 p-2 rounded border">
                            <div className="font-medium">Page {source.pageNumber}</div>
                            <div className="opacity-80 mt-1">{source.excerpt}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex space-x-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
                <Card className="message-assistant p-4 shadow-message">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-typing"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card-elevated p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFileUpload}
              className="flex-shrink-0 hover:bg-accent-hover transition-smooth"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about your documents or legal matters..."
                className="pr-12 transition-smooth focus:ring-2 focus:ring-primary/20 focus:border-input-focus"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1 h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-smooth"
                disabled={!inputValue.trim() || isTyping || !isConnected}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />

          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              {!isConnected && (
                <span className="text-red-500">• Disconnected</span>
              )}
              {isConnected && (
                <span className="text-green-500">• Connected</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-3 h-3" />
              <span>{isUploading ? 'Uploading...' : 'Ready for document upload'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;