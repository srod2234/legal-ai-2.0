"""
Risk Assessment API Endpoints for LEGAL 3.0
Provides endpoints for risk analysis and clause extraction
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from pydantic import BaseModel

from app.core.database import get_session
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.document import Document
from app.models.risk_assessment import RiskAssessment
from app.models.contract_clause import ContractClause
from app.services.risk_analysis_service import get_risk_analysis_service
from app.services.enhanced_document_processing import get_enhanced_document_processing_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/risk", tags=["Risk Assessment"])


# ==================== Request/Response Models ====================

class RiskAnalysisRequest(BaseModel):
    """Request to analyze document risk"""
    include_precedents: bool = True
    force_reanalysis: bool = False


class RiskAnalysisResponse(BaseModel):
    """Response with risk analysis results"""
    document_id: int
    overall_risk_score: float
    overall_risk_level: str
    total_clauses_analyzed: int
    high_risk_clause_count: int
    analysis_completeness: float
    recommendations: List[dict]
    analysis_date: str
    status: str


class ClauseResponse(BaseModel):
    """Response with clause details"""
    id: int
    document_id: int
    clause_type: str
    clause_text: str
    risk_score: float
    risk_level: str
    section_number: Optional[str]
    section_title: Optional[str]
    confidence_score: float
    risk_factors: Optional[List[str]]

    class Config:
        from_attributes = True


class RiskSummaryResponse(BaseModel):
    """Summary of document risk"""
    document_id: int
    risk_score: Optional[float]
    risk_level: Optional[str]
    has_high_risk_clauses: bool
    clause_count: int
    high_risk_clause_count: int
    last_analysis: Optional[str]
    analysis_complete: bool


# ==================== Endpoints ====================

@router.post("/{document_id}/analyze", response_model=RiskAnalysisResponse)
async def analyze_document_risk(
    document_id: int,
    request: RiskAnalysisRequest = RiskAnalysisRequest(),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyze risk for a specific document

    Performs comprehensive risk analysis including:
    - Clause extraction and classification
    - Risk scoring and categorization
    - Precedent matching (optional)
    - Recommendation generation
    """
    try:
        # Get document
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check permissions
        if document.user_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Check if document has extracted text
        if not document.extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has not been processed yet"
            )

        # Get risk analysis service
        risk_service = get_risk_analysis_service(session)

        # Perform analysis
        logger.info(f"Starting risk analysis for document {document_id} by user {current_user.id}")

        analysis_results = await risk_service.analyze_document_risk(
            document,
            document.extracted_text,
            include_precedents=request.include_precedents
        )

        return RiskAnalysisResponse(
            document_id=document_id,
            overall_risk_score=analysis_results["overall_risk_score"],
            overall_risk_level=analysis_results["overall_risk_level"],
            total_clauses_analyzed=analysis_results["total_clauses_analyzed"],
            high_risk_clause_count=analysis_results["high_risk_clause_count"],
            analysis_completeness=document.analysis_completeness or 0.0,
            recommendations=analysis_results["recommendations"],
            analysis_date=analysis_results["analysis_date"],
            status="success"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing document risk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Risk analysis failed"
        )


@router.get("/{document_id}/assessment", response_model=dict)
async def get_risk_assessment(
    document_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get the latest risk assessment for a document"""
    try:
        # Get document
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check permissions
        if document.user_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Get enhanced processing service for status
        enhanced_service = get_enhanced_document_processing_service(session)
        status_info = await enhanced_service.get_document_analysis_status(document_id)

        return status_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting risk assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve risk assessment"
        )


@router.get("/{document_id}/clauses", response_model=List[ClauseResponse])
async def get_document_clauses(
    document_id: int,
    clause_type: Optional[str] = Query(None, description="Filter by clause type"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all extracted clauses for a document

    Optional filters:
    - clause_type: Filter by specific clause type
    - risk_level: Filter by risk level (critical, high, medium, low, minimal)
    """
    try:
        # Get document
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check permissions
        if document.user_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Query clauses
        from sqlmodel import select
        statement = select(ContractClause).where(ContractClause.document_id == document_id)

        if clause_type:
            statement = statement.where(ContractClause.clause_type == clause_type)

        if risk_level:
            statement = statement.where(ContractClause.risk_level == risk_level)

        clauses = session.exec(statement).all()

        return [ClauseResponse.model_validate(clause) for clause in clauses]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document clauses: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve clauses"
        )


@router.get("/{document_id}/recommendations", response_model=List[dict])
async def get_risk_recommendations(
    document_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get risk mitigation recommendations for a document"""
    try:
        # Get document
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check permissions
        if document.user_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Get latest risk assessment
        from sqlmodel import select
        statement = (
            select(RiskAssessment)
            .where(RiskAssessment.document_id == document_id)
            .order_by(RiskAssessment.created_at.desc())
        )
        assessment = session.exec(statement).first()

        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No risk assessment found for this document"
            )

        # Return recommendations
        recommendations = []

        # Add critical issues as high priority
        if assessment.critical_issues:
            for issue in assessment.critical_issues:
                recommendations.append({
                    "priority": "critical",
                    "category": "critical_issue",
                    "recommendation": issue
                })

        # Add general recommendations
        if assessment.recommendations:
            for rec in assessment.recommendations:
                recommendations.append({
                    "priority": "high",
                    "category": "general",
                    "recommendation": rec
                })

        return recommendations

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendations"
        )


@router.get("/{document_id}/summary", response_model=RiskSummaryResponse)
async def get_risk_summary(
    document_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get a quick summary of document risk"""
    try:
        # Get document
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check permissions
        if document.user_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Count clauses
        from sqlmodel import select, func
        total_clauses = session.exec(
            select(func.count(ContractClause.id))
            .where(ContractClause.document_id == document_id)
        ).one()

        high_risk_clauses = session.exec(
            select(func.count(ContractClause.id))
            .where(
                ContractClause.document_id == document_id,
                ContractClause.risk_level.in_(["critical", "high"])
            )
        ).one()

        return RiskSummaryResponse(
            document_id=document_id,
            risk_score=document.risk_score,
            risk_level=document.risk_level,
            has_high_risk_clauses=document.has_high_risk_clauses or False,
            clause_count=total_clauses,
            high_risk_clause_count=high_risk_clauses,
            last_analysis=document.last_risk_analysis.isoformat() if document.last_risk_analysis else None,
            analysis_complete=document.risk_analysis_complete or False
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting risk summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve risk summary"
        )


@router.post("/{document_id}/reanalyze", response_model=RiskAnalysisResponse)
async def reanalyze_document(
    document_id: int,
    force: bool = Query(False, description="Force reanalysis even if recently analyzed"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Reanalyze a document that was previously analyzed"""
    try:
        # Get document
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check permissions
        if document.user_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Get enhanced processing service
        enhanced_service = get_enhanced_document_processing_service(session)

        # Reanalyze
        logger.info(f"Reanalyzing document {document_id} by user {current_user.id}")
        results = await enhanced_service.reanalyze_document(document_id, force=force)

        if results.get("status") == "skipped":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=results.get("reason", "Analysis skipped")
            )

        return RiskAnalysisResponse(
            document_id=document_id,
            overall_risk_score=results.get("risk_analysis", {}).get("overall_risk_score", 0.0),
            overall_risk_level=results.get("risk_analysis", {}).get("overall_risk_level", "unknown"),
            total_clauses_analyzed=results.get("clauses_extracted", 0),
            high_risk_clause_count=results.get("risk_analysis", {}).get("high_risk_clause_count", 0),
            analysis_completeness=results.get("analysis_completeness", 0.0),
            recommendations=results.get("risk_analysis", {}).get("recommendations", []),
            analysis_date=results.get("analysis_completed", ""),
            status="success"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reanalyzing document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Reanalysis failed"
        )
