"""Document models and schemas."""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pathlib import Path
from pydantic import BaseModel, Field, validator
from sqlmodel import SQLModel, Field as SQLField, Relationship


class ProcessingStatus(str, Enum):
    """Document processing status enumeration."""
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    OCR_PROCESSING = "ocr_processing"
    EMBEDDING = "embedding"
    READY = "ready"
    FAILED = "failed"
    DELETED = "deleted"


class DocumentType(str, Enum):
    """Document type enumeration based on content analysis."""
    CONTRACT = "contract"
    LEGAL_BRIEF = "legal_brief"
    COURT_FILING = "court_filing"
    MEMO = "memo"
    RESEARCH = "research"
    OTHER = "other"


class Document(SQLModel, table=True):
    """Document database model."""
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    filename: str = SQLField(max_length=255, index=True)
    original_filename: str = SQLField(max_length=255)
    file_path: str = SQLField(max_length=500)
    file_size: int = SQLField()  # Size in bytes
    content_type: str = SQLField(max_length=100)
    file_hash: str = SQLField(max_length=64, index=True)  # SHA-256 hash for deduplication
    
    # User relationship
    user_id: int = SQLField(foreign_key="user.id", index=True)
    # user: Optional["User"] = Relationship(back_populates="documents")
    
    # Processing status
    processing_status: ProcessingStatus = SQLField(default=ProcessingStatus.UPLOADING, index=True)
    processing_error: Optional[str] = SQLField(default=None, max_length=1000)
    processing_started_at: Optional[datetime] = SQLField(default=None)
    processing_completed_at: Optional[datetime] = SQLField(default=None)
    
    # Content extraction
    extracted_text: Optional[str] = SQLField(default=None)
    page_count: Optional[int] = SQLField(default=None)
    word_count: Optional[int] = SQLField(default=None)
    language: Optional[str] = SQLField(default=None, max_length=10)
    
    # Document classification
    document_type: Optional[DocumentType] = SQLField(default=None)
    confidence_score: Optional[float] = SQLField(default=None)  # AI classification confidence
    
    # Vector database
    chroma_collection_id: Optional[str] = SQLField(default=None, max_length=100)
    embedding_status: Optional[str] = SQLField(default=None, max_length=50)
    chunk_count: Optional[int] = SQLField(default=None)
    
    # OCR information
    has_ocr: bool = SQLField(default=False)
    ocr_confidence: Optional[float] = SQLField(default=None)
    ocr_language: Optional[str] = SQLField(default=None, max_length=10)
    
    # Metadata
    title: Optional[str] = SQLField(default=None, max_length=500)
    description: Optional[str] = SQLField(default=None, max_length=1000)
    tags: Optional[str] = SQLField(default=None, max_length=500)  # JSON string of tags
    
    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    last_accessed: Optional[datetime] = SQLField(default=None)
    access_count: int = SQLField(default=0)
    
    # Security and compliance
    is_confidential: bool = SQLField(default=True)
    retention_date: Optional[datetime] = SQLField(default=None)
    legal_hold: bool = SQLField(default=False)


# Pydantic schemas for API requests/responses

class DocumentBase(BaseModel):
    """Base document schema."""
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    is_confidential: bool = True


class DocumentCreate(DocumentBase):
    """Schema for creating a document."""
    pass


class DocumentUpdate(DocumentBase):
    """Schema for updating document metadata."""
    document_type: Optional[DocumentType] = None


class DocumentResponse(DocumentBase):
    """Schema for document response."""
    id: int
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    user_id: int
    processing_status: ProcessingStatus
    processing_error: Optional[str] = None
    document_type: Optional[DocumentType] = None
    confidence_score: Optional[float] = None
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    language: Optional[str] = None
    has_ocr: bool = False
    ocr_confidence: Optional[float] = None
    chunk_count: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_accessed: Optional[datetime] = None
    access_count: int = 0
    legal_hold: bool = False
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema for document list response."""
    documents: List[DocumentResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response."""
    document_id: int
    filename: str
    processing_status: ProcessingStatus
    message: str


class DocumentProcessingStatus(BaseModel):
    """Schema for document processing status."""
    document_id: int
    status: ProcessingStatus
    progress_percentage: Optional[float] = None
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    estimated_completion: Optional[datetime] = None


class DocumentSearchRequest(BaseModel):
    """Schema for document search request."""
    query: Optional[str] = None
    document_type: Optional[DocumentType] = None
    tags: Optional[List[str]] = []
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    user_id: Optional[int] = None
    processing_status: Optional[ProcessingStatus] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")
    
    @validator('sort_by')
    def validate_sort_by(cls, v):
        """Validate sort_by field."""
        allowed_fields = [
            "created_at", "updated_at", "filename", "file_size", 
            "processing_status", "document_type", "last_accessed"
        ]
        if v not in allowed_fields:
            raise ValueError(f"sort_by must be one of: {allowed_fields}")
        return v
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        """Validate sort_order field."""
        if v not in ["asc", "desc"]:
            raise ValueError("sort_order must be 'asc' or 'desc'")
        return v


class DocumentSource(BaseModel):
    """Schema for document source in chat responses."""
    document_id: int
    document_title: str
    filename: str
    page_number: Optional[int] = None
    chunk_id: Optional[str] = None
    excerpt: str
    confidence_score: float
    relevance_score: Optional[float] = None


class DocumentChunk(BaseModel):
    """Schema for document chunk information."""
    chunk_id: str
    document_id: int
    content: str
    page_number: Optional[int] = None
    chunk_index: int
    token_count: int
    embedding_vector: Optional[List[float]] = None
    metadata: Dict[str, Any] = {}


class DocumentStats(BaseModel):
    """Schema for document statistics."""
    total_documents: int
    documents_by_status: Dict[ProcessingStatus, int]
    documents_by_type: Dict[DocumentType, int]
    total_file_size: int  # in bytes
    avg_processing_time: Optional[float] = None  # in seconds
    documents_today: int
    documents_this_week: int
    documents_this_month: int
    most_active_users: List[Dict[str, Any]] = []


class DocumentAnalytics(BaseModel):
    """Schema for document analytics."""
    document_id: int
    view_count: int
    download_count: int
    search_mentions: int
    chat_references: int
    last_accessed: Optional[datetime] = None
    popular_chunks: List[str] = []
    related_documents: List[int] = []


class BulkDocumentOperation(BaseModel):
    """Schema for bulk document operations."""
    document_ids: List[int]
    operation: str  # delete, update_status, add_tags, etc.
    parameters: Dict[str, Any] = {}


class DocumentExportRequest(BaseModel):
    """Schema for document export request."""
    document_ids: List[int]
    export_format: str = Field(default="pdf")  # pdf, docx, txt, json
    include_metadata: bool = True
    include_extracted_text: bool = False
    
    @validator('export_format')
    def validate_export_format(cls, v):
        """Validate export format."""
        allowed_formats = ["pdf", "docx", "txt", "json"]
        if v not in allowed_formats:
            raise ValueError(f"export_format must be one of: {allowed_formats}")
        return v