"""Litigation prediction models for predictive analytics."""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from sqlmodel import SQLModel, Field as SQLField, Relationship


class PredictionType(str, Enum):
    """Type of litigation prediction."""
    OUTCOME = "outcome"
    SETTLEMENT = "settlement"
    TIMELINE = "timeline"
    COST = "cost"
    COMPREHENSIVE = "comprehensive"


class PredictedOutcome(str, Enum):
    """Predicted litigation outcome."""
    PLAINTIFF_WIN = "plaintiff_win"
    DEFENDANT_WIN = "defendant_win"
    SETTLEMENT = "settlement"
    DISMISSAL = "dismissal"
    MIXED = "mixed"
    UNCERTAIN = "uncertain"


class LitigationPrediction(SQLModel, table=True):
    """Litigation prediction database model for predictive analytics."""

    id: Optional[int] = SQLField(default=None, primary_key=True)

    # Document relationship
    document_id: int = SQLField(foreign_key="document.id", index=True)

    # Prediction metadata
    prediction_type: PredictionType = SQLField(index=True)
    prediction_date: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    model_version: str = SQLField(default="1.0", max_length=20)

    # Outcome predictions
    predicted_outcome: PredictedOutcome = SQLField(default=PredictedOutcome.UNCERTAIN)
    plaintiff_win_probability: Optional[float] = SQLField(default=None)  # 0-1 scale
    defendant_win_probability: Optional[float] = SQLField(default=None)  # 0-1 scale
    settlement_probability: Optional[float] = SQLField(default=None)  # 0-1 scale
    dismissal_probability: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Settlement predictions
    predicted_settlement: Optional[float] = SQLField(default=None)  # USD
    settlement_range_min: Optional[float] = SQLField(default=None)  # USD
    settlement_range_max: Optional[float] = SQLField(default=None)  # USD
    settlement_confidence: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Timeline predictions
    estimated_duration_months: Optional[int] = SQLField(default=None)
    estimated_duration_range_min: Optional[int] = SQLField(default=None)
    estimated_duration_range_max: Optional[int] = SQLField(default=None)
    timeline_confidence: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Cost predictions
    estimated_legal_cost: Optional[float] = SQLField(default=None)  # USD
    legal_cost_range_min: Optional[float] = SQLField(default=None)  # USD
    legal_cost_range_max: Optional[float] = SQLField(default=None)  # USD
    cost_confidence: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Overall confidence
    overall_confidence_score: float = SQLField(default=0.0)  # 0-1 scale

    # Key factors influencing prediction
    key_factors: Optional[str] = SQLField(default=None)  # JSON array
    positive_factors: Optional[str] = SQLField(default=None)  # JSON array (favor plaintiff)
    negative_factors: Optional[str] = SQLField(default=None)  # JSON array (favor defendant)
    neutral_factors: Optional[str] = SQLField(default=None)  # JSON array

    # Similar cases analysis
    similar_cases_count: int = SQLField(default=0)
    similar_cases_ids: Optional[str] = SQLField(default=None)  # JSON array of case IDs
    similar_cases_avg_outcome: Optional[str] = SQLField(default=None)
    similar_cases_avg_settlement: Optional[float] = SQLField(default=None)
    similar_cases_avg_duration: Optional[float] = SQLField(default=None)

    # Risk assessment integration
    case_strength_score: Optional[float] = SQLField(default=None)  # 0-10 scale
    opposing_case_strength: Optional[float] = SQLField(default=None)  # 0-10 scale
    overall_case_merit: Optional[float] = SQLField(default=None)  # 0-10 scale

    # Strategic recommendations
    recommended_strategy: Optional[str] = SQLField(default=None, max_length=50)  # settle, litigate, dismiss
    settlement_recommendation: Optional[str] = SQLField(default=None)  # aggressive, moderate, conservative
    negotiation_leverage_score: Optional[float] = SQLField(default=None)  # 0-10 scale

    # Jurisdiction and practice area context
    jurisdiction: Optional[str] = SQLField(default=None, max_length=100, index=True)
    practice_area: Optional[str] = SQLField(default=None, max_length=50, index=True)
    court_type: Optional[str] = SQLField(default=None, max_length=100)

    # Statistical analysis
    statistical_significance: Optional[float] = SQLField(default=None)  # p-value
    margin_of_error: Optional[float] = SQLField(default=None)
    data_quality_score: Optional[float] = SQLField(default=None)  # 0-1 scale

    # Scenario analysis
    best_case_scenario: Optional[str] = SQLField(default=None)  # JSON object
    worst_case_scenario: Optional[str] = SQLField(default=None)  # JSON object
    most_likely_scenario: Optional[str] = SQLField(default=None)  # JSON object

    # Update tracking
    prediction_accuracy: Optional[float] = SQLField(default=None)  # After actual outcome known
    actual_outcome: Optional[str] = SQLField(default=None, max_length=50)
    actual_settlement: Optional[float] = SQLField(default=None)
    actual_duration_months: Optional[int] = SQLField(default=None)
    outcome_known_date: Optional[datetime] = SQLField(default=None)

    # Processing metadata
    processing_time_seconds: Optional[float] = SQLField(default=None)
    model_used: Optional[str] = SQLField(default=None, max_length=50)
    processing_error: Optional[str] = SQLField(default=None)

    # Review and validation
    validated_by_attorney: bool = SQLField(default=False)
    attorney_validation_date: Optional[datetime] = SQLField(default=None)
    attorney_agreement_score: Optional[float] = SQLField(default=None)  # 0-10 scale
    attorney_notes: Optional[str] = SQLField(default=None)

    # Audit fields
    created_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = SQLField(default=None)
    last_accessed: Optional[datetime] = SQLField(default=None)
    access_count: int = SQLField(default=0)

    # Relationships
    # document: Optional["Document"] = Relationship(back_populates="predictions")


# Pydantic schemas for API requests/responses

class LitigationPredictionBase(BaseModel):
    """Base litigation prediction schema."""
    document_id: int
    prediction_type: PredictionType
    overall_confidence_score: float = Field(..., ge=0.0, le=1.0)


class LitigationPredictionCreate(LitigationPredictionBase):
    """Schema for creating a litigation prediction."""
    predicted_outcome: PredictedOutcome = PredictedOutcome.UNCERTAIN
    plaintiff_win_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    defendant_win_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    settlement_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    predicted_settlement: Optional[float] = None
    estimated_duration_months: Optional[int] = None
    jurisdiction: Optional[str] = None
    practice_area: Optional[str] = None


class LitigationPredictionUpdate(BaseModel):
    """Schema for updating litigation prediction."""
    actual_outcome: Optional[str] = None
    actual_settlement: Optional[float] = None
    actual_duration_months: Optional[int] = None
    outcome_known_date: Optional[datetime] = None
    validated_by_attorney: Optional[bool] = None
    attorney_agreement_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    attorney_notes: Optional[str] = None


class LitigationPredictionResponse(LitigationPredictionBase):
    """Schema for litigation prediction response."""
    id: int
    prediction_date: datetime
    model_version: str
    predicted_outcome: PredictedOutcome
    plaintiff_win_probability: Optional[float] = None
    defendant_win_probability: Optional[float] = None
    settlement_probability: Optional[float] = None
    dismissal_probability: Optional[float] = None
    predicted_settlement: Optional[float] = None
    settlement_range_min: Optional[float] = None
    settlement_range_max: Optional[float] = None
    settlement_confidence: Optional[float] = None
    estimated_duration_months: Optional[int] = None
    estimated_duration_range_min: Optional[int] = None
    estimated_duration_range_max: Optional[int] = None
    timeline_confidence: Optional[float] = None
    estimated_legal_cost: Optional[float] = None
    legal_cost_range_min: Optional[float] = None
    legal_cost_range_max: Optional[float] = None
    cost_confidence: Optional[float] = None
    key_factors: List[str] = []
    positive_factors: List[str] = []
    negative_factors: List[str] = []
    neutral_factors: List[str] = []
    similar_cases_count: int
    similar_cases_avg_outcome: Optional[str] = None
    similar_cases_avg_settlement: Optional[float] = None
    similar_cases_avg_duration: Optional[float] = None
    case_strength_score: Optional[float] = None
    opposing_case_strength: Optional[float] = None
    overall_case_merit: Optional[float] = None
    recommended_strategy: Optional[str] = None
    settlement_recommendation: Optional[str] = None
    negotiation_leverage_score: Optional[float] = None
    jurisdiction: Optional[str] = None
    practice_area: Optional[str] = None
    validated_by_attorney: bool
    attorney_validation_date: Optional[datetime] = None
    attorney_agreement_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PredictionRequest(BaseModel):
    """Schema for requesting a litigation prediction."""
    document_id: int
    prediction_types: List[PredictionType] = [PredictionType.COMPREHENSIVE]
    jurisdiction: Optional[str] = None
    practice_area: Optional[str] = None
    plaintiff_type: Optional[str] = None
    defendant_type: Optional[str] = None
    case_facts: Optional[str] = None
    include_similar_cases: bool = True
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class PredictionSummary(BaseModel):
    """Schema for prediction summary."""
    document_id: int
    document_title: str
    predicted_outcome: PredictedOutcome
    outcome_confidence: float
    settlement_amount: Optional[float] = None
    settlement_range: Optional[str] = None
    duration_months: Optional[int] = None
    duration_range: Optional[str] = None
    recommended_strategy: Optional[str] = None
    key_insight: str
    prediction_date: datetime


class OutcomeProbabilityChart(BaseModel):
    """Schema for outcome probability visualization."""
    plaintiff_win: float
    defendant_win: float
    settlement: float
    dismissal: float
    chart_data: Dict[str, Any]
    interpretation: str


class SettlementAnalysis(BaseModel):
    """Schema for detailed settlement analysis."""
    recommended_settlement: float
    minimum_acceptable: float
    maximum_justifiable: float
    confidence_level: float
    negotiation_strategy: str
    leverage_factors: List[str]
    comparable_settlements: List[Dict[str, Any]]
    settlement_timeline: Dict[str, Any]


class CaseStrengthAnalysis(BaseModel):
    """Schema for case strength analysis."""
    overall_strength: float
    plaintiff_strengths: List[Dict[str, Any]]
    plaintiff_weaknesses: List[Dict[str, Any]]
    defendant_strengths: List[Dict[str, Any]]
    defendant_weaknesses: List[Dict[str, Any]]
    critical_factors: List[str]
    evidence_quality: float
    legal_precedent_support: float
    expert_testimony_impact: Optional[float] = None


class PredictionAccuracyReport(BaseModel):
    """Schema for prediction accuracy tracking."""
    total_predictions: int
    predictions_with_outcomes: int
    overall_accuracy: float
    outcome_prediction_accuracy: float
    settlement_prediction_accuracy: float
    timeline_prediction_accuracy: float
    accuracy_by_practice_area: Dict[str, float]
    accuracy_by_jurisdiction: Dict[str, float]
    confidence_calibration: Dict[str, Any]
    model_performance_trends: List[Dict[str, Any]]


class ScenarioAnalysis(BaseModel):
    """Schema for scenario analysis."""
    best_case: Dict[str, Any]
    worst_case: Dict[str, Any]
    most_likely: Dict[str, Any]
    alternative_scenarios: List[Dict[str, Any]]
    scenario_probabilities: Dict[str, float]
    risk_adjusted_expectation: Dict[str, Any]


class StrategicRecommendation(BaseModel):
    """Schema for strategic legal recommendations."""
    primary_recommendation: str
    alternative_strategies: List[str]
    risk_analysis: Dict[str, Any]
    cost_benefit_analysis: Dict[str, Any]
    timeline_considerations: Dict[str, Any]
    settlement_windows: List[Dict[str, Any]]
    negotiation_tactics: List[str]
    litigation_roadmap: List[Dict[str, Any]]
