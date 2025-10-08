"""
Risk Analysis Service for LEGAL 3.0
Analyzes contract risk, generates scores, and provides recommendations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlmodel import Session
import logging

from app.models.document import Document
from app.models.contract_clause import ContractClause, ContractClauseCreate
from app.models.risk_assessment import RiskAssessment, RiskAssessmentCreate
from app.services.clause_extraction_service import (
    get_clause_extraction_service,
    ExtractedClause,
    ClauseType
)
from app.services.case_library_service import CaseLibraryService

logger = logging.getLogger(__name__)


class RiskLevel(str):
    """Risk level classifications"""
    CRITICAL = "critical"  # 8.0-10.0
    HIGH = "high"          # 6.0-7.9
    MEDIUM = "medium"      # 4.0-5.9
    LOW = "low"            # 2.0-3.9
    MINIMAL = "minimal"    # 0.0-1.9


class RiskAnalysisService:
    """
    Service for analyzing contract risk
    Combines clause analysis, precedent research, and risk scoring
    """

    # Risk weights for different clause types (0-10 scale)
    CLAUSE_RISK_WEIGHTS = {
        ClauseType.INDEMNIFICATION: 8.5,
        ClauseType.LIABILITY_LIMITATION: 7.0,
        ClauseType.ARBITRATION: 6.5,
        ClauseType.NON_COMPETE: 7.5,
        ClauseType.INTELLECTUAL_PROPERTY: 8.0,
        ClauseType.AUTOMATIC_RENEWAL: 6.0,
        ClauseType.CHANGE_OF_CONTROL: 7.0,
        ClauseType.TERMINATION: 5.5,
        ClauseType.PAYMENT_TERMS: 6.0,
        ClauseType.CONFIDENTIALITY: 5.0,
        ClauseType.WARRANTY: 5.5,
        ClauseType.DISPUTE_RESOLUTION: 4.5,
        ClauseType.DATA_PROTECTION: 7.5,
        ClauseType.ASSIGNMENT: 4.0,
        ClauseType.GOVERNING_LAW: 3.5,
        ClauseType.FORCE_MAJEURE: 4.0,
        ClauseType.NOTICE: 2.0,
        ClauseType.SEVERABILITY: 1.5,
        ClauseType.ENTIRE_AGREEMENT: 1.5,
        ClauseType.AMENDMENT: 3.0,
    }

    def __init__(self, session: Session):
        """Initialize risk analysis service"""
        self.session = session
        self.clause_service = get_clause_extraction_service()
        self.case_service = CaseLibraryService(session)

    async def analyze_document_risk(
        self,
        document: Document,
        document_text: str,
        include_precedents: bool = True
    ) -> Dict[str, Any]:
        """
        Perform comprehensive risk analysis on a document

        Args:
            document: Document object
            document_text: Full text of document
            include_precedents: Whether to search for relevant precedents

        Returns:
            Complete risk analysis report
        """
        logger.info(f"Analyzing risk for document: {document.id}")

        # Extract clauses
        clauses = self.clause_service.extract_clauses(document_text)

        # Analyze each clause
        clause_analyses = []
        total_risk_score = 0.0
        high_risk_clauses = []

        for clause in clauses:
            analysis = self._analyze_clause_risk(clause)
            clause_analyses.append(analysis)
            total_risk_score += analysis["risk_score"]

            if analysis["risk_level"] in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
                high_risk_clauses.append(analysis)

        # Calculate overall risk score
        if clauses:
            average_risk = total_risk_score / len(clauses)
        else:
            average_risk = 0.0

        # Adjust for high-risk clauses
        if high_risk_clauses:
            # Boost risk score if many high-risk clauses
            boost = min(len(high_risk_clauses) * 0.5, 3.0)
            average_risk = min(average_risk + boost, 10.0)

        overall_risk_level = self._calculate_risk_level(average_risk)

        # Find relevant precedents if requested
        precedents = []
        if include_precedents and document.practice_area:
            precedents = await self._find_relevant_precedents(
                document,
                high_risk_clauses
            )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            clauses,
            clause_analyses,
            high_risk_clauses
        )

        # Create risk assessment record
        risk_assessment = await self._save_risk_assessment(
            document,
            average_risk,
            overall_risk_level,
            clauses,
            clause_analyses,
            recommendations
        )

        return {
            "document_id": document.id,
            "overall_risk_score": round(average_risk, 2),
            "overall_risk_level": overall_risk_level,
            "total_clauses_analyzed": len(clauses),
            "high_risk_clause_count": len(high_risk_clauses),
            "clauses": clause_analyses,
            "high_risk_clauses": high_risk_clauses,
            "precedents": precedents[:5] if precedents else [],  # Top 5
            "recommendations": recommendations,
            "risk_assessment_id": risk_assessment.id if risk_assessment else None,
            "analysis_date": datetime.now().isoformat()
        }

    def _analyze_clause_risk(self, clause: ExtractedClause) -> Dict[str, Any]:
        """
        Analyze risk for a single clause

        Args:
            clause: Extracted clause

        Returns:
            Clause risk analysis
        """
        # Base risk from clause type
        base_risk = self.CLAUSE_RISK_WEIGHTS.get(clause.clause_type, 3.0)

        # Adjust for risk indicators
        risk_indicator_penalty = len(clause.risk_indicators) * 0.5
        total_risk = min(base_risk + risk_indicator_penalty, 10.0)

        # Adjust for confidence (low confidence = lower risk score)
        confidence_adjusted_risk = total_risk * clause.confidence

        risk_level = self._calculate_risk_level(confidence_adjusted_risk)

        return {
            "clause_type": clause.clause_type.value,
            "clause_text": clause.clause_text[:200] + "..." if len(clause.clause_text) > 200 else clause.clause_text,
            "full_text_length": len(clause.clause_text),
            "risk_score": round(confidence_adjusted_risk, 2),
            "risk_level": risk_level,
            "base_risk": round(base_risk, 2),
            "risk_indicators": clause.risk_indicators,
            "risk_indicator_count": len(clause.risk_indicators),
            "confidence": round(clause.confidence, 2),
            "section_number": clause.section_number,
            "section_title": clause.section_title,
            "keywords_matched": clause.keywords_matched
        }

    def _calculate_risk_level(self, risk_score: float) -> str:
        """
        Calculate risk level from numeric score

        Args:
            risk_score: Numeric risk score (0-10)

        Returns:
            Risk level string
        """
        if risk_score >= 8.0:
            return RiskLevel.CRITICAL
        elif risk_score >= 6.0:
            return RiskLevel.HIGH
        elif risk_score >= 4.0:
            return RiskLevel.MEDIUM
        elif risk_score >= 2.0:
            return RiskLevel.LOW
        else:
            return RiskLevel.MINIMAL

    async def _find_relevant_precedents(
        self,
        document: Document,
        high_risk_clauses: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Find case precedents relevant to high-risk clauses

        Args:
            document: Document being analyzed
            high_risk_clauses: List of high-risk clause analyses

        Returns:
            List of relevant precedents
        """
        if not high_risk_clauses:
            return []

        # Build search query from high-risk clause types
        clause_types = list(set(c["clause_type"] for c in high_risk_clauses))
        search_terms = " ".join(clause_types)

        try:
            # Search for relevant cases
            cases = await self.case_service.search_cases(
                query=search_terms,
                practice_area=document.practice_area,
                jurisdiction=document.jurisdiction,
                limit=10
            )

            precedents = []
            for case in cases:
                # Analyze relevance
                relevance = await self.case_service.analyze_case_relevance(
                    case,
                    document
                )
                precedents.append({
                    "case_name": case.case_name,
                    "citation": case.citation,
                    "court": case.court,
                    "relevance_score": relevance["relevance_score"],
                    "relevance_factors": relevance["relevance_factors"]
                })

            # Sort by relevance
            precedents.sort(key=lambda x: x["relevance_score"], reverse=True)
            return precedents

        except Exception as e:
            logger.error(f"Error finding precedents: {e}")
            return []

    def _generate_recommendations(
        self,
        clauses: List[ExtractedClause],
        clause_analyses: List[Dict[str, Any]],
        high_risk_clauses: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """
        Generate risk mitigation recommendations

        Args:
            clauses: Extracted clauses
            clause_analyses: Clause risk analyses
            high_risk_clauses: High-risk clauses

        Returns:
            List of recommendations
        """
        recommendations = []

        # General recommendations based on high-risk clauses
        if high_risk_clauses:
            recommendations.append({
                "priority": "high",
                "category": "general",
                "recommendation": f"Document contains {len(high_risk_clauses)} high-risk clause(s). Attorney review strongly recommended before execution."
            })

        # Specific recommendations by clause type
        clause_types_present = set(c.clause_type for c in clauses)

        if ClauseType.INDEMNIFICATION in clause_types_present:
            indemnity_clauses = [c for c in clause_analyses if c["clause_type"] == ClauseType.INDEMNIFICATION.value]
            if any(c["risk_level"] in [RiskLevel.CRITICAL, RiskLevel.HIGH] for c in indemnity_clauses):
                recommendations.append({
                    "priority": "critical",
                    "category": "indemnification",
                    "recommendation": "Indemnification clause requires careful review. Consider negotiating caps on indemnity obligations and excluding consequential damages."
                })

        if ClauseType.LIABILITY_LIMITATION in clause_types_present:
            liability_clauses = [c for c in clause_analyses if c["clause_type"] == ClauseType.LIABILITY_LIMITATION.value]
            if any("no limit" in str(c.get("risk_indicators", [])).lower() for c in liability_clauses):
                recommendations.append({
                    "priority": "high",
                    "category": "liability",
                    "recommendation": "Liability limitation clause may be insufficient. Negotiate specific cap amounts and exclusions."
                })

        if ClauseType.AUTOMATIC_RENEWAL in clause_types_present:
            recommendations.append({
                "priority": "medium",
                "category": "termination",
                "recommendation": "Automatic renewal clause detected. Set calendar reminders for notice periods to avoid unintended renewal."
            })

        if ClauseType.NON_COMPETE in clause_types_present:
            non_compete_clauses = [c for c in clause_analyses if c["clause_type"] == ClauseType.NON_COMPETE.value]
            if any("broad scope" in str(c.get("risk_indicators", [])).lower() for c in non_compete_clauses):
                recommendations.append({
                    "priority": "high",
                    "category": "restrictions",
                    "recommendation": "Non-compete clause appears overly broad. Consider negotiating geographic and temporal limitations."
                })

        if ClauseType.DATA_PROTECTION in clause_types_present:
            recommendations.append({
                "priority": "medium",
                "category": "compliance",
                "recommendation": "Ensure data protection obligations comply with GDPR, CCPA, and other applicable privacy laws."
            })

        # Add general recommendation if no specific ones
        if not recommendations:
            recommendations.append({
                "priority": "low",
                "category": "general",
                "recommendation": "Standard contract review recommended. No critical risk factors identified."
            })

        return recommendations

    async def _save_risk_assessment(
        self,
        document: Document,
        risk_score: float,
        risk_level: str,
        clauses: List[ExtractedClause],
        clause_analyses: List[Dict[str, Any]],
        recommendations: List[Dict[str, str]]
    ) -> Optional[RiskAssessment]:
        """
        Save risk assessment to database

        Args:
            document: Document analyzed
            risk_score: Overall risk score
            risk_level: Overall risk level
            clauses: Extracted clauses
            clause_analyses: Clause analyses
            recommendations: Generated recommendations

        Returns:
            RiskAssessment object or None
        """
        try:
            # Save contract clauses first
            for clause in clauses:
                clause_analysis = next(
                    (c for c in clause_analyses if c["clause_type"] == clause.clause_type.value),
                    None
                )

                clause_data = ContractClauseCreate(
                    document_id=document.id,
                    clause_type=clause.clause_type.value,
                    clause_text=clause.clause_text,
                    risk_score=clause_analysis["risk_score"] if clause_analysis else 0.0,
                    risk_level=clause_analysis["risk_level"] if clause_analysis else RiskLevel.MINIMAL,
                    section_number=clause.section_number,
                    section_title=clause.section_title,
                    confidence_score=clause.confidence,
                    risk_factors=clause.risk_indicators,
                    keywords_matched=clause.keywords_matched
                )

                db_clause = ContractClause.model_validate(clause_data)
                self.session.add(db_clause)

            # Save risk assessment
            assessment_data = RiskAssessmentCreate(
                document_id=document.id,
                overall_risk_score=risk_score,
                risk_level=risk_level,
                high_risk_clause_count=len([c for c in clause_analyses if c["risk_level"] in [RiskLevel.CRITICAL, RiskLevel.HIGH]]),
                medium_risk_clause_count=len([c for c in clause_analyses if c["risk_level"] == RiskLevel.MEDIUM]),
                low_risk_clause_count=len([c for c in clause_analyses if c["risk_level"] in [RiskLevel.LOW, RiskLevel.MINIMAL]]),
                critical_issues=[r["recommendation"] for r in recommendations if r["priority"] == "critical"],
                recommendations=[r["recommendation"] for r in recommendations],
                confidence_score=sum(c.confidence for c in clauses) / len(clauses) if clauses else 0.0
            )

            assessment = RiskAssessment.model_validate(assessment_data)
            self.session.add(assessment)
            self.session.commit()
            self.session.refresh(assessment)

            # Update document risk fields
            document.risk_score = risk_score
            document.risk_level = risk_level
            document.has_high_risk_clauses = any(
                c["risk_level"] in [RiskLevel.CRITICAL, RiskLevel.HIGH]
                for c in clause_analyses
            )
            document.last_risk_analysis = datetime.now()
            document.risk_analysis_complete = True
            self.session.add(document)
            self.session.commit()

            logger.info(f"Saved risk assessment {assessment.id} for document {document.id}")
            return assessment

        except Exception as e:
            logger.error(f"Error saving risk assessment: {e}")
            self.session.rollback()
            return None


# ==================== Factory Function ====================

def get_risk_analysis_service(session: Session) -> RiskAnalysisService:
    """Factory function to create RiskAnalysisService"""
    return RiskAnalysisService(session)
