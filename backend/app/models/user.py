"""User models and schemas for authentication."""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from sqlmodel import SQLModel, Field as SQLField, Relationship


class UserRole(str, Enum):
    """User role enumeration."""
    STANDARD = "standard"
    ADMIN = "admin"
    # LEGAL 3.0 ADDITIONS
    PARTNER = "partner"
    SENIOR_ASSOCIATE = "senior_associate"
    ASSOCIATE = "associate"
    PARALEGAL = "paralegal"
    FIRM_ADMIN = "firm_admin"
    ANALYST = "analyst"


class User(SQLModel, table=True):
    """User database model."""
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    email: str = SQLField(unique=True, index=True, max_length=255)
    hashed_password: str = SQLField(max_length=255)
    full_name: str = SQLField(max_length=255)
    role: UserRole = SQLField(default=UserRole.STANDARD)
    is_active: bool = SQLField(default=True)
    
    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = SQLField(default=None)
    last_login: Optional[datetime] = SQLField(default=None)
    
    # Profile information
    phone: Optional[str] = SQLField(default=None, max_length=20)
    department: Optional[str] = SQLField(default=None, max_length=100)
    job_title: Optional[str] = SQLField(default=None, max_length=100)
    
    # Security settings
    password_changed_at: Optional[datetime] = SQLField(default=None)
    failed_login_attempts: int = SQLField(default=0)
    locked_until: Optional[datetime] = SQLField(default=None)
    
    # Preferences
    timezone: str = SQLField(default="UTC", max_length=50)
    language: str = SQLField(default="en", max_length=10)
    theme: str = SQLField(default="light", max_length=20)

    # ===== LEGAL 3.0 ADDITIONS =====

    # Firm relationship (multi-tenancy)
    firm_id: Optional[int] = SQLField(default=None, foreign_key="firm.id", index=True)

    # Enhanced roles and permissions
    permissions: Optional[str] = SQLField(default=None)  # JSON object with permissions
    practice_areas: Optional[str] = SQLField(default=None)  # JSON array of practice areas

    # Attorney-specific fields
    bar_number: Optional[str] = SQLField(default=None, max_length=50)
    bar_state: Optional[str] = SQLField(default=None, max_length=50)
    bar_admission_date: Optional[datetime] = SQLField(default=None)
    specializations: Optional[str] = SQLField(default=None)  # JSON array

    # Activity tracking
    documents_reviewed: int = SQLField(default=0)
    risk_assessments_reviewed: int = SQLField(default=0)
    cases_researched: int = SQLField(default=0)
    predictions_validated: int = SQLField(default=0)

    # Usage statistics
    last_document_upload: Optional[datetime] = SQLField(default=None)
    last_risk_analysis: Optional[datetime] = SQLField(default=None)
    last_case_search: Optional[datetime] = SQLField(default=None)
    api_calls_count: int = SQLField(default=0)

    # Access level
    can_access_analytics: bool = SQLField(default=False)
    can_validate_predictions: bool = SQLField(default=False)
    can_approve_contracts: bool = SQLField(default=False)
    can_manage_firm: bool = SQLField(default=False)

    # Notifications and alerts
    email_notifications: bool = SQLField(default=True)
    high_risk_alerts: bool = SQLField(default=True)
    case_update_alerts: bool = SQLField(default=True)

    # Relationships (will be defined when other models are created)
    # firm: Optional["Firm"] = Relationship(back_populates="users")
    # documents: List["Document"] = Relationship(back_populates="user")
    # chat_sessions: List["ChatSession"] = Relationship(back_populates="user")


# Pydantic schemas for API requests/responses

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    timezone: str = "UTC"
    language: str = "en"
    theme: str = "light"


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.STANDARD
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one digit, one letter, and one special character
        has_digit = any(c.isdigit() for c in v)
        has_letter = any(c.isalpha() for c in v)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v)
        
        if not (has_digit and has_letter and has_special):
            raise ValueError('Password must contain at least one digit, one letter, and one special character')
        
        return v


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None


class UserUpdateAdmin(UserUpdate):
    """Schema for admin user updates (includes role and status)."""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class PasswordUpdate(BaseModel):
    """Schema for password updates."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        has_digit = any(c.isdigit() for c in v)
        has_letter = any(c.isalpha() for c in v)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v)
        
        if not (has_digit and has_letter and has_special):
            raise ValueError('Password must contain at least one digit, one letter, and one special character')
        
        return v


class UserResponse(UserBase):
    """Schema for user response (excludes sensitive information)."""
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for user list response."""
    users: List[UserResponse]
    total: int
    page: int
    per_page: int


# Authentication schemas

class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str
    remember_me: bool = False


class LoginResponse(BaseModel):
    """Schema for login response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        has_digit = any(c.isdigit() for c in v)
        has_letter = any(c.isalpha() for c in v)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v)
        
        if not (has_digit and has_letter and has_special):
            raise ValueError('Password must contain at least one digit, one letter, and one special character')
        
        return v


# User activity and audit schemas

class UserActivity(BaseModel):
    """Schema for user activity tracking."""
    user_id: int
    action: str
    resource: Optional[str] = None
    resource_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    details: Optional[dict] = None


class UserStats(BaseModel):
    """Schema for user statistics."""
    total_users: int
    active_users: int
    admin_users: int
    standard_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int