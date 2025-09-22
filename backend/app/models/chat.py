"""Chat models and schemas."""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator
from sqlmodel import SQLModel, Field as SQLField, Relationship, JSON

from app.models.document import DocumentSource


class MessageRole(str, Enum):
    """Message role enumeration."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatSessionType(str, Enum):
    """Chat session type enumeration."""
    GENERAL = "general"  # General chat without document context
    DOCUMENT = "document"  # Chat with specific document context
    MULTI_DOCUMENT = "multi_document"  # Chat with multiple document context


class ChatSession(SQLModel, table=True):
    """Chat session database model."""
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    title: str = SQLField(max_length=500, index=True)
    session_type: ChatSessionType = SQLField(default=ChatSessionType.GENERAL, index=True)
    
    # User relationship
    user_id: int = SQLField(foreign_key="user.id", index=True)
    # user: Optional["User"] = Relationship(back_populates="chat_sessions")
    
    # Document relationship (for document-specific chats)
    document_id: Optional[int] = SQLField(foreign_key="document.id", default=None, index=True)
    # document: Optional["Document"] = Relationship(back_populates="chat_sessions")
    
    # Session metadata
    context_window_size: int = SQLField(default=4096)
    max_tokens: int = SQLField(default=1024)
    temperature: float = SQLField(default=0.1)
    
    # Session state
    is_active: bool = SQLField(default=True, index=True)
    last_message_at: Optional[datetime] = SQLField(default=None, index=True)
    message_count: int = SQLField(default=0)
    
    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    
    # Configuration
    enable_web_search: bool = SQLField(default=False)
    enable_code_execution: bool = SQLField(default=False)
    system_prompt: Optional[str] = SQLField(default=None, max_length=2000)
    
    # Analytics
    total_tokens_used: int = SQLField(default=0)
    estimated_cost: float = SQLField(default=0.0)


class ChatMessage(SQLModel, table=True):
    """Chat message database model."""
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    
    # Session relationship
    session_id: int = SQLField(foreign_key="chatsession.id", index=True)
    # session: Optional["ChatSession"] = Relationship(back_populates="messages")
    
    # Message content
    role: MessageRole = SQLField(index=True)
    content: str = SQLField()
    
    # Message metadata
    message_index: int = SQLField(index=True)  # Order within session
    parent_message_id: Optional[int] = SQLField(foreign_key="chatmessage.id", default=None)
    
    # AI-specific fields
    model_name: Optional[str] = SQLField(default=None, max_length=100)
    tokens_used: Optional[int] = SQLField(default=None)
    response_time_ms: Optional[int] = SQLField(default=None)
    confidence_score: Optional[float] = SQLField(default=None)
    
    # Document sources (JSON field for source references)
    sources: Optional[str] = SQLField(default=None, sa_type=JSON)
    
    # Processing status
    is_streaming: bool = SQLField(default=False)
    is_complete: bool = SQLField(default=True)
    error_message: Optional[str] = SQLField(default=None, max_length=1000)
    
    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    
    # User interaction
    user_rating: Optional[int] = SQLField(default=None)  # 1-5 rating
    user_feedback: Optional[str] = SQLField(default=None, max_length=1000)
    is_flagged: bool = SQLField(default=False)


# Pydantic schemas for API requests/responses

class ChatSessionBase(BaseModel):
    """Base chat session schema."""
    title: str = Field(..., max_length=500)
    session_type: ChatSessionType = ChatSessionType.GENERAL
    document_id: Optional[int] = None
    system_prompt: Optional[str] = Field(None, max_length=2000)
    temperature: float = Field(0.1, ge=0.0, le=2.0)
    max_tokens: int = Field(1024, ge=1, le=4096)


class ChatSessionCreate(ChatSessionBase):
    """Schema for creating a chat session."""
    pass


class ChatSessionUpdate(BaseModel):
    """Schema for updating a chat session."""
    title: Optional[str] = Field(None, max_length=500)
    system_prompt: Optional[str] = Field(None, max_length=2000)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=4096)
    is_active: Optional[bool] = None
    document_id: Optional[int] = None
    session_type: Optional[ChatSessionType] = None


class ChatSessionResponse(ChatSessionBase):
    """Schema for chat session response."""
    id: int
    user_id: int
    is_active: bool
    last_message_at: Optional[datetime] = None
    message_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_tokens_used: int
    estimated_cost: float
    
    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    """Base chat message schema."""
    content: str = Field(..., min_length=1)


class ChatMessageCreate(ChatMessageBase):
    """Schema for creating a chat message."""
    session_id: int
    role: MessageRole = MessageRole.USER


class ChatMessageResponse(ChatMessageBase):
    """Schema for chat message response."""
    id: int
    session_id: int
    role: MessageRole
    message_index: int
    model_name: Optional[str] = None
    tokens_used: Optional[int] = None
    response_time_ms: Optional[int] = None
    confidence_score: Optional[float] = None
    sources: List[DocumentSource] = Field(default_factory=list)
    is_streaming: bool = False
    is_complete: bool = True
    error_message: Optional[str] = None
    created_at: datetime
    user_rating: Optional[int] = None
    user_feedback: Optional[str] = None
    is_flagged: bool = False

    class Config:
        from_attributes = True


class ChatConversationResponse(BaseModel):
    """Schema for chat conversation (session with messages)."""
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]
    has_more: bool = False
    total_messages: int


class ChatStreamResponse(BaseModel):
    """Schema for streaming chat response."""
    session_id: int
    message_id: Optional[int] = None
    content_delta: str = ""
    is_complete: bool = False
    sources: List[DocumentSource] = []
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}


class ChatMessageRating(BaseModel):
    """Schema for rating a chat message."""
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=1000)


class ChatSearchRequest(BaseModel):
    """Schema for searching chat sessions/messages."""
    query: Optional[str] = None
    session_type: Optional[ChatSessionType] = None
    document_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    user_id: Optional[int] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")


class ChatSessionListResponse(BaseModel):
    """Schema for chat session list response."""
    sessions: List[ChatSessionResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class ChatExportRequest(BaseModel):
    """Schema for chat export request."""
    session_ids: List[int]
    export_format: str = Field(default="json")  # json, csv, pdf, txt
    include_sources: bool = True
    include_metadata: bool = False
    
    @validator('export_format')
    def validate_export_format(cls, v):
        """Validate export format."""
        allowed_formats = ["json", "csv", "pdf", "txt"]
        if v not in allowed_formats:
            raise ValueError(f"export_format must be one of: {allowed_formats}")
        return v


class ChatStats(BaseModel):
    """Schema for chat statistics."""
    total_sessions: int
    active_sessions: int
    total_messages: int
    messages_today: int
    messages_this_week: int
    messages_this_month: int
    avg_session_length: float
    avg_response_time_ms: float
    total_tokens_used: int
    estimated_total_cost: float
    popular_document_chats: List[Dict[str, Any]] = []
    user_activity: List[Dict[str, Any]] = []


class WebSocketMessage(BaseModel):
    """Schema for WebSocket messages."""
    type: str  # message, error, status, etc.
    session_id: int
    content: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatAnalytics(BaseModel):
    """Schema for chat analytics."""
    session_id: int
    total_messages: int
    avg_response_time: float
    user_satisfaction: Optional[float] = None  # Based on ratings
    most_referenced_documents: List[int] = []
    conversation_topics: List[str] = []
    token_usage_breakdown: Dict[str, int] = {}


# Helper schemas for complex operations

class BulkChatOperation(BaseModel):
    """Schema for bulk chat operations."""
    session_ids: List[int]
    operation: str  # archive, delete, export, etc.
    parameters: Dict[str, Any] = {}


class ChatContext(BaseModel):
    """Schema for chat context information."""
    session_id: int
    relevant_documents: List[DocumentSource] = []
    conversation_history: List[ChatMessageResponse] = []
    user_preferences: Dict[str, Any] = {}
    system_context: Dict[str, Any] = {}