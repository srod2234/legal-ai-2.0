"""Case precedent models for legal case law integration."""

from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator, HttpUrl
from sqlmodel import SQLModel, Field as SQLField, Relationship


class CaseOutcome(str, Enum):
    """Case outcome enumeration."""
    PLAINTIFF = "plaintiff"
    DEFENDANT = "defendant"
    SETTLEMENT = "settlement"
    DISMISSED = "dismissed"
    MIXED = "mixed"
    PENDING = "pending"
    UNKNOWN = "unknown"


class CourtLevel(str, Enum):
    """Court level enumeration."""
    SUPREME_COURT = "supreme_court"
    APPELLATE = "appellate"
    DISTRICT = "district"
    STATE_SUPREME = "state_supreme"
    STATE_APPELLATE = "state_appellate"
    STATE_TRIAL = "state_trial"
    FEDERAL_CIRCUIT = "federal_circuit"
    BANKRUPTCY = "bankruptcy"
    TAX = "tax"
    OTHER = "other"


class APISource(str, Enum):
    """API source for case data."""
    COURTLISTENER = "courtlistener"
    JUSTIA = "justia"
    MANUAL_ENTRY = "manual_entry"
    OTHER = "other"


class CasePrecedent(SQLModel, table=True):
    """Case precedent database model for storing legal case law."""

    id: Optional[int] = SQLField(default=None, primary_key=True)

    # Case identification
    case_name: str = SQLField(max_length=500, index=True)
    case_number: Optional[str] = SQLField(default=None, max_length=100, index=True)
    citation: str = SQLField(max_length=200, unique=True, index=True)
    citation_normalized: Optional[str] = SQLField(default=None, max_length=200)  # Normalized Bluebook

    # Court information
    court: str = SQLField(max_length=200, index=True)
    court_level: Optional[CourtLevel] = SQLField(default=None, index=True)
    jurisdiction: str = SQLField(max_length=100, index=True)
    judge: Optional[str] = SQLField(default=None, max_length=255)

    # Case dates
    decision_date: Optional[date] = SQLField(default=None, index=True)
    filing_date: Optional[date] = SQLField(default=None)

    # Outcome and details
    outcome: CaseOutcome = SQLField(default=CaseOutcome.UNKNOWN, index=True)
    settlement_amount: Optional[float] = SQLField(default=None)  # In USD
    damages_awarded: Optional[float] = SQLField(default=None)  # In USD

    # Case summary and content
    case_summary: Optional[str] = SQLField(default=None)
    key_facts: Optional[str] = SQLField(default=None)  # JSON array
    legal_issues: Optional[str] = SQLField(default=None)  # JSON array
    holding: Optional[str] = SQLField(default=None)
    reasoning: Optional[str] = SQLField(default=None)

    # URLs and references
    case_url: Optional[str] = SQLField(default=None, max_length=500)
    opinion_url: Optional[str] = SQLField(default=None, max_length=500)
    docket_url: Optional[str] = SQLField(default=None, max_length=500)

    # Relevance and scoring
    relevance_score: float = SQLField(default=0.0, index=True)  # 0-1 scale
    precedential_value: Optional[float] = SQLField(default=None)  # 0-1 scale
    citation_count: int = SQLField(default=0)  # How many other cases cite this

    # Case metadata
    practice_area: Optional[str] = SQLField(default=None, max_length=50, index=True)
    case_type: Optional[str] = SQLField(default=None, max_length=100)
    cause_of_action: Optional[str] = SQLField(default=None, max_length=200)

    # Duration and timeline
    case_duration_months: Optional[int] = SQLField(default=None)
    trial_duration_days: Optional[int] = SQLField(default=None)

    # Parties
    plaintiff_type: Optional[str] = SQLField(default=None, max_length=100)
    defendant_type: Optional[str] = SQLField(default=None, max_length=100)
    plaintiff_representation: Optional[str] = SQLField(default=None, max_length=255)
    defendant_representation: Optional[str] = SQLField(default=None, max_length=255)

    # Legal standards and tests applied
    legal_standards_applied: Optional[str] = SQLField(default=None)  # JSON array
    statutes_cited: Optional[str] = SQLField(default=None)  # JSON array
    regulations_cited: Optional[str] = SQLField(default=None)  # JSON array

    # Appeals information
    was_appealed: bool = SQLField(default=False)
    appeal_outcome: Optional[str] = SQLField(default=None, max_length=100)
    final_disposition: Optional[str] = SQLField(default=None, max_length=200)

    # API source tracking
    api_source: APISource = SQLField(default=APISource.COURTLISTENER, index=True)
    external_id: Optional[str] = SQLField(default=None, max_length=100)
    api_last_updated: Optional[datetime] = SQLField(default=None)

    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    last_accessed: Optional[datetime] = SQLField(default=None)
    access_count: int = SQLField(default=0)

    # Quality and verification
    data_quality_score: Optional[float] = SQLField(default=None)  # 0-1 scale
    verified_by_attorney: bool = SQLField(default=False)
    attorney_notes: Optional[str] = SQLField(default=None)

    # Relationships
    # clauses: List["ContractClause"] = Relationship(back_populates="precedents", link_model="ClausePrecedentMapping")


class ClausePrecedentMapping(SQLModel, table=True):
    """Mapping table for contract clauses to case precedents."""

    id: Optional[int] = SQLField(default=None, primary_key=True)
    clause_id: int = SQLField(foreign_key="contractclause.id", index=True)
    precedent_id: int = SQLField(foreign_key="caseprecedent.id", index=True)

    # Relevance metrics
    relevance_score: float = SQLField(default=0.0)  # 0-1 scale
    mapping_confidence: float = SQLField(default=0.0)  # 0-1 scale
    similarity_score: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Mapping metadata
    mapping_reason: Optional[str] = SQLField(default=None, max_length=500)
    key_similarities: Optional[str] = SQLField(default=None)  # JSON array

    # Audit
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = SQLField(default=None)
    created_by_model: Optional[str] = SQLField(default=None, max_length=50)


# Pydantic schemas for API requests/responses

class CasePrecedentBase(BaseModel):
    """Base case precedent schema."""
    case_name: str
    citation: str
    court: str
    jurisdiction: str
    decision_date: Optional[date] = None
    outcome: CaseOutcome = CaseOutcome.UNKNOWN


class CasePrecedentCreate(CasePrecedentBase):
    """Schema for creating a case precedent."""
    case_number: Optional[str] = None
    court_level: Optional[CourtLevel] = None
    judge: Optional[str] = None
    filing_date: Optional[date] = None
    settlement_amount: Optional[float] = None
    damages_awarded: Optional[float] = None
    case_summary: Optional[str] = None
    case_url: Optional[str] = None
    api_source: APISource = APISource.MANUAL_ENTRY
    external_id: Optional[str] = None


class CasePrecedentUpdate(BaseModel):
    """Schema for updating case precedent."""
    case_summary: Optional[str] = None
    key_facts: Optional[List[str]] = None
    legal_issues: Optional[List[str]] = None
    holding: Optional[str] = None
    reasoning: Optional[str] = None
    relevance_score: Optional[float] = None
    precedential_value: Optional[float] = None
    verified_by_attorney: Optional[bool] = None
    attorney_notes: Optional[str] = None


class CasePrecedentResponse(CasePrecedentBase):
    """Schema for case precedent response."""
    id: int
    case_number: Optional[str] = None
    citation_normalized: Optional[str] = None
    court_level: Optional[CourtLevel] = None
    judge: Optional[str] = None
    filing_date: Optional[date] = None
    settlement_amount: Optional[float] = None
    damages_awarded: Optional[float] = None
    case_summary: Optional[str] = None
    key_facts: List[str] = []
    legal_issues: List[str] = []
    holding: Optional[str] = None
    case_url: Optional[str] = None
    opinion_url: Optional[str] = None
    relevance_score: float
    precedential_value: Optional[float] = None
    citation_count: int
    practice_area: Optional[str] = None
    case_type: Optional[str] = None
    case_duration_months: Optional[int] = None
    was_appealed: bool
    appeal_outcome: Optional[str] = None
    api_source: APISource
    created_at: datetime
    updated_at: Optional[datetime] = None
    verified_by_attorney: bool

    class Config:
        from_attributes = True


class CasePrecedentListResponse(BaseModel):
    """Schema for case precedent list response."""
    cases: List[CasePrecedentResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class CaseSearchRequest(BaseModel):
    """Schema for case search request."""
    query: Optional[str] = None
    jurisdiction: Optional[str] = None
    court_level: Optional[CourtLevel] = None
    practice_area: Optional[str] = None
    outcome: Optional[CaseOutcome] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    min_relevance: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    settlement_amount_min: Optional[float] = None
    settlement_amount_max: Optional[float] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="relevance_score")
    sort_order: str = Field(default="desc")


class CaseAnalytics(BaseModel):
    """Schema for case analytics."""
    total_cases: int
    cases_by_outcome: Dict[CaseOutcome, int]
    cases_by_court_level: Dict[CourtLevel, int]
    cases_by_jurisdiction: Dict[str, int]
    average_settlement: Optional[float] = None
    median_settlement: Optional[float] = None
    settlement_range: Dict[str, float]
    average_case_duration_months: Optional[float] = None
    plaintiff_win_rate: float
    defendant_win_rate: float
    settlement_rate: float
    most_cited_cases: List[Dict[str, Any]]
    trending_legal_issues: List[str]


class CaseOutcomeAnalysis(BaseModel):
    """Schema for case outcome analysis."""
    case_id: int
    case_name: str
    citation: str
    outcome: CaseOutcome
    outcome_probability: float
    similar_cases_count: int
    plaintiff_win_probability: float
    defendant_win_probability: float
    settlement_probability: float
    predicted_settlement_amount: Optional[float] = None
    settlement_range_low: Optional[float] = None
    settlement_range_high: Optional[float] = None
    confidence: float
    key_factors: List[str]
    similar_cases: List[Dict[str, Any]]


class CaseSimilarityRequest(BaseModel):
    """Schema for finding similar cases."""
    document_id: Optional[int] = None
    clause_id: Optional[int] = None
    case_facts: Optional[str] = None
    legal_issues: Optional[List[str]] = None
    jurisdiction: Optional[str] = None
    practice_area: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=50)


class CaseSimilarityResponse(BaseModel):
    """Schema for similar case response."""
    query_summary: str
    similar_cases: List[CasePrecedentResponse]
    similarity_scores: List[float]
    aggregate_analysis: Dict[str, Any]
    outcome_trends: Dict[str, Any]
    key_differentiators: List[str]


class CaseStatistics(BaseModel):
    """Schema for case statistics."""
    total_cases: int
    cases_by_source: Dict[APISource, int]
    recent_additions: int
    verified_cases: int
    cases_with_settlements: int
    cases_appealed: int
    average_data_quality: float
    jurisdictions_covered: int
    practice_areas_covered: int
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None
