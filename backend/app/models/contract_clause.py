"""Contract clause models for legal document analysis."""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from sqlmodel import SQLModel, Field as SQLField, Relationship, Column
from sqlalchemy import JSON


class ClauseType(str, Enum):
    """Contract clause type enumeration."""
    TERMINATION = "termination"
    NON_COMPETE = "non_compete"
    CONFIDENTIALITY = "confidentiality"
    INDEMNIFICATION = "indemnification"
    LIABILITY_LIMITATION = "liability_limitation"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    DISPUTE_RESOLUTION = "dispute_resolution"
    FORCE_MAJEURE = "force_majeure"
    PAYMENT_TERMS = "payment_terms"
    RENEWAL = "renewal"
    ASSIGNMENT = "assignment"
    GOVERNING_LAW = "governing_law"
    SEVERABILITY = "severability"
    ENTIRE_AGREEMENT = "entire_agreement"
    AMENDMENT = "amendment"
    NOTICE = "notice"
    WARRANTY = "warranty"
    REPRESENTATIONS = "representations"
    COVENANT = "covenant"
    OTHER = "other"


class RiskLevel(str, Enum):
    """Risk level enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ContractClause(SQLModel, table=True):
    """Contract clause database model with risk analysis."""

    id: Optional[int] = SQLField(default=None, primary_key=True)

    # Document relationship
    document_id: int = SQLField(foreign_key="document.id", index=True)

    # Clause identification
    clause_type: ClauseType = SQLField(index=True)
    clause_title: Optional[str] = SQLField(default=None, max_length=500)
    clause_text: str = SQLField()
    section_number: Optional[str] = SQLField(default=None, max_length=50)

    # Location in document
    page_number: Optional[int] = SQLField(default=None, index=True)
    paragraph_number: Optional[int] = SQLField(default=None)
    start_position: Optional[int] = SQLField(default=None)
    end_position: Optional[int] = SQLField(default=None)

    # Risk analysis
    risk_score: float = SQLField(default=0.0, index=True)  # 0-10 scale
    risk_level: RiskLevel = SQLField(default=RiskLevel.LOW, index=True)
    extraction_confidence: float = SQLField(default=0.0)  # 0-1 scale

    # Legal analysis
    legal_terms: Optional[str] = SQLField(default=None)  # JSON array of terms
    risk_factors: Optional[str] = SQLField(default=None)  # JSON array of risk factors
    recommendations: Optional[str] = SQLField(default=None)  # JSON array of recommendations

    # Case law connections
    related_precedents_count: int = SQLField(default=0)
    precedent_support_score: Optional[float] = SQLField(default=None)  # 0-1 scale
    enforceability_score: Optional[float] = SQLField(default=None)  # 0-1 scale

    # AI analysis metadata
    analysis_model: Optional[str] = SQLField(default=None, max_length=50)
    analysis_version: Optional[str] = SQLField(default=None, max_length=20)
    analysis_date: Optional[datetime] = SQLField(default=None)

    # Standard terms comparison
    is_standard_language: bool = SQLField(default=False)
    deviation_from_standard: Optional[str] = SQLField(default=None)

    # Practice area specific
    practice_area: Optional[str] = SQLField(default=None, max_length=50)
    jurisdiction_specific: bool = SQLField(default=False)
    jurisdiction: Optional[str] = SQLField(default=None, max_length=100)

    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    reviewed_by_attorney: bool = SQLField(default=False)
    attorney_review_date: Optional[datetime] = SQLField(default=None)
    attorney_notes: Optional[str] = SQLField(default=None)

    # Relationships
    # document: Optional["Document"] = Relationship(back_populates="clauses")
    # precedents: List["CasePrecedent"] = Relationship(back_populates="clauses", link_model="ClausePrecedentMapping")


# Pydantic schemas for API requests/responses

class ContractClauseBase(BaseModel):
    """Base contract clause schema."""
    clause_type: ClauseType
    clause_title: Optional[str] = None
    clause_text: str
    section_number: Optional[str] = None
    page_number: Optional[int] = None


class ContractClauseCreate(ContractClauseBase):
    """Schema for creating a contract clause."""
    document_id: int
    paragraph_number: Optional[int] = None
    start_position: Optional[int] = None
    end_position: Optional[int] = None


class ContractClauseUpdate(BaseModel):
    """Schema for updating clause metadata."""
    clause_title: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    recommendations: Optional[List[str]] = None
    reviewed_by_attorney: Optional[bool] = None
    attorney_notes: Optional[str] = None


class ContractClauseResponse(ContractClauseBase):
    """Schema for contract clause response."""
    id: int
    document_id: int
    section_number: Optional[str] = None
    page_number: Optional[int] = None
    paragraph_number: Optional[int] = None
    risk_score: float
    risk_level: RiskLevel
    extraction_confidence: float
    legal_terms: List[str] = []
    risk_factors: List[str] = []
    recommendations: List[str] = []
    related_precedents_count: int
    precedent_support_score: Optional[float] = None
    enforceability_score: Optional[float] = None
    is_standard_language: bool
    deviation_from_standard: Optional[str] = None
    practice_area: Optional[str] = None
    jurisdiction: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    reviewed_by_attorney: bool
    attorney_review_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClauseListResponse(BaseModel):
    """Schema for clause list response."""
    clauses: List[ContractClauseResponse]
    total: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


class ClauseRiskSummary(BaseModel):
    """Schema for clause risk summary."""
    clause_id: int
    clause_type: ClauseType
    clause_title: Optional[str] = None
    risk_score: float
    risk_level: RiskLevel
    page_number: Optional[int] = None
    key_risk_factors: List[str]
    top_recommendation: Optional[str] = None
    precedent_count: int
    enforceability_score: Optional[float] = None


class ClauseAnalysisRequest(BaseModel):
    """Schema for requesting clause analysis."""
    document_id: int
    clause_text: str
    clause_type: Optional[ClauseType] = None
    jurisdiction: Optional[str] = None
    practice_area: Optional[str] = None


class ClauseAnalysisResponse(BaseModel):
    """Schema for clause analysis response."""
    clause_type: ClauseType
    risk_score: float
    risk_level: RiskLevel
    confidence: float
    risk_factors: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    legal_terms_identified: List[str]
    similar_clauses_found: int
    precedents_relevant: int
    enforceability_assessment: str
    standard_language_comparison: Dict[str, Any]
    jurisdiction_issues: List[str]


class ClauseComparisonRequest(BaseModel):
    """Schema for comparing clauses."""
    clause_ids: List[int] = Field(..., min_items=2, max_items=10)
    comparison_criteria: List[str] = ["risk_score", "enforceability", "standard_language"]


class ClauseComparisonResponse(BaseModel):
    """Schema for clause comparison response."""
    clauses: List[ClauseRiskSummary]
    comparison_matrix: Dict[str, Any]
    best_practice_recommendation: str
    overall_risk_assessment: str


class ClauseSuggestion(BaseModel):
    """Schema for AI-generated clause suggestions."""
    original_clause_id: int
    original_text: str
    suggested_text: str
    improvement_rationale: str
    risk_reduction: float
    legal_basis: List[str]
    precedent_support: List[Dict[str, str]]
    confidence: float


class ClauseSearchRequest(BaseModel):
    """Schema for searching clauses."""
    query: Optional[str] = None
    clause_type: Optional[ClauseType] = None
    risk_level: Optional[RiskLevel] = None
    document_id: Optional[int] = None
    practice_area: Optional[str] = None
    min_risk_score: Optional[float] = None
    max_risk_score: Optional[float] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class ClauseStatistics(BaseModel):
    """Schema for clause statistics."""
    total_clauses: int
    clauses_by_type: Dict[ClauseType, int]
    clauses_by_risk_level: Dict[RiskLevel, int]
    average_risk_score: float
    high_risk_percentage: float
    clauses_with_precedents: int
    clauses_reviewed: int
    clauses_pending_review: int
    most_common_risk_factors: List[Dict[str, Any]]
    most_problematic_clause_types: List[Dict[str, Any]]
