"""Risk assessment models for contract analysis."""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from sqlmodel import SQLModel, Field as SQLField, Relationship


class AssessmentStatus(str, Enum):
    """Risk assessment status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REQUIRES_REVIEW = "requires_review"


class OverallRiskLevel(str, Enum):
    """Overall risk level for documents."""
    MINIMAL = "minimal"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class RiskAssessment(SQLModel, table=True):
    """Risk assessment database model for contract analysis."""

    id: Optional[int] = SQLField(default=None, primary_key=True)

    # Document relationship
    document_id: int = SQLField(foreign_key="document.id", unique=True, index=True)

    # Assessment metadata
    assessment_status: AssessmentStatus = SQLField(default=AssessmentStatus.PENDING, index=True)
    assessment_date: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    assessment_version: str = SQLField(default="1.0", max_length=20)

    # Overall risk scoring
    overall_risk_score: float = SQLField(index=True)  # 0-10 scale
    overall_risk_level: OverallRiskLevel = SQLField(index=True)
    confidence_score: float = SQLField(default=0.0)  # 0-1 scale

    # Clause-level breakdown
    high_risk_clauses_count: int = SQLField(default=0)
    medium_risk_clauses_count: int = SQLField(default=0)
    low_risk_clauses_count: int = SQLField(default=0)
    total_clauses_analyzed: int = SQLField(default=0)

    # Risk categories (0-10 scale for each)
    termination_risk: Optional[float] = SQLField(default=None)
    liability_risk: Optional[float] = SQLField(default=None)
    compliance_risk: Optional[float] = SQLField(default=None)
    financial_risk: Optional[float] = SQLField(default=None)
    operational_risk: Optional[float] = SQLField(default=None)
    legal_risk: Optional[float] = SQLField(default=None)
    reputational_risk: Optional[float] = SQLField(default=None)

    # Key findings
    critical_issues: Optional[str] = SQLField(default=None)  # JSON array
    risk_factors: Optional[str] = SQLField(default=None)  # JSON array
    recommendations: Optional[str] = SQLField(default=None)  # JSON array
    action_items: Optional[str] = SQLField(default=None)  # JSON array

    # Precedent analysis
    supporting_precedents_count: int = SQLField(default=0)
    opposing_precedents_count: int = SQLField(default=0)
    precedent_confidence: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Industry and jurisdiction context
    industry_benchmark_score: Optional[float] = SQLField(default=None)
    above_industry_average: Optional[bool] = SQLField(default=None)
    jurisdiction: Optional[str] = SQLField(default=None, max_length=100)
    jurisdiction_specific_risks: Optional[str] = SQLField(default=None)  # JSON array

    # Estimated impact
    estimated_financial_exposure: Optional[float] = SQLField(default=None)  # USD
    estimated_financial_exposure_range_low: Optional[float] = SQLField(default=None)
    estimated_financial_exposure_range_high: Optional[float] = SQLField(default=None)
    likelihood_of_dispute: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Processing metadata
    analysis_duration_seconds: Optional[float] = SQLField(default=None)
    model_used: Optional[str] = SQLField(default=None, max_length=50)
    processing_error: Optional[str] = SQLField(default=None)

    # Review status
    requires_attorney_review: bool = SQLField(default=False)
    attorney_reviewed: bool = SQLField(default=False)
    attorney_review_date: Optional[datetime] = SQLField(default=None)
    attorney_override_score: Optional[float] = SQLField(default=None)
    attorney_notes: Optional[str] = SQLField(default=None)

    # Comparison and trending
    risk_trend: Optional[str] = SQLField(default=None, max_length=20)  # increasing, stable, decreasing
    compared_to_previous: Optional[float] = SQLField(default=None)
    similar_documents_avg_risk: Optional[float] = SQLField(default=None)

    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    last_accessed: Optional[datetime] = SQLField(default=None)

    # Relationships
    # document: Optional["Document"] = Relationship(back_populates="risk_assessment")


# Pydantic schemas for API requests/responses

class RiskAssessmentBase(BaseModel):
    """Base risk assessment schema."""
    document_id: int
    overall_risk_score: float = Field(..., ge=0.0, le=10.0)
    overall_risk_level: OverallRiskLevel
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class RiskAssessmentCreate(RiskAssessmentBase):
    """Schema for creating a risk assessment."""
    assessment_version: str = "1.0"
    high_risk_clauses_count: int = 0
    medium_risk_clauses_count: int = 0
    low_risk_clauses_count: int = 0
    critical_issues: Optional[List[str]] = None
    risk_factors: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None


class RiskAssessmentUpdate(BaseModel):
    """Schema for updating risk assessment."""
    overall_risk_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    overall_risk_level: Optional[OverallRiskLevel] = None
    confidence_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    requires_attorney_review: Optional[bool] = None
    attorney_reviewed: Optional[bool] = None
    attorney_override_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    attorney_notes: Optional[str] = None


class RiskAssessmentResponse(RiskAssessmentBase):
    """Schema for risk assessment response."""
    id: int
    assessment_status: AssessmentStatus
    assessment_date: datetime
    assessment_version: str
    high_risk_clauses_count: int
    medium_risk_clauses_count: int
    low_risk_clauses_count: int
    total_clauses_analyzed: int
    termination_risk: Optional[float] = None
    liability_risk: Optional[float] = None
    compliance_risk: Optional[float] = None
    financial_risk: Optional[float] = None
    operational_risk: Optional[float] = None
    legal_risk: Optional[float] = None
    reputational_risk: Optional[float] = None
    critical_issues: List[str] = []
    risk_factors: List[str] = []
    recommendations: List[str] = []
    action_items: List[str] = []
    supporting_precedents_count: int
    opposing_precedents_count: int
    precedent_confidence: Optional[float] = None
    jurisdiction: Optional[str] = None
    jurisdiction_specific_risks: List[str] = []
    estimated_financial_exposure: Optional[float] = None
    estimated_financial_exposure_range_low: Optional[float] = None
    estimated_financial_exposure_range_high: Optional[float] = None
    likelihood_of_dispute: Optional[float] = None
    requires_attorney_review: bool
    attorney_reviewed: bool
    attorney_review_date: Optional[datetime] = None
    attorney_override_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RiskAssessmentSummary(BaseModel):
    """Schema for risk assessment summary."""
    document_id: int
    document_title: str
    overall_risk_score: float
    overall_risk_level: OverallRiskLevel
    high_risk_clauses_count: int
    critical_issues_count: int
    requires_review: bool
    assessment_date: datetime
    confidence_score: float


class RiskAssessmentRequest(BaseModel):
    """Schema for requesting a risk assessment."""
    document_id: int
    jurisdiction: Optional[str] = None
    practice_area: Optional[str] = None
    industry: Optional[str] = None
    priority: str = Field(default="normal")
    include_precedents: bool = Field(default=True)
    include_recommendations: bool = Field(default=True)


class RiskComparisonRequest(BaseModel):
    """Schema for comparing risk assessments."""
    document_ids: List[int] = Field(..., min_items=2, max_items=10)
    comparison_metrics: List[str] = ["overall_risk_score", "clause_counts", "risk_categories"]


class RiskComparisonResponse(BaseModel):
    """Schema for risk comparison response."""
    documents: List[RiskAssessmentSummary]
    comparison_matrix: Dict[str, Any]
    highest_risk_document: int
    lowest_risk_document: int
    average_risk_score: float
    risk_distribution: Dict[str, int]
    common_risk_factors: List[str]
    unique_risks_per_document: Dict[int, List[str]]


class RiskTrendAnalysis(BaseModel):
    """Schema for risk trend analysis."""
    document_id: int
    current_risk_score: float
    historical_scores: List[Dict[str, Any]]
    trend_direction: str  # increasing, stable, decreasing
    trend_percentage: float
    risk_volatility: float
    predicted_future_score: Optional[float] = None
    trend_factors: List[str]


class RiskDashboardMetrics(BaseModel):
    """Schema for risk dashboard metrics."""
    total_assessments: int
    high_risk_documents: int
    medium_risk_documents: int
    low_risk_documents: int
    average_risk_score: float
    assessments_requiring_review: int
    assessments_reviewed: int
    total_critical_issues: int
    most_common_risk_factors: List[Dict[str, Any]]
    risk_by_document_type: Dict[str, float]
    risk_by_jurisdiction: Dict[str, float]
    recent_assessments: List[RiskAssessmentSummary]


class RiskReportRequest(BaseModel):
    """Schema for generating risk reports."""
    document_id: int
    report_format: str = Field(default="pdf")  # pdf, docx, json
    include_clauses: bool = True
    include_precedents: bool = True
    include_recommendations: bool = True
    include_visualizations: bool = True
    executive_summary: bool = True


class RiskReportResponse(BaseModel):
    """Schema for risk report response."""
    document_id: int
    report_url: str
    report_format: str
    generated_at: datetime
    expires_at: Optional[datetime] = None
    file_size_bytes: int
