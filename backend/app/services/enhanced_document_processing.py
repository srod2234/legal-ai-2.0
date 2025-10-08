"""
Enhanced Document Processing Service for LEGAL 3.0
Extends base document processing with legal-specific analysis
"""
from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import Session
import logging

from app.models.document import Document, ProcessingStatus
from app.services.clause_extraction_service import get_clause_extraction_service
from app.services.risk_analysis_service import get_risk_analysis_service
from app.services.case_library_service import CaseLibraryService
from app.services.legal_citation_parser import get_citation_parser

logger = logging.getLogger(__name__)


class EnhancedDocumentProcessingService:
    """
    Enhanced document processing with LEGAL 3.0 features
    - Clause extraction and classification
    - Risk assessment and scoring
    - Case precedent matching
    - Citation extraction and validation
    """

    def __init__(self, session: Session):
        """Initialize enhanced processing service"""
        self.session = session
        self.clause_service = get_clause_extraction_service()
        self.risk_service = get_risk_analysis_service(session)
        self.case_service = CaseLibraryService(session)
        self.citation_parser = get_citation_parser()

    async def process_legal_document(
        self,
        document: Document,
        extracted_text: str,
        enable_precedent_search: bool = True
    ) -> Dict[str, Any]:
        """
        Perform comprehensive legal analysis on a document

        Args:
            document: Document object from database
            extracted_text: Extracted text content
            enable_precedent_search: Whether to search for precedents

        Returns:
            Dictionary with analysis results
        """
        logger.info(f"Starting legal analysis for document {document.id}")

        try:
            results = {
                "document_id": document.id,
                "analysis_started": datetime.now().isoformat(),
                "steps_completed": []
            }

            # Step 1: Extract and classify clauses
            logger.info(f"[{document.id}] Step 1: Extracting clauses")
            clauses = await self._extract_clauses(document, extracted_text)
            results["clauses_extracted"] = len(clauses)
            results["steps_completed"].append("clause_extraction")

            # Update document status
            document.clause_extraction_complete = True
            self.session.add(document)
            self.session.commit()

            # Step 2: Perform risk analysis
            logger.info(f"[{document.id}] Step 2: Analyzing risk")
            risk_analysis = await self._analyze_risk(
                document,
                extracted_text,
                enable_precedent_search
            )
            results["risk_analysis"] = risk_analysis
            results["steps_completed"].append("risk_analysis")

            # Update document risk fields
            document.risk_analysis_complete = True
            self.session.add(document)
            self.session.commit()

            # Step 3: Extract and validate citations
            logger.info(f"[{document.id}] Step 3: Extracting citations")
            citations = await self._extract_citations(document, extracted_text)
            results["citations_extracted"] = len(citations)
            results["steps_completed"].append("citation_extraction")

            # Step 4: Find relevant precedents (if enabled and applicable)
            if enable_precedent_search and document.practice_area:
                logger.info(f"[{document.id}] Step 4: Finding precedents")
                precedents = await self._find_precedents(document)
                results["precedents_found"] = len(precedents)
                results["top_precedents"] = precedents[:5]
                results["steps_completed"].append("precedent_search")

                # Update document
                document.precedent_research_complete = True
                document.precedent_count = len(precedents)
                document.relevant_cases_analyzed = len(precedents)
                document.last_precedent_search = datetime.now()
                self.session.add(document)
                self.session.commit()

            # Step 5: Calculate analysis completeness
            completeness = self._calculate_completeness(document, results)
            document.analysis_completeness = completeness
            results["analysis_completeness"] = completeness

            # Final status update
            results["analysis_completed"] = datetime.now().isoformat()
            results["status"] = "success"

            logger.info(f"[{document.id}] Legal analysis completed successfully")
            return results

        except Exception as e:
            logger.error(f"Error in legal document processing for {document.id}: {e}")
            return {
                "document_id": document.id,
                "status": "error",
                "error": str(e),
                "steps_completed": results.get("steps_completed", [])
            }

    async def _extract_clauses(
        self,
        document: Document,
        text: str
    ) -> list:
        """Extract and classify contract clauses"""
        try:
            clauses = self.clause_service.extract_clauses(
                text,
                min_confidence=0.3
            )

            # Generate summary
            summary = self.clause_service.get_clause_summary(clauses)

            logger.info(
                f"[{document.id}] Extracted {len(clauses)} clauses "
                f"(high confidence: {summary['high_confidence_count']}, "
                f"with risks: {summary['clauses_with_risk_indicators']})"
            )

            return clauses

        except Exception as e:
            logger.error(f"Error extracting clauses for document {document.id}: {e}")
            return []

    async def _analyze_risk(
        self,
        document: Document,
        text: str,
        include_precedents: bool
    ) -> Dict[str, Any]:
        """Perform risk analysis on document"""
        try:
            risk_analysis = await self.risk_service.analyze_document_risk(
                document,
                text,
                include_precedents=include_precedents
            )

            logger.info(
                f"[{document.id}] Risk analysis complete: "
                f"Score={risk_analysis['overall_risk_score']}, "
                f"Level={risk_analysis['overall_risk_level']}, "
                f"High-risk clauses={risk_analysis['high_risk_clause_count']}"
            )

            return risk_analysis

        except Exception as e:
            logger.error(f"Error analyzing risk for document {document.id}: {e}")
            return {
                "overall_risk_score": 0.0,
                "overall_risk_level": "unknown",
                "error": str(e)
            }

    async def _extract_citations(
        self,
        document: Document,
        text: str
    ) -> list:
        """Extract and validate legal citations"""
        try:
            # Extract citations
            citations = self.case_service.extract_citations_from_document(
                document,
                text
            )

            # Validate citations
            if citations:
                validation = await self.case_service.validate_citations(citations)

                logger.info(
                    f"[{document.id}] Found {len(citations)} citations "
                    f"(valid: {validation['valid_count']}, "
                    f"invalid: {validation['invalid_count']})"
                )

                return citations
            else:
                logger.info(f"[{document.id}] No citations found")
                return []

        except Exception as e:
            logger.error(f"Error extracting citations for document {document.id}: {e}")
            return []

    async def _find_precedents(
        self,
        document: Document
    ) -> list:
        """Find relevant case precedents"""
        try:
            precedents = await self.case_service.find_relevant_cases_for_document(
                document,
                limit=10
            )

            if precedents:
                # Analyze relevance for each
                analyzed_precedents = []
                for case in precedents:
                    relevance = await self.case_service.analyze_case_relevance(
                        case,
                        document
                    )
                    analyzed_precedents.append({
                        "case_name": case.case_name,
                        "citation": case.citation,
                        "court": case.court,
                        "relevance_score": relevance["relevance_score"],
                        "relevance_factors": relevance["relevance_factors"],
                        "recommendation": relevance["recommendation"]
                    })

                # Sort by relevance
                analyzed_precedents.sort(
                    key=lambda x: x["relevance_score"],
                    reverse=True
                )

                logger.info(
                    f"[{document.id}] Found {len(analyzed_precedents)} relevant precedents "
                    f"(top score: {analyzed_precedents[0]['relevance_score'] if analyzed_precedents else 0})"
                )

                return analyzed_precedents
            else:
                logger.info(f"[{document.id}] No precedents found")
                return []

        except Exception as e:
            logger.error(f"Error finding precedents for document {document.id}: {e}")
            return []

    def _calculate_completeness(
        self,
        document: Document,
        results: Dict[str, Any]
    ) -> float:
        """
        Calculate analysis completeness percentage

        Args:
            document: Document object
            results: Analysis results

        Returns:
            Completeness score (0.0 - 1.0)
        """
        score = 0.0
        max_score = 5.0

        # Clause extraction (1 point)
        if "clause_extraction" in results.get("steps_completed", []):
            score += 1.0

        # Risk analysis (2 points - most important)
        if "risk_analysis" in results.get("steps_completed", []):
            score += 2.0

        # Citation extraction (1 point)
        if "citation_extraction" in results.get("steps_completed", []):
            score += 1.0

        # Precedent search (1 point)
        if "precedent_search" in results.get("steps_completed", []):
            score += 1.0

        completeness = score / max_score

        logger.info(f"[{document.id}] Analysis completeness: {completeness:.1%}")

        return completeness

    async def reanalyze_document(
        self,
        document_id: int,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Reanalyze a document that was already processed

        Args:
            document_id: ID of document to reanalyze
            force: Force reanalysis even if recently analyzed

        Returns:
            Analysis results
        """
        document = self.session.get(Document, document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")

        # Check if reanalysis is needed
        if not force and document.last_risk_analysis:
            time_since_analysis = datetime.now() - document.last_risk_analysis
            if time_since_analysis.days < 7:
                logger.info(
                    f"[{document_id}] Document analyzed recently, skipping "
                    f"(use force=True to override)"
                )
                return {
                    "status": "skipped",
                    "reason": "Recently analyzed",
                    "last_analysis": document.last_risk_analysis.isoformat()
                }

        # Get extracted text
        if not document.extracted_text:
            raise ValueError(f"Document {document_id} has no extracted text")

        # Perform analysis
        logger.info(f"[{document_id}] Starting reanalysis")
        return await self.process_legal_document(
            document,
            document.extracted_text,
            enable_precedent_search=True
        )

    async def get_document_analysis_status(
        self,
        document_id: int
    ) -> Dict[str, Any]:
        """
        Get the analysis status for a document

        Args:
            document_id: ID of document

        Returns:
            Status dictionary
        """
        document = self.session.get(Document, document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")

        return {
            "document_id": document_id,
            "clause_extraction_complete": document.clause_extraction_complete,
            "risk_analysis_complete": document.risk_analysis_complete,
            "precedent_research_complete": document.precedent_research_complete,
            "analysis_completeness": document.analysis_completeness or 0.0,
            "risk_score": document.risk_score,
            "risk_level": document.risk_level,
            "has_high_risk_clauses": document.has_high_risk_clauses,
            "precedent_count": document.precedent_count or 0,
            "last_risk_analysis": document.last_risk_analysis.isoformat() if document.last_risk_analysis else None,
            "last_precedent_search": document.last_precedent_search.isoformat() if document.last_precedent_search else None
        }


# ==================== Factory Function ====================

def get_enhanced_document_processing_service(
    session: Session
) -> EnhancedDocumentProcessingService:
    """Factory function to create EnhancedDocumentProcessingService"""
    return EnhancedDocumentProcessingService(session)
