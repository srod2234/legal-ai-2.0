"""
Case Library Service for LEGAL 3.0
Manages case law search, storage, ranking, and relevance analysis
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlmodel import Session, select
import logging

from app.models.case_precedent import CasePrecedent, CasePrecedentCreate
from app.models.document import Document
from app.core.external_apis import (
    get_courtlistener_client,
    CaseSearchResult,
    CaseDetail
)
from app.services.legal_citation_parser import (
    get_citation_parser,
    ParsedCitation,
    CitationType
)

logger = logging.getLogger(__name__)


class CaseLibraryService:
    """
    Service for managing case law library and precedent analysis
    Integrates external APIs with local database storage
    """

    def __init__(self, session: Session):
        """Initialize service with database session"""
        self.session = session
        self.api_client = get_courtlistener_client()
        self.citation_parser = get_citation_parser()

    async def search_cases(
        self,
        query: str,
        practice_area: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 20
    ) -> List[CaseSearchResult]:
        """
        Search for cases using external API

        Args:
            query: Search query
            practice_area: Filter by practice area
            jurisdiction: Filter by jurisdiction
            date_from: Filter from date
            date_to: Filter to date
            limit: Maximum results

        Returns:
            List of case search results
        """
        logger.info(f"Searching cases for query: {query}")

        # Enhance query with practice area
        enhanced_query = query
        if practice_area:
            enhanced_query = f"{query} {practice_area}"

        # Search via API
        results = await self.api_client.search_cases(
            query=enhanced_query,
            jurisdiction=jurisdiction,
            date_from=date_from,
            date_to=date_to,
            limit=limit
        )

        logger.info(f"Found {len(results)} cases")
        return results

    async def get_case_details(
        self,
        case_id: str,
        save_to_db: bool = True
    ) -> Optional[CaseDetail]:
        """
        Get detailed information about a specific case

        Args:
            case_id: External API case ID
            save_to_db: Whether to save case to database

        Returns:
            Detailed case information
        """
        # Check if already in database
        existing = self.session.exec(
            select(CasePrecedent).where(CasePrecedent.external_case_id == case_id)
        ).first()

        if existing:
            logger.info(f"Case {case_id} found in database")
            return self._case_precedent_to_detail(existing)

        # Fetch from API
        detail = await self.api_client.get_case_details(case_id)

        if detail and save_to_db:
            # Save to database
            await self._save_case_to_db(detail)

        return detail

    async def find_relevant_cases_for_document(
        self,
        document: Document,
        limit: int = 10
    ) -> List[CaseSearchResult]:
        """
        Find cases relevant to a specific document

        Args:
            document: Document to find cases for
            limit: Maximum results

        Returns:
            List of relevant cases
        """
        logger.info(f"Finding relevant cases for document: {document.id}")

        # Build search query from document metadata
        search_query = self._build_document_search_query(document)

        # Search for cases
        results = await self.search_cases(
            query=search_query,
            practice_area=document.practice_area,
            jurisdiction=document.jurisdiction,
            limit=limit
        )

        return results

    async def analyze_case_relevance(
        self,
        case: CaseSearchResult,
        document: Document,
        user_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze the relevance of a case to a document

        Args:
            case: Case to analyze
            document: Document to compare against
            user_context: Additional context from user

        Returns:
            Relevance analysis with score and reasoning
        """
        relevance_score = 0.0
        relevance_factors = []

        # Factor 1: Practice area match
        if document.practice_area and case.jurisdiction:
            if document.practice_area.lower() in case.case_name.lower():
                relevance_score += 0.25
                relevance_factors.append("Practice area match")

        # Factor 2: Jurisdiction match
        if document.jurisdiction and case.jurisdiction:
            if self._jurisdictions_match(document.jurisdiction, case.jurisdiction):
                relevance_score += 0.20
                relevance_factors.append("Jurisdiction match")

        # Factor 3: Temporal relevance (recent cases more relevant)
        if case.decision_date:
            years_old = (datetime.now() - case.decision_date).days / 365
            if years_old < 5:
                relevance_score += 0.15
                relevance_factors.append("Recent decision")
            elif years_old < 10:
                relevance_score += 0.10
                relevance_factors.append("Moderately recent")

        # Factor 4: API relevance score
        if case.relevance_score > 0:
            normalized_api_score = min(case.relevance_score / 100, 0.30)
            relevance_score += normalized_api_score
            relevance_factors.append(f"Search relevance ({case.relevance_score:.1f})")

        # Factor 5: Context match
        if user_context:
            # Simple keyword matching
            context_words = set(user_context.lower().split())
            case_words = set(case.case_name.lower().split())
            overlap = len(context_words & case_words)
            if overlap > 2:
                relevance_score += 0.10
                relevance_factors.append("Context keyword match")

        # Normalize to 0-10 scale
        relevance_score = min(relevance_score * 10, 10.0)

        return {
            "case_id": case.case_id,
            "case_name": case.case_name,
            "relevance_score": round(relevance_score, 2),
            "relevance_factors": relevance_factors,
            "confidence": round(min(relevance_score / 10, 1.0), 2),
            "recommendation": self._get_relevance_recommendation(relevance_score)
        }

    async def extract_citations_from_document(
        self,
        document: Document,
        document_text: str
    ) -> List[ParsedCitation]:
        """
        Extract legal citations from document text

        Args:
            document: Document object
            document_text: Full text of document

        Returns:
            List of parsed citations
        """
        logger.info(f"Extracting citations from document: {document.id}")

        citations = self.citation_parser.extract_citations_from_text(document_text)

        logger.info(f"Found {len(citations)} citations")
        return citations

    async def validate_citations(
        self,
        citations: List[ParsedCitation]
    ) -> Dict[str, Any]:
        """
        Validate a list of citations

        Args:
            citations: List of citations to validate

        Returns:
            Validation report
        """
        valid_count = 0
        invalid_citations = []

        for citation in citations:
            if self.citation_parser.validate_citation(citation):
                valid_count += 1
            else:
                invalid_citations.append({
                    "citation": citation.raw_citation,
                    "reason": "Invalid format or missing required fields"
                })

        return {
            "total_citations": len(citations),
            "valid_count": valid_count,
            "invalid_count": len(invalid_citations),
            "invalid_citations": invalid_citations,
            "validation_rate": round(valid_count / len(citations) * 100, 1) if citations else 0
        }

    async def get_case_outcome_statistics(
        self,
        jurisdiction: Optional[str] = None,
        practice_area: Optional[str] = None,
        date_from: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get statistics on case outcomes

        Args:
            jurisdiction: Filter by jurisdiction
            practice_area: Filter by practice area
            date_from: Start date for analysis

        Returns:
            Outcome statistics
        """
        query = select(CasePrecedent)

        if jurisdiction:
            query = query.where(CasePrecedent.jurisdiction == jurisdiction)

        if practice_area:
            query = query.where(CasePrecedent.practice_area == practice_area)

        if date_from:
            query = query.where(CasePrecedent.decision_date >= date_from)

        cases = self.session.exec(query).all()

        # Analyze outcomes
        outcome_counts: Dict[str, int] = {}
        total_cases = len(cases)

        for case in cases:
            outcome = case.outcome or "Unknown"
            outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

        return {
            "total_cases": total_cases,
            "jurisdiction": jurisdiction,
            "practice_area": practice_area,
            "outcome_breakdown": outcome_counts,
            "date_range": {
                "from": date_from.isoformat() if date_from else None,
                "to": datetime.now().isoformat()
            }
        }

    # ==================== Private Helper Methods ====================

    def _build_document_search_query(self, document: Document) -> str:
        """Build search query from document attributes"""
        query_parts = []

        # Add contract type
        if document.contract_type:
            query_parts.append(document.contract_type)

        # Add practice area
        if document.practice_area:
            query_parts.append(document.practice_area)

        # Add key terms from document name
        if document.filename:
            # Extract meaningful terms from filename
            name_parts = document.filename.replace("_", " ").replace("-", " ").split()
            # Take first 3 meaningful words
            query_parts.extend([p for p in name_parts if len(p) > 3][:3])

        return " ".join(query_parts)

    def _jurisdictions_match(self, jurisdiction1: str, jurisdiction2: str) -> bool:
        """Check if two jurisdictions are related"""
        j1 = jurisdiction1.lower()
        j2 = jurisdiction2.lower()

        # Exact match
        if j1 == j2:
            return True

        # Federal variations
        if "federal" in j1 and "federal" in j2:
            return True

        # State match
        if j1 in j2 or j2 in j1:
            return True

        return False

    def _get_relevance_recommendation(self, score: float) -> str:
        """Get recommendation based on relevance score"""
        if score >= 8.0:
            return "Highly relevant - Review immediately"
        elif score >= 6.0:
            return "Relevant - Include in analysis"
        elif score >= 4.0:
            return "Moderately relevant - Consider for context"
        else:
            return "Low relevance - Optional reference"

    async def _save_case_to_db(self, case_detail: CaseDetail) -> CasePrecedent:
        """Save case detail to database"""
        case_data = CasePrecedentCreate(
            external_case_id=case_detail.case_id,
            case_name=case_detail.case_name,
            citation=case_detail.citation,
            court=case_detail.court,
            decision_date=case_detail.decision_date,
            summary=case_detail.summary,
            full_text=case_detail.full_text,
            opinion_text=case_detail.opinion_text,
            judges=",".join(case_detail.judges) if case_detail.judges else None,
            parties_involved=",".join(case_detail.parties) if case_detail.parties else None,
            outcome=case_detail.outcome,
            precedent_value=case_detail.precedent_value,
            key_issues=case_detail.key_issues,
            legal_principles=case_detail.legal_principles,
            url=case_detail.url,
            jurisdiction=case_detail.jurisdiction
        )

        case = CasePrecedent.model_validate(case_data)
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)

        logger.info(f"Saved case to database: {case.id}")
        return case

    def _case_precedent_to_detail(self, case: CasePrecedent) -> CaseDetail:
        """Convert database CasePrecedent to CaseDetail"""
        return CaseDetail(
            case_id=case.external_case_id or str(case.id),
            case_name=case.case_name,
            citation=case.citation,
            court=case.court or "",
            decision_date=case.decision_date,
            summary=case.summary,
            full_text=case.full_text,
            opinion_text=case.opinion_text,
            judges=case.judges.split(",") if case.judges else None,
            parties=case.parties_involved.split(",") if case.parties_involved else None,
            outcome=case.outcome,
            precedent_value=case.precedent_value,
            key_issues=case.key_issues,
            legal_principles=case.legal_principles,
            url=case.url,
            jurisdiction=case.jurisdiction
        )


# ==================== Ranking and Scoring ====================

class CaseRankingService:
    """Service for ranking and scoring case precedents"""

    @staticmethod
    def rank_cases_by_relevance(
        cases: List[CaseSearchResult],
        document: Optional[Document] = None,
        practice_area: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Rank cases by relevance with detailed scoring

        Args:
            cases: List of cases to rank
            document: Optional document for context
            practice_area: Optional practice area filter

        Returns:
            Ranked cases with scores
        """
        ranked = []

        for case in cases:
            score = case.relevance_score

            # Boost for practice area match
            if practice_area and practice_area.lower() in case.case_name.lower():
                score += 10

            # Boost for recent cases
            if case.decision_date:
                years_old = (datetime.now() - case.decision_date).days / 365
                if years_old < 5:
                    score += 5

            # Boost for jurisdiction match
            if document and document.jurisdiction and case.jurisdiction:
                if document.jurisdiction.lower() in case.jurisdiction.lower():
                    score += 8

            ranked.append({
                "case": case,
                "final_score": round(score, 2),
                "rank": 0  # Will be set after sorting
            })

        # Sort by score
        ranked.sort(key=lambda x: x["final_score"], reverse=True)

        # Assign ranks
        for i, item in enumerate(ranked):
            item["rank"] = i + 1

        return ranked

    @staticmethod
    def calculate_precedent_strength(
        case: CasePrecedent,
        target_jurisdiction: Optional[str] = None
    ) -> float:
        """
        Calculate the strength of a precedent for a given jurisdiction

        Args:
            case: Case precedent
            target_jurisdiction: Target jurisdiction

        Returns:
            Strength score (0-10)
        """
        strength = 5.0  # Base score

        # Higher court = stronger precedent
        if case.court:
            if "Supreme" in case.court:
                strength += 3.0
            elif "Circuit" in case.court or "Appeal" in case.court:
                strength += 2.0
            elif "District" in case.court:
                strength += 1.0

        # Jurisdiction match
        if target_jurisdiction and case.jurisdiction:
            if case.jurisdiction.lower() == target_jurisdiction.lower():
                strength += 2.0

        # Recent cases slightly stronger
        if case.decision_date:
            years_old = (datetime.now() - case.decision_date).days / 365
            if years_old < 5:
                strength += 1.0

        # Published precedential decisions are stronger
        if case.precedent_value and "published" in case.precedent_value.lower():
            strength += 1.0

        return min(strength, 10.0)


# ==================== Factory Function ====================

def get_case_library_service(session: Session) -> CaseLibraryService:
    """Factory function to create CaseLibraryService"""
    return CaseLibraryService(session)
