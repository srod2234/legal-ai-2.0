"""Firm models for multi-tenant enterprise support."""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from sqlmodel import SQLModel, Field as SQLField, Relationship


class SubscriptionTier(str, Enum):
    """Subscription tier enumeration for enterprise licensing."""
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"


class LicenseType(str, Enum):
    """License type enumeration."""
    STANDARD = "standard"
    PREMIUM = "premium"
    PLATINUM = "platinum"


class Firm(SQLModel, table=True):
    """Firm database model for multi-tenant support."""

    id: Optional[int] = SQLField(default=None, primary_key=True)
    firm_name: str = SQLField(max_length=255, index=True)
    firm_code: str = SQLField(max_length=50, unique=True, index=True)

    # Subscription and licensing
    subscription_tier: SubscriptionTier = SQLField(default=SubscriptionTier.BASIC)
    license_type: LicenseType = SQLField(default=LicenseType.STANDARD)
    license_key: Optional[str] = SQLField(default=None, max_length=100)
    license_expires_at: Optional[datetime] = SQLField(default=None)

    # Resource limits
    max_users: int = SQLField(default=10)
    max_documents: int = SQLField(default=1000)
    max_storage_gb: int = SQLField(default=50)

    # Feature flags
    enable_risk_analysis: bool = SQLField(default=True)
    enable_case_research: bool = SQLField(default=True)
    enable_predictive_analytics: bool = SQLField(default=False)
    enable_practice_modules: bool = SQLField(default=False)

    # Contact information
    primary_contact_name: Optional[str] = SQLField(default=None, max_length=255)
    primary_contact_email: Optional[str] = SQLField(default=None, max_length=255)
    primary_contact_phone: Optional[str] = SQLField(default=None, max_length=20)

    # Billing information
    billing_address: Optional[str] = SQLField(default=None, max_length=500)
    billing_city: Optional[str] = SQLField(default=None, max_length=100)
    billing_state: Optional[str] = SQLField(default=None, max_length=50)
    billing_zip: Optional[str] = SQLField(default=None, max_length=20)
    billing_country: Optional[str] = SQLField(default=None, max_length=100)

    # Status and audit
    is_active: bool = SQLField(default=True)
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    activated_at: Optional[datetime] = SQLField(default=None)
    suspended_at: Optional[datetime] = SQLField(default=None)

    # Customization
    custom_branding: Optional[str] = SQLField(default=None)  # JSON string for branding
    custom_settings: Optional[str] = SQLField(default=None)  # JSON string for settings

    # Usage tracking
    current_user_count: int = SQLField(default=0)
    current_document_count: int = SQLField(default=0)
    current_storage_gb: float = SQLField(default=0.0)

    # Maintenance and support
    maintenance_contract: bool = SQLField(default=False)
    maintenance_expires_at: Optional[datetime] = SQLField(default=None)
    support_level: str = SQLField(default="standard", max_length=50)

    # Relationships (will be populated by other models)
    # users: List["User"] = Relationship(back_populates="firm")
    # documents: List["Document"] = Relationship(back_populates="firm")


# Pydantic schemas for API requests/responses

class FirmBase(BaseModel):
    """Base firm schema."""
    firm_name: str
    firm_code: str
    subscription_tier: SubscriptionTier = SubscriptionTier.BASIC
    license_type: LicenseType = LicenseType.STANDARD
    max_users: int = 10
    max_documents: int = 1000
    max_storage_gb: int = 50
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None


class FirmCreate(FirmBase):
    """Schema for creating a new firm."""
    license_expires_at: Optional[datetime] = None
    enable_risk_analysis: bool = True
    enable_case_research: bool = True
    enable_predictive_analytics: bool = False
    enable_practice_modules: bool = False

    @validator('firm_code')
    def validate_firm_code(cls, v):
        """Validate firm code format."""
        if not v.isalnum():
            raise ValueError('Firm code must be alphanumeric')
        if len(v) < 3 or len(v) > 50:
            raise ValueError('Firm code must be between 3 and 50 characters')
        return v.upper()


class FirmUpdate(BaseModel):
    """Schema for updating firm information."""
    firm_name: Optional[str] = None
    subscription_tier: Optional[SubscriptionTier] = None
    license_type: Optional[LicenseType] = None
    max_users: Optional[int] = None
    max_documents: Optional[int] = None
    max_storage_gb: Optional[int] = None
    enable_risk_analysis: Optional[bool] = None
    enable_case_research: Optional[bool] = None
    enable_predictive_analytics: Optional[bool] = None
    enable_practice_modules: Optional[bool] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_zip: Optional[str] = None
    billing_country: Optional[str] = None
    is_active: Optional[bool] = None


class FirmResponse(FirmBase):
    """Schema for firm response."""
    id: int
    license_key: Optional[str] = None
    license_expires_at: Optional[datetime] = None
    enable_risk_analysis: bool
    enable_case_research: bool
    enable_predictive_analytics: bool
    enable_practice_modules: bool
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_zip: Optional[str] = None
    billing_country: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None
    current_user_count: int
    current_document_count: int
    current_storage_gb: float
    maintenance_contract: bool
    maintenance_expires_at: Optional[datetime] = None
    support_level: str

    class Config:
        from_attributes = True


class FirmListResponse(BaseModel):
    """Schema for firm list response."""
    firms: List[FirmResponse]
    total: int
    page: int
    per_page: int


class FirmStats(BaseModel):
    """Schema for firm statistics and usage metrics."""
    firm_id: int
    firm_name: str
    user_count: int
    document_count: int
    storage_used_gb: float
    storage_limit_gb: int
    user_limit: int
    document_limit: int
    users_percentage: float
    documents_percentage: float
    storage_percentage: float
    risk_assessments_count: int
    case_research_queries: int
    predictive_analyses_count: int
    active_users_30_days: int
    documents_uploaded_30_days: int
    license_days_remaining: Optional[int] = None


class FirmUsageReport(BaseModel):
    """Schema for detailed firm usage report."""
    firm_id: int
    firm_name: str
    reporting_period_start: datetime
    reporting_period_end: datetime
    total_users: int
    active_users: int
    total_documents: int
    documents_processed: int
    risk_assessments_run: int
    case_searches_performed: int
    predictions_generated: int
    storage_used_gb: float
    api_calls_count: int
    average_response_time_ms: float
    error_rate_percentage: float
    user_satisfaction_score: Optional[float] = None


class FirmConfiguration(BaseModel):
    """Schema for firm-specific configuration."""
    firm_id: int
    risk_scoring_weights: dict = {}
    practice_area_settings: dict = {}
    custom_workflows: dict = {}
    integration_settings: dict = {}
    notification_preferences: dict = {}
    security_settings: dict = {}


class FirmLicenseInfo(BaseModel):
    """Schema for firm license information."""
    firm_id: int
    firm_name: str
    license_type: LicenseType
    license_key: str
    subscription_tier: SubscriptionTier
    is_active: bool
    is_expired: bool
    days_until_expiration: Optional[int] = None
    license_issued_at: datetime
    license_expires_at: Optional[datetime] = None
    maintenance_contract: bool
    maintenance_expires_at: Optional[datetime] = None
    features_enabled: dict
    usage_limits: dict
    current_usage: dict
