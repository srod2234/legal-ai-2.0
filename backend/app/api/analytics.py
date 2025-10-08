"""
Predictive Analytics API Endpoints for LEGAL 3.0

Provides endpoints for:
- Litigation outcome predictions
- Settlement amount estimation
- Timeline predictions
- Case strength analysis
- Historical pattern analysis

Author: LEGAL 3.0 Enterprise Transformation
Created: 2025-09-30
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from pydantic import BaseModel, Field

from app.core.database import get_session
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.document import Document
from app.services.predictive_analytics_service import get_predictive_analytics_service
from app.middleware.tenant_isolation import ensure_tenant_isolation
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Predictive Analytics"])


# ==================== REQUEST/RESPONSE MODELS ====================

class OutcomePredictionRequest(BaseModel):
    """Request for outcome prediction"""
    document_id: int
    practice_area: str = Field(..., description="Practice area (personal_injury, corporate, etc.)")
    case_type: Optional[str] = Field(None, description="Specific case type")
    jurisdiction: Optional[str] = Field(None, description="Legal jurisdiction")


class SettlementEstimationRequest(BaseModel):
    """Request for settlement estimation"""
    document_id: int
    practice_area: str
    claim_amount: Optional[float] = Field(None, description="Claimed amount in USD", gt=0)
    case_type: Optional[str] = None


class TimelinePredictionRequest(BaseModel):
    """Request for timeline prediction"""
    practice_area: str
    case_stage: str = Field(
        "filing",
        description="Current case stage (filing, discovery, pre_trial, trial, post_trial)"
    )
    case_type: Optional[str] = None
    jurisdiction: Optional[str] = None


class CaseStrengthRequest(BaseModel):
    """Request for case strength analysis"""
    document_id: int
    practice_area: str
    plaintiff_perspective: bool = Field(
        True,
        description="Analyze from plaintiff perspective (True) or defendant (False)"
    )


# ==================== ENDPOINTS ====================

@router.post("/predict-outcome")
async def predict_litigation_outcome(
    request: OutcomePredictionRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Predict litigation outcome based on historical data

    Analyzes similar cases and risk factors to predict:
    - Probability of plaintiff victory
    - Probability of defendant victory
    - Probability of settlement
    - Probability of dismissal

    Returns probabilities, confidence score, and recommendations.
    """
    try:
        # Verify document access
        document = session.get(Document, request.document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        ensure_tenant_isolation(current_user, document.firm_id)

        # Get analytics service
        analytics_service = get_predictive_analytics_service(session)

        # Predict outcome
        prediction = await analytics_service.predict_litigation_outcome(
            document_id=request.document_id,
            practice_area=request.practice_area,
            case_type=request.case_type,
            jurisdiction=request.jurisdiction
        )

        logger.info(
            f"Outcome prediction for document {request.document_id} by user {current_user.id}"
        )

        return {
            "success": True,
            "document_id": request.document_id,
            "prediction": prediction
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting outcome: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to predict litigation outcome"
        )


@router.post("/estimate-settlement")
async def estimate_settlement_amount(
    request: SettlementEstimationRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Estimate potential settlement amount based on historical data

    Analyzes similar cases to provide:
    - Settlement range (low, expected, high)
    - Statistical distribution of settlements
    - Confidence level
    - Recommendations

    Adjusts estimates based on claim amount if provided.
    """
    try:
        # Verify document access
        document = session.get(Document, request.document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        ensure_tenant_isolation(current_user, document.firm_id)

        # Get analytics service
        analytics_service = get_predictive_analytics_service(session)

        # Estimate settlement
        estimation = await analytics_service.estimate_settlement_amount(
            document_id=request.document_id,
            practice_area=request.practice_area,
            claim_amount=request.claim_amount,
            case_type=request.case_type
        )

        logger.info(
            f"Settlement estimation for document {request.document_id} by user {current_user.id}"
        )

        return {
            "success": True,
            "document_id": request.document_id,
            "estimation": estimation
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error estimating settlement: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to estimate settlement amount"
        )


@router.post("/predict-timeline")
async def predict_case_timeline(
    request: TimelinePredictionRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Predict case timeline from current stage to resolution

    Provides:
    - Estimated duration (optimistic, expected, pessimistic)
    - Key milestone dates
    - Factors affecting timeline
    - Confidence level

    Based on historical data for similar cases.
    """
    try:
        # Get analytics service
        analytics_service = get_predictive_analytics_service(session)

        # Predict timeline
        timeline = await analytics_service.predict_case_timeline(
            practice_area=request.practice_area,
            case_stage=request.case_stage,
            case_type=request.case_type,
            jurisdiction=request.jurisdiction
        )

        logger.info(
            f"Timeline prediction for {request.practice_area} by user {current_user.id}"
        )

        return {
            "success": True,
            "timeline": timeline
        }

    except Exception as e:
        logger.error(f"Error predicting timeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to predict case timeline"
        )


@router.post("/analyze-strength")
async def analyze_case_strength(
    request: CaseStrengthRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyze overall case strength from specified perspective

    Provides:
    - Strength score (0-10)
    - Strength category (Very Strong, Strong, Moderate, Weak, Very Weak)
    - List of strengths
    - List of weaknesses
    - Key factors
    - Recommendations
    - Confidence level

    Can analyze from plaintiff or defendant perspective.
    """
    try:
        # Verify document access
        document = session.get(Document, request.document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        ensure_tenant_isolation(current_user, document.firm_id)

        # Get analytics service
        analytics_service = get_predictive_analytics_service(session)

        # Analyze strength
        analysis = await analytics_service.analyze_case_strength(
            document_id=request.document_id,
            practice_area=request.practice_area,
            plaintiff_perspective=request.plaintiff_perspective
        )

        logger.info(
            f"Case strength analysis for document {request.document_id} by user {current_user.id}"
        )

        return {
            "success": True,
            "document_id": request.document_id,
            "analysis": analysis
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing case strength: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze case strength"
        )


@router.get("/document/{document_id}/full-analysis")
async def get_comprehensive_analysis(
    document_id: int,
    practice_area: str = Query(..., description="Practice area"),
    case_type: Optional[str] = Query(None, description="Case type"),
    jurisdiction: Optional[str] = Query(None, description="Jurisdiction"),
    claim_amount: Optional[float] = Query(None, description="Claim amount", gt=0),
    plaintiff_perspective: bool = Query(True, description="Analyze from plaintiff perspective"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive predictive analysis for a document

    Combines all analytics:
    - Outcome prediction
    - Settlement estimation
    - Timeline prediction
    - Case strength analysis

    Returns a complete analytical report in one request.
    """
    try:
        # Verify document access
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        ensure_tenant_isolation(current_user, document.firm_id)

        # Get analytics service
        analytics_service = get_predictive_analytics_service(session)

        # Run all analyses in parallel (async)
        outcome_prediction = await analytics_service.predict_litigation_outcome(
            document_id=document_id,
            practice_area=practice_area,
            case_type=case_type,
            jurisdiction=jurisdiction
        )

        settlement_estimation = await analytics_service.estimate_settlement_amount(
            document_id=document_id,
            practice_area=practice_area,
            claim_amount=claim_amount,
            case_type=case_type
        )

        timeline_prediction = await analytics_service.predict_case_timeline(
            practice_area=practice_area,
            case_stage="filing",
            case_type=case_type,
            jurisdiction=jurisdiction
        )

        case_strength = await analytics_service.analyze_case_strength(
            document_id=document_id,
            practice_area=practice_area,
            plaintiff_perspective=plaintiff_perspective
        )

        logger.info(
            f"Comprehensive analysis for document {document_id} by user {current_user.id}"
        )

        return {
            "success": True,
            "document_id": document_id,
            "document_name": document.filename,
            "practice_area": practice_area,
            "analysis": {
                "outcome_prediction": outcome_prediction,
                "settlement_estimation": settlement_estimation,
                "timeline_prediction": timeline_prediction,
                "case_strength": case_strength
            },
            "generated_at": document.created_at.isoformat() if document.created_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating comprehensive analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate comprehensive analysis"
        )


@router.get("/practice-areas")
async def get_supported_practice_areas(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get list of supported practice areas for analytics

    Returns practice areas with their configuration and data availability.
    """
    practice_areas = [
        {
            "id": "personal_injury",
            "name": "Personal Injury",
            "description": "Personal injury claims and litigation",
            "supported_analytics": ["outcome", "settlement", "timeline", "strength"]
        },
        {
            "id": "corporate",
            "name": "Corporate Law",
            "description": "Corporate disputes and commercial litigation",
            "supported_analytics": ["outcome", "settlement", "timeline", "strength"]
        },
        {
            "id": "employment",
            "name": "Employment Law",
            "description": "Employment disputes and labor law",
            "supported_analytics": ["outcome", "settlement", "timeline", "strength"]
        },
        {
            "id": "real_estate",
            "name": "Real Estate",
            "description": "Real estate transactions and disputes",
            "supported_analytics": ["outcome", "settlement", "timeline", "strength"]
        },
        {
            "id": "intellectual_property",
            "name": "Intellectual Property",
            "description": "IP disputes and patent litigation",
            "supported_analytics": ["outcome", "settlement", "timeline", "strength"]
        }
    ]

    return {
        "success": True,
        "practice_areas": practice_areas,
        "total": len(practice_areas)
    }


@router.get("/case-stages")
async def get_supported_case_stages(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get list of supported case stages for timeline prediction

    Returns case stages with descriptions.
    """
    case_stages = [
        {
            "id": "filing",
            "name": "Filing",
            "description": "Initial case filing stage",
            "typical_duration": "Full case duration"
        },
        {
            "id": "discovery",
            "name": "Discovery",
            "description": "Evidence gathering and discovery phase",
            "typical_duration": "70% of remaining duration"
        },
        {
            "id": "pre_trial",
            "name": "Pre-Trial",
            "description": "Pre-trial motions and preparation",
            "typical_duration": "40% of remaining duration"
        },
        {
            "id": "trial",
            "name": "Trial",
            "description": "Active trial proceedings",
            "typical_duration": "20% of remaining duration"
        },
        {
            "id": "post_trial",
            "name": "Post-Trial",
            "description": "Post-trial motions and appeals",
            "typical_duration": "10% of remaining duration"
        }
    ]

    return {
        "success": True,
        "case_stages": case_stages,
        "total": len(case_stages)
    }
