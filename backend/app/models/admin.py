"""Admin models and schemas for system management."""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlmodel import SQLModel, Field as SQLField, JSON


class AuditAction(str, Enum):
    """Audit action enumeration."""
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    UPLOAD = "upload"
    DOWNLOAD = "download"
    SEARCH = "search"
    CHAT = "chat"
    ADMIN_ACTION = "admin_action"
    SECURITY_EVENT = "security_event"


class AuditLog(SQLModel, table=True):
    """Audit log database model for compliance tracking."""
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    
    # User information
    user_id: Optional[int] = SQLField(foreign_key="user.id", index=True)
    user_email: Optional[str] = SQLField(max_length=255, index=True)
    user_role: Optional[str] = SQLField(max_length=50)
    
    # Action details
    action: AuditAction = SQLField(index=True)
    resource_type: Optional[str] = SQLField(max_length=100, index=True)  # document, chat, user, etc.
    resource_id: Optional[str] = SQLField(max_length=100, index=True)
    description: str = SQLField(max_length=1000)
    
    # Request details
    ip_address: Optional[str] = SQLField(max_length=45, index=True)  # IPv6 compatible
    user_agent: Optional[str] = SQLField(max_length=500)
    request_method: Optional[str] = SQLField(max_length=10)
    request_path: Optional[str] = SQLField(max_length=500)
    
    # Response details
    status_code: Optional[int] = SQLField(index=True)
    response_time_ms: Optional[int] = SQLField()
    
    # Additional context
    extra_data: Optional[str] = SQLField(default=None, max_length=2000)  # Store as JSON string
    
    # Compliance fields
    timestamp: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    session_id: Optional[str] = SQLField(max_length=255, index=True)
    correlation_id: Optional[str] = SQLField(max_length=255, index=True)
    
    # Security fields
    risk_level: Optional[str] = SQLField(default="low", max_length=20, index=True)  # low, medium, high, critical
    is_sensitive: bool = SQLField(default=False, index=True)
    retention_date: Optional[datetime] = SQLField(index=True)


class SystemMetrics(SQLModel, table=True):
    """System metrics for monitoring and analytics."""
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    
    # Metric identification
    metric_name: str = SQLField(max_length=100, index=True)
    metric_type: str = SQLField(max_length=50, index=True)  # counter, gauge, histogram
    
    # Metric values
    value: float = SQLField()
    unit: Optional[str] = SQLField(max_length=50)
    
    # Context
    tags: Optional[str] = SQLField(default=None, max_length=1000)  # Store as JSON string
    context_data: Optional[str] = SQLField(default=None, max_length=2000)  # Store as JSON string
    
    # Timestamp
    timestamp: datetime = SQLField(default_factory=datetime.utcnow, index=True)


class SystemAlert(SQLModel, table=True):
    """System alerts for monitoring and notifications."""
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    
    # Alert details
    alert_type: str = SQLField(max_length=100, index=True)
    severity: str = SQLField(max_length=20, index=True)  # info, warning, error, critical
    title: str = SQLField(max_length=255)
    description: str = SQLField(max_length=1000)
    
    # Status
    is_active: bool = SQLField(default=True, index=True)
    is_acknowledged: bool = SQLField(default=False, index=True)
    acknowledged_by: Optional[int] = SQLField(foreign_key="user.id", default=None)
    acknowledged_at: Optional[datetime] = SQLField(default=None)
    
    # Resolution
    is_resolved: bool = SQLField(default=False, index=True)
    resolved_by: Optional[int] = SQLField(foreign_key="user.id", default=None)
    resolved_at: Optional[datetime] = SQLField(default=None)
    resolution_notes: Optional[str] = SQLField(max_length=1000)
    
    # Context
    source: Optional[str] = SQLField(max_length=100)  # system, user, external
    affected_resource: Optional[str] = SQLField(max_length=255)
    alert_data: Optional[str] = SQLField(default=None, max_length=2000)  # Store as JSON string
    
    # Timestamps
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)


# Pydantic schemas for API requests/responses

class AuditLogBase(BaseModel):
    """Base audit log schema."""
    action: AuditAction
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    context_data: Optional[str] = None  # Store as JSON string


class AuditLogCreate(AuditLogBase):
    """Schema for creating audit log entries."""
    pass


class AuditLogResponse(AuditLogBase):
    """Schema for audit log response."""
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    timestamp: datetime
    session_id: Optional[str] = None
    risk_level: Optional[str] = None
    is_sensitive: bool = False
    
    class Config:
        from_attributes = True


class AuditLogSearchRequest(BaseModel):
    """Schema for audit log search."""
    user_id: Optional[int] = None
    action: Optional[AuditAction] = None
    resource_type: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    ip_address: Optional[str] = None
    risk_level: Optional[str] = None
    is_sensitive: Optional[bool] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=50, ge=1, le=1000)
    sort_by: str = Field(default="timestamp")
    sort_order: str = Field(default="desc")


class AuditLogListResponse(BaseModel):
    """Schema for audit log list response."""
    logs: List[AuditLogResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class AICostMetrics(BaseModel):
    """Schema for AI cost tracking."""
    total_cost_today: float
    total_cost_this_month: float
    cost_per_message: float
    cost_per_user: float
    tokens_used_today: int
    tokens_used_this_month: int
    cost_trend_percent: float  # percentage change from last period


class SystemStats(BaseModel):
    """Schema for system statistics."""
    # Core business metrics
    total_users: int
    active_users: int
    new_users_today: int
    user_engagement_score: float  # average sessions per user

    # Document metrics
    total_documents: int
    documents_processed_today: int
    document_processing_success_rate: float
    avg_documents_per_user: float

    # Chat & AI metrics
    total_chat_sessions: int
    messages_today: int
    ai_cost_metrics: AICostMetrics

    # System performance summary
    system_uptime_hours: float
    overall_system_status: str  # "healthy", "degraded", "unhealthy"

    # Security summary
    security_risk_level: str  # "low", "medium", "high"
    failed_logins_today: int
    active_sessions: int


class UserActivity(BaseModel):
    """Schema for user activity summary."""
    user_id: int
    user_email: str
    last_login: Optional[datetime] = None
    login_count_today: int
    documents_uploaded: int
    chat_messages_sent: int
    last_activity: Optional[datetime] = None
    risk_score: float = 0.0


class SystemHealth(BaseModel):
    """Schema for system health check."""
    status: str  # healthy, degraded, unhealthy
    components: Dict[str, Dict[str, Any]]
    timestamp: datetime
    uptime_seconds: float
    version: str


class SecuritySummary(BaseModel):
    """Schema for security summary."""
    total_audit_logs: int
    high_risk_events: int
    failed_logins_24h: int
    suspicious_ips: List[str]
    active_sessions: int
    recent_admin_actions: List[AuditLogResponse]
    security_alerts: int


class PerformanceMetrics(BaseModel):
    """Schema for performance metrics."""
    # Core performance (user-facing)
    avg_response_time_ms: float
    total_requests_24h: int
    error_rate_percent: float
    document_processing_avg_time: float
    document_processing_success_rate: float
    chat_response_avg_time: float

    # Technical details (for expandable section)
    database_query_avg_time: float
    vector_search_avg_time: float
    cache_hit_rate_percent: float

    # Overall system performance indicator
    system_performance_status: str  # "good", "fair", "poor"


class UsageAnalytics(BaseModel):
    """Schema for usage analytics."""
    daily_active_users: List[Dict[str, Any]]
    document_upload_trends: List[Dict[str, Any]]
    chat_usage_trends: List[Dict[str, Any]]
    popular_document_types: List[Dict[str, Any]]
    top_search_queries: List[Dict[str, Any]]
    user_engagement_scores: List[Dict[str, Any]]


class AdminDashboardData(BaseModel):
    """Schema for admin dashboard data."""
    system_stats: SystemStats
    system_health: SystemHealth
    security_summary: SecuritySummary
    performance_metrics: PerformanceMetrics
    recent_activities: List[UserActivity]
    recent_alerts: List[Dict[str, Any]]
    user_activity_trends: List[Dict[str, Any]]
    document_type_distribution: List[Dict[str, Any]]


class SystemConfigUpdate(BaseModel):
    """Schema for system configuration updates."""
    config_key: str
    config_value: Any
    description: Optional[str] = None


class BulkUserOperation(BaseModel):
    """Schema for bulk user operations."""
    user_ids: List[int]
    operation: str  # activate, deactivate, delete, change_role
    parameters: Dict[str, Any] = {}


class SystemMaintenanceRequest(BaseModel):
    """Schema for system maintenance requests."""
    maintenance_type: str  # backup, cleanup, update, restart
    scheduled_time: Optional[datetime] = None
    description: str
    estimated_duration_minutes: Optional[int] = None
    notify_users: bool = True


class DataExportRequest(BaseModel):
    """Schema for data export requests."""
    export_type: str  # audit_logs, user_data, system_metrics
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    format: str = Field(default="csv")  # csv, json, xlsx
    filters: Dict[str, Any] = {}
    include_sensitive: bool = False