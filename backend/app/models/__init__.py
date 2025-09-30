"""Database models."""

# Original models
from app.models.user import User, UserRole, UserCreate, UserUpdate, UserResponse
from app.models.document import Document, DocumentType, ProcessingStatus, DocumentCreate, DocumentUpdate, DocumentResponse

# LEGAL 3.0 models
from app.models.firm import (
    Firm,
    SubscriptionTier,
    LicenseType,
    FirmCreate,
    FirmUpdate,
    FirmResponse,
    FirmStats,
)
from app.models.contract_clause import (
    ContractClause,
    ClauseType,
    RiskLevel,
    ContractClauseCreate,
    ContractClauseUpdate,
    ContractClauseResponse,
)
from app.models.case_precedent import (
    CasePrecedent,
    ClausePrecedentMapping,
    CaseOutcome,
    CourtLevel,
    APISource,
    CasePrecedentCreate,
    CasePrecedentUpdate,
    CasePrecedentResponse,
)
from app.models.risk_assessment import (
    RiskAssessment,
    AssessmentStatus,
    OverallRiskLevel,
    RiskAssessmentCreate,
    RiskAssessmentUpdate,
    RiskAssessmentResponse,
)
from app.models.litigation_prediction import (
    LitigationPrediction,
    PredictionType,
    PredictedOutcome,
    LitigationPredictionCreate,
    LitigationPredictionUpdate,
    LitigationPredictionResponse,
)

__all__ = [
    # Original models
    "User",
    "UserRole",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "Document",
    "DocumentType",
    "ProcessingStatus",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    # LEGAL 3.0 models - Firms
    "Firm",
    "SubscriptionTier",
    "LicenseType",
    "FirmCreate",
    "FirmUpdate",
    "FirmResponse",
    "FirmStats",
    # LEGAL 3.0 models - Contract Clauses
    "ContractClause",
    "ClauseType",
    "RiskLevel",
    "ContractClauseCreate",
    "ContractClauseUpdate",
    "ContractClauseResponse",
    # LEGAL 3.0 models - Case Precedents
    "CasePrecedent",
    "ClausePrecedentMapping",
    "CaseOutcome",
    "CourtLevel",
    "APISource",
    "CasePrecedentCreate",
    "CasePrecedentUpdate",
    "CasePrecedentResponse",
    # LEGAL 3.0 models - Risk Assessments
    "RiskAssessment",
    "AssessmentStatus",
    "OverallRiskLevel",
    "RiskAssessmentCreate",
    "RiskAssessmentUpdate",
    "RiskAssessmentResponse",
    # LEGAL 3.0 models - Litigation Predictions
    "LitigationPrediction",
    "PredictionType",
    "PredictedOutcome",
    "LitigationPredictionCreate",
    "LitigationPredictionUpdate",
    "LitigationPredictionResponse",
]
