import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Document } from "@/services/api";
import DocumentPicker from "@/components/DocumentPicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageCircle,
  FileText,
  Plus,
  Scale,
  Settings,
  LogOut,
  User,
  Shield,
  BarChart3,
  Users,
  Trash2,
  MessageSquare,
  FileCheck,
  ChevronDown
} from "lucide-react";

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { toast } = useToast();
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  // Get actual chat sessions
  const { sessions, createSession, isCreatingSession, refetchSessions, deleteSession, isDeletingSession } = useChat();

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-r-2 border-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Handle creating a new chat
  const handleNewChat = async () => {
    if (isCreatingSession) return;

    try {
      console.log('Creating new chat session...');
      const newSession = await createSession({ title: 'New Chat' });
      console.log('New session created:', newSession);

      // Navigate to the chat page immediately
      navigate('/');

      // Store the new session ID for the ChatInterface to pick up
      localStorage.setItem('currentChatSessionId', newSession.id.toString());

      // Refresh sessions list to ensure the new session appears in sidebar
      console.log('Refreshing sessions list...');
      await refetchSessions();

      // Use a custom event to notify ChatInterface about the new session
      const event = new CustomEvent('newChatCreated', {
        detail: { sessionId: newSession.id }
      });
      window.dispatchEvent(event);
      console.log('Dispatched newChatCreated event for session:', newSession.id);

    } catch (error) {
      console.error('Failed to create new chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle creating a new chat with a document
  const handleNewChatWithDocument = async (document: Document) => {
    if (isCreatingSession) return;

    try {
      console.log('Creating new document chat session with document:', document.id);
      const title = `Chat: ${document.title || document.original_filename}`;
      const newSession = await createSession({ title, documentId: document.id });
      console.log('New document session created:', newSession);

      // Navigate to the chat page immediately
      navigate('/');

      // Store the new session ID for the ChatInterface to pick up
      localStorage.setItem('currentChatSessionId', newSession.id.toString());

      // Refresh sessions list to ensure the new session appears in sidebar
      console.log('Refreshing sessions list...');
      await refetchSessions();

      // Use a custom event to notify ChatInterface about the new session
      const event = new CustomEvent('newChatCreated', {
        detail: { sessionId: newSession.id }
      });
      window.dispatchEvent(event);
      console.log('Dispatched newChatCreated event for document session:', newSession.id);

      toast({
        title: "Success",
        description: `Started new chat with ${document.title || document.original_filename}`,
      });

    } catch (error) {
      console.error('Failed to create document chat:', error);
      toast({
        title: "Error",
        description: "Failed to create document chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle clicking on a chat session
  const handleChatClick = (sessionId: number) => {
    // Navigate to chat page and set the session
    navigate('/');
    localStorage.setItem('currentChatSessionId', sessionId.toString());
    // Use a custom event to notify ChatInterface instead of reload
    window.dispatchEvent(new CustomEvent('chatSessionChanged', {
      detail: { sessionId }
    }));
  };

  // Handle deleting a chat session - show confirmation first
  const handleDeleteChat = (sessionId: number, event: React.MouseEvent) => {
    // Prevent the click from propagating to the chat click handler
    event.stopPropagation();
    setSessionToDelete(sessionId);
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    if (!sessionToDelete || isDeletingSession) return;

    try {
      await deleteSession(sessionToDelete);

      toast({
        title: "Success",
        description: "Chat deleted successfully!",
      });

      // If the deleted chat was the current one, navigate to home and clear current session
      const currentSessionId = localStorage.getItem('currentChatSessionId');
      if (currentSessionId === sessionToDelete.toString()) {
        localStorage.removeItem('currentChatSessionId');
        navigate('/');
        // Notify ChatInterface to clear the current session
        window.dispatchEvent(new CustomEvent('chatSessionChanged', {
          detail: { sessionId: null }
        }));
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      // Error toast is already handled by the mutation
    } finally {
      setSessionToDelete(null);
    }
  };

  return (
    <Sidebar 
      className={`${collapsed ? "w-14" : "w-80"} border-r border-sidebar-border bg-sidebar transition-all duration-300`}
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Legal AI</h2>
              <p className="text-xs text-sidebar-foreground/70">Enterprise System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        {/* New Chat Button */}
        <div className="p-4">
          {collapsed ? (
            <Button
              onClick={handleNewChat}
              disabled={isCreatingSession}
              className="w-full gradient-primary hover:shadow-gold transition-spring"
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isCreatingSession}
                  className="w-full gradient-primary hover:shadow-gold transition-spring justify-between"
                >
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    <span>{isCreatingSession ? 'Creating...' : 'New Chat'}</span>
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleNewChat} disabled={isCreatingSession}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  General Chat
                </DropdownMenuItem>
                <DocumentPicker
                  onSelectDocument={handleNewChatWithDocument}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={isCreatingSession}>
                      <FileCheck className="w-4 h-4 mr-2" />
                      Chat with Document
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className={getNavCls(isActive("/"))}>
                    <MessageCircle className="w-4 h-4" />
                    {!collapsed && <span>Chat</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/documents" className={getNavCls(isActive("/documents"))}>
                    <FileText className="w-4 h-4" />
                    {!collapsed && <span>Documents</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin" className={getNavCls(isActive("/admin"))}>
                    <Shield className="w-4 h-4" />
                    {!collapsed && <span>Admin</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin/analytics" className={getNavCls(isActive("/admin/analytics"))}>
                    <BarChart3 className="w-4 h-4" />
                    {!collapsed && <span>Analytics</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats */}
        {!collapsed && (
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-[400px] custom-scrollbar">
                <div className="space-y-1 p-2">
                  {sessions.length === 0 ? (
                    <div className="p-3 text-center text-sm text-sidebar-foreground/50">
                      No chats yet. Create your first chat to get started!
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleChatClick(session.id)}
                        className="p-3 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-smooth group relative"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 flex flex-col items-center mt-1">
                            {/* Chat type icon */}
                            <div className={`w-6 h-6 rounded flex items-center justify-center mb-1 ${
                              session.session_type === 'document' || session.document_id
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {session.session_type === 'document' || session.document_id ? (
                                <FileCheck className="w-3 h-3" />
                              ) : (
                                <MessageSquare className="w-3 h-3" />
                              )}
                            </div>
                            {/* Status dot */}
                            <div className={`w-2 h-2 rounded-full ${
                              session.message_count > 0 ? 'bg-primary' : 'bg-sidebar-foreground/30'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium text-sidebar-foreground truncate">
                                {session.title}
                              </h4>
                              {(session.session_type === 'document' || session.document_id) && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                  Doc
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-sidebar-foreground/70 truncate mt-1">
                              {session.message_count === 0
                                ? 'No messages yet'
                                : `${session.message_count} message${session.message_count === 1 ? '' : 's'}`
                              }
                            </p>
                            <p className="text-xs text-sidebar-foreground/50 mt-2">
                              {formatTimeAgo(session.created_at)}
                            </p>
                          </div>
                          {/* Delete button - only visible on hover */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(event) => handleDeleteChat(session.id, event)}
                            disabled={isDeletingSession}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/profile" className={getNavCls(isActive("/profile"))}>
                <User className="w-4 h-4" />
                {!collapsed && <span>Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button className="w-full text-sidebar-foreground hover:bg-sidebar-accent/50 transition-smooth">
                <LogOut className="w-4 h-4" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Confirmation Dialog for Chat Deletion */}
      <AlertDialog open={sessionToDelete !== null} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingSession}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingSession ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
};

export default AppSidebar;