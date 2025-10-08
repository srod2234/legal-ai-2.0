"""
Case Research API Endpoints for LEGAL 3.0
Provides endpoints for case law search and precedent analysis
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_session
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.document import Document
from app.models.case_precedent import CasePrecedent
from app.services.case_library_service import CaseLibraryService, CaseRankingService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cases", tags=["Case Research"])


# ==================== Request/Response Models ====================

class CaseSearchRequest(BaseModel):
    """Request to search for cases"""
    query: str
    practice_area: Optional[str] = None
    jurisdiction: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = 20


class CaseSearchResponse(BaseModel):
    """Response with case search results"""
    case_id: str
    case_name: str
    citation: str
    court: str
    decision_date: Optional[datetime]
    summary: Optional[str]
    relevance_score: float
    jurisdiction: Optional[str]


class CaseDetailResponse(BaseModel):
    """Detailed case information"""
    case_id: str
    case_name: str
    citation: str
    court: str
    decision_date: Optional[datetime]
    summary: Optional[str]
    full_text: Optional[str]
    judges: Optional[List[str]]
    parties: Optional[List[str]]
    outcome: Optional[str]
    precedent_value: Optional[str]
    jurisdiction: Optional[str]
    url: Optional[str]


class PrecedentAnalysisResponse(BaseModel):
    """Analysis of case precedents for a document"""
    document_id: int
    precedent_count: int
    top_precedents: List[dict]
    average_relevance: float
    analysis_date: str


class CaseRelevanceResponse(BaseModel):
    """Relevance analysis for a case"""
    case_name: str
    citation: str
    relevance_score: float
    relevance_factors: List[str]
    recommendation: str
    confidence: float


# ==================== Endpoints ====================

@router.get("/search", response_model=List[CaseSearchResponse])
async def search_cases(
    query: str = Query(..., description="Search query for cases"),
    practice_area: Optional[str] = Query(None, description="Filter by practice area"),
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search for cases using CourtListener API

    Searches across 1M+ cases with filters for:
    - Practice area
    - Jurisdiction
    - Date range
    """
    try:
        # Get case library service
        case_service = CaseLibraryService(session)

        # Perform search
        logger.info(f"Searching cases: query='{query}', jurisdiction={jurisdiction}, user={current_user.id}")

        results = await case_service.search_cases(
            query=query,
            practice_area=practice_area,
            jurisdiction=jurisdiction,
            date_from=date_from,
            date_to=date_to,
            limit=limit
        )

        # Convert to response format
        return [
            CaseSearchResponse(
                case_id=case.case_id,
                case_name=case.case_name,
                citation=case.citation,
                court=case.court,
                decision_date=case.decision_date,
                summary=case.summary,
                relevance_score=case.relevance_score,
                jurisdiction=case.jurisdiction
            )
            for case in results
        ]

    except Exception as e:
        logger.error(f"Error searching cases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Case search failed"
        )


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case_details(
    case_id: str,
    save_to_db: bool = Query(True, description="Save case to database"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific case"""
    try:
        # Get case library service
        case_service = CaseLibraryService(session)

        # Get case details
        logger.info(f"Getting case details: case_id={case_id}, user={current_user.id}")

        case_detail = await case_service.get_case_details(
            case_id,
            save_to_db=save_to_db
        )

        if not case_detail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )

        return CaseDetailResponse(
            case_id=case_detail.case_id,
            case_name=case_detail.case_name,
            citation=case_detail.citation,
            court=case_detail.court,
            decision_date=case_detail.decision_date,
            summary=case_detail.summary,
            full_text=case_detail.full_text,
            judges=case_detail.judges,
            parties=case_detail.parties,
            outcome=case_detail.outcome,
            precedent_value=case_detail.precedent_value,
            jurisdiction=case_detail.jurisdiction,
            url=case_detail.url
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting case details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve case details"
        )


@router.get("/precedents/{document_id}", response_model=PrecedentAnalysisResponse)
async def get_document_precedents(
    document_id: int,
    limit: int = Query(10, ge=1, le=50, description="Maximum precedents"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get relevant case precedents for a document"""
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

        # Get case library service
        case_service = CaseLibraryService(session)

        # Find relevant precedents
        logger.info(f"Finding precedents for document {document_id}, user={current_user.id}")

        precedents = await case_service.find_relevant_cases_for_document(
            document,
            limit=limit
        )

        # Analyze relevance for each
        analyzed_precedents = []
        total_relevance = 0.0

        for case in precedents:
            relevance = await case_service.analyze_case_relevance(case, document)
            analyzed_precedents.append({
                "case_name": case.case_name,
                "citation": case.citation,
                "court": case.court,
                "relevance_score": relevance["relevance_score"],
                "relevance_factors": relevance["relevance_factors"],
                "recommendation": relevance["recommendation"]
            })
            total_relevance += relevance["relevance_score"]

        # Sort by relevance
        analyzed_precedents.sort(key=lambda x: x["relevance_score"], reverse=True)

        avg_relevance = total_relevance / len(analyzed_precedents) if analyzed_precedents else 0.0

        return PrecedentAnalysisResponse(
            document_id=document_id,
            precedent_count=len(analyzed_precedents),
            top_precedents=analyzed_precedents,
            average_relevance=round(avg_relevance, 2),
            analysis_date=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document precedents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve precedents"
        )


@router.post("/relevant", response_model=List[CaseSearchResponse])
async def find_relevant_cases(
    request: CaseSearchRequest,
    document_id: Optional[int] = Query(None, description="Context document ID"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Find cases relevant to a query or document

    If document_id is provided, uses document context for better relevance
    """
    try:
        # Get case library service
        case_service = CaseLibraryService(session)

        # Get document context if provided
        document = None
        if document_id:
            document = session.get(Document, document_id)
            if document and document.user_id != current_user.id and current_user.role.value != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )

        # Search cases
        results = await case_service.search_cases(
            query=request.query,
            practice_area=request.practice_area or (document.practice_area if document else None),
            jurisdiction=request.jurisdiction or (document.jurisdiction if document else None),
            date_from=request.date_from,
            date_to=request.date_to,
            limit=request.limit
        )

        # If document provided, rank by relevance
        if document and results:
            ranking_service = CaseRankingService()
            ranked = ranking_service.rank_cases_by_relevance(
                results,
                document=document,
                practice_area=request.practice_area
            )

            # Convert ranked results
            return [
                CaseSearchResponse(
                    case_id=item["case"].case_id,
                    case_name=item["case"].case_name,
                    citation=item["case"].citation,
                    court=item["case"].court,
                    decision_date=item["case"].decision_date,
                    summary=item["case"].summary,
                    relevance_score=item["final_score"],
                    jurisdiction=item["case"].jurisdiction
                )
                for item in ranked
            ]
        else:
            # Return unranked results
            return [
                CaseSearchResponse(
                    case_id=case.case_id,
                    case_name=case.case_name,
                    citation=case.citation,
                    court=case.court,
                    decision_date=case.decision_date,
                    summary=case.summary,
                    relevance_score=case.relevance_score,
                    jurisdiction=case.jurisdiction
                )
                for case in results
            ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding relevant cases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to find relevant cases"
        )


@router.get("/analytics/outcomes", response_model=dict)
async def get_case_outcome_statistics(
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction"),
    practice_area: Optional[str] = Query(None, description="Filter by practice area"),
    date_from: Optional[datetime] = Query(None, description="Start date"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get statistics on case outcomes

    Provides analytics on case outcomes filtered by:
    - Jurisdiction
    - Practice area
    - Date range
    """
    try:
        # Get case library service
        case_service = CaseLibraryService(session)

        # Get outcome statistics
        logger.info(
            f"Getting outcome statistics: jurisdiction={jurisdiction}, "
            f"practice_area={practice_area}, user={current_user.id}"
        )

        stats = await case_service.get_case_outcome_statistics(
            jurisdiction=jurisdiction,
            practice_area=practice_area,
            date_from=date_from
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting outcome statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve outcome statistics"
        )


@router.get("/saved", response_model=List[dict])
async def get_saved_cases(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all cases saved to the database"""
    try:
        from sqlmodel import select

        # Query saved cases
        statement = (
            select(CasePrecedent)
            .order_by(CasePrecedent.created_at.desc())
            .limit(50)
        )

        cases = session.exec(statement).all()

        return [
            {
                "id": case.id,
                "case_name": case.case_name,
                "citation": case.citation,
                "court": case.court,
                "decision_date": case.decision_date.isoformat() if case.decision_date else None,
                "jurisdiction": case.jurisdiction,
                "created_at": case.created_at.isoformat()
            }
            for case in cases
        ]

    except Exception as e:
        logger.error(f"Error getting saved cases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve saved cases"
        )
