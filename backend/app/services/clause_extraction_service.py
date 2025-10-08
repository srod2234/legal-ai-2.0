"""
Clause Extraction Service for LEGAL 3.0
Extracts and classifies contract clauses using NLP and pattern matching
"""
from typing import List, Dict, Any, Optional, Tuple
import re
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ClauseType(str, Enum):
    """Types of contract clauses"""
    INDEMNIFICATION = "indemnification"
    LIABILITY_LIMITATION = "liability_limitation"
    CONFIDENTIALITY = "confidentiality"
    TERMINATION = "termination"
    PAYMENT_TERMS = "payment_terms"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    DISPUTE_RESOLUTION = "dispute_resolution"
    GOVERNING_LAW = "governing_law"
    FORCE_MAJEURE = "force_majeure"
    WARRANTY = "warranty"
    NON_COMPETE = "non_compete"
    ASSIGNMENT = "assignment"
    NOTICE = "notice"
    SEVERABILITY = "severability"
    ENTIRE_AGREEMENT = "entire_agreement"
    AMENDMENT = "amendment"
    ARBITRATION = "arbitration"
    JURISDICTION = "jurisdiction"
    DAMAGES = "damages"
    INSURANCE = "insurance"
    REPRESENTATIONS = "representations"
    COVENANTS = "covenants"
    AUTOMATIC_RENEWAL = "automatic_renewal"
    CHANGE_OF_CONTROL = "change_of_control"
    DATA_PROTECTION = "data_protection"
    UNKNOWN = "unknown"


@dataclass
class ExtractedClause:
    """Represents an extracted contract clause"""
    clause_type: ClauseType
    clause_text: str
    start_position: int
    end_position: int
    section_number: Optional[str] = None
    section_title: Optional[str] = None
    confidence: float = 0.0
    keywords_matched: List[str] = None
    risk_indicators: List[str] = None

    def __post_init__(self):
        if self.keywords_matched is None:
            self.keywords_matched = []
        if self.risk_indicators is None:
            self.risk_indicators = []

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "clause_type": self.clause_type.value,
            "clause_text": self.clause_text,
            "start_position": self.start_position,
            "end_position": self.end_position,
            "section_number": self.section_number,
            "section_title": self.section_title,
            "confidence": self.confidence,
            "keywords_matched": self.keywords_matched,
            "risk_indicators": self.risk_indicators,
            "length": len(self.clause_text)
        }


class ClauseExtractionService:
    """
    Service for extracting and classifying contract clauses
    Uses pattern matching and keyword analysis for clause identification
    """

    # Keyword patterns for each clause type
    CLAUSE_PATTERNS = {
        ClauseType.INDEMNIFICATION: {
            "keywords": [
                "indemnify", "indemnification", "hold harmless", "defend",
                "indemnitor", "indemnitee", "indemnified party"
            ],
            "risk_keywords": [
                "any and all", "unlimited", "consequential", "indirect",
                "sole discretion", "irrespective"
            ]
        },
        ClauseType.LIABILITY_LIMITATION: {
            "keywords": [
                "limitation of liability", "liability cap", "limited to",
                "in no event shall", "maximum liability", "aggregate liability"
            ],
            "risk_keywords": [
                "no limit", "unlimited liability", "consequential damages",
                "punitive damages", "indirect damages"
            ]
        },
        ClauseType.CONFIDENTIALITY: {
            "keywords": [
                "confidential", "confidentiality", "non-disclosure", "proprietary",
                "trade secret", "confidential information", "NDA"
            ],
            "risk_keywords": [
                "perpetual", "indefinite", "no limitation", "broad definition",
                "all information"
            ]
        },
        ClauseType.TERMINATION: {
            "keywords": [
                "termination", "terminate", "cancellation", "cancel",
                "termination for cause", "termination for convenience",
                "notice of termination", "early termination"
            ],
            "risk_keywords": [
                "without cause", "at any time", "without notice",
                "sole discretion", "no refund", "immediate termination"
            ]
        },
        ClauseType.PAYMENT_TERMS: {
            "keywords": [
                "payment", "fees", "compensation", "price", "invoice",
                "payment terms", "due date", "late payment"
            ],
            "risk_keywords": [
                "non-refundable", "advance payment", "late fees",
                "interest", "acceleration", "price increase"
            ]
        },
        ClauseType.INTELLECTUAL_PROPERTY: {
            "keywords": [
                "intellectual property", "IP", "copyright", "trademark",
                "patent", "trade secret", "ownership", "license"
            ],
            "risk_keywords": [
                "assign", "work for hire", "all rights", "perpetual",
                "exclusive", "irrevocable", "worldwide"
            ]
        },
        ClauseType.DISPUTE_RESOLUTION: {
            "keywords": [
                "dispute resolution", "dispute", "mediation", "arbitration",
                "litigation", "negotiation", "escalation"
            ],
            "risk_keywords": [
                "binding arbitration", "waive right", "class action waiver",
                "jury trial waiver", "exclusive jurisdiction"
            ]
        },
        ClauseType.GOVERNING_LAW: {
            "keywords": [
                "governing law", "applicable law", "governed by",
                "laws of", "jurisdiction", "venue"
            ],
            "risk_keywords": [
                "foreign jurisdiction", "inconvenient forum", "exclusive venue"
            ]
        },
        ClauseType.FORCE_MAJEURE: {
            "keywords": [
                "force majeure", "act of god", "beyond control",
                "unforeseeable", "excused performance"
            ],
            "risk_keywords": [
                "no force majeure", "limited relief", "short notice period"
            ]
        },
        ClauseType.WARRANTY: {
            "keywords": [
                "warranty", "warrant", "guarantee", "representation",
                "as-is", "merchantability", "fitness for purpose"
            ],
            "risk_keywords": [
                "no warranty", "as-is", "disclaimer", "limited warranty",
                "breach of warranty"
            ]
        },
        ClauseType.NON_COMPETE: {
            "keywords": [
                "non-compete", "non-competition", "restrictive covenant",
                "competitive activity", "refrain from competing"
            ],
            "risk_keywords": [
                "broad scope", "long duration", "worldwide", "any capacity",
                "indefinite"
            ]
        },
        ClauseType.ASSIGNMENT: {
            "keywords": [
                "assignment", "transfer", "assignee", "successor",
                "delegate", "subcontract"
            ],
            "risk_keywords": [
                "freely assign", "without consent", "automatic assignment",
                "change of control"
            ]
        },
        ClauseType.ARBITRATION: {
            "keywords": [
                "arbitration", "arbitrator", "AAA", "JAMS", "arbitral",
                "binding arbitration", "arbitration clause"
            ],
            "risk_keywords": [
                "mandatory arbitration", "waive jury", "individual basis only",
                "no class action", "expedited arbitration"
            ]
        },
        ClauseType.AUTOMATIC_RENEWAL: {
            "keywords": [
                "automatic renewal", "auto-renew", "automatically renew",
                "successive terms", "renewal term"
            ],
            "risk_keywords": [
                "automatic", "unless notice", "short notice period",
                "perpetual renewal"
            ]
        },
        ClauseType.CHANGE_OF_CONTROL: {
            "keywords": [
                "change of control", "change in control", "acquisition",
                "merger", "sale of business"
            ],
            "risk_keywords": [
                "automatic termination", "immediate payment", "accelerated vesting"
            ]
        },
        ClauseType.DATA_PROTECTION: {
            "keywords": [
                "data protection", "privacy", "GDPR", "personal data",
                "data processing", "data security", "CCPA"
            ],
            "risk_keywords": [
                "unlimited use", "no restrictions", "data breach", "third party access"
            ]
        }
    }

    def __init__(self):
        """Initialize the clause extraction service"""
        self.section_pattern = re.compile(
            r'(?:^|\n)\s*(\d+(?:\.\d+)*)\s*[\.\)]\s*([^\n]+?)(?:\s*\n|$)',
            re.MULTILINE
        )

    def extract_clauses(
        self,
        document_text: str,
        min_confidence: float = 0.5
    ) -> List[ExtractedClause]:
        """
        Extract all clauses from document text

        Args:
            document_text: Full text of the contract
            min_confidence: Minimum confidence threshold

        Returns:
            List of extracted clauses
        """
        logger.info("Extracting clauses from document")

        # First, identify sections
        sections = self._identify_sections(document_text)

        # Extract clauses from each section
        clauses = []
        for section in sections:
            section_clauses = self._extract_clauses_from_section(
                section["text"],
                section["start"],
                section["number"],
                section["title"]
            )
            clauses.extend(section_clauses)

        # Filter by confidence
        filtered_clauses = [c for c in clauses if c.confidence >= min_confidence]

        logger.info(f"Extracted {len(filtered_clauses)} clauses (min confidence: {min_confidence})")
        return filtered_clauses

    def classify_clause(self, clause_text: str) -> Tuple[ClauseType, float, List[str]]:
        """
        Classify a single clause text

        Args:
            clause_text: Text of the clause

        Returns:
            Tuple of (clause_type, confidence, keywords_matched)
        """
        clause_lower = clause_text.lower()
        best_type = ClauseType.UNKNOWN
        best_score = 0.0
        best_keywords = []

        for clause_type, patterns in self.CLAUSE_PATTERNS.items():
            score = 0.0
            matched_keywords = []

            # Check for keyword matches
            for keyword in patterns["keywords"]:
                if keyword.lower() in clause_lower:
                    score += 1.0
                    matched_keywords.append(keyword)

            # Normalize score by number of possible keywords
            if patterns["keywords"]:
                normalized_score = score / len(patterns["keywords"])

                # Boost score if multiple keywords matched
                if score >= 2:
                    normalized_score *= 1.5

                if normalized_score > best_score:
                    best_score = normalized_score
                    best_type = clause_type
                    best_keywords = matched_keywords

        # Ensure confidence is between 0 and 1
        confidence = min(best_score, 1.0)

        return best_type, confidence, best_keywords

    def identify_risk_indicators(
        self,
        clause_text: str,
        clause_type: ClauseType
    ) -> List[str]:
        """
        Identify risk indicators in a clause

        Args:
            clause_text: Text of the clause
            clause_type: Type of the clause

        Returns:
            List of risk indicators found
        """
        risk_indicators = []

        if clause_type in self.CLAUSE_PATTERNS:
            patterns = self.CLAUSE_PATTERNS[clause_type]
            clause_lower = clause_text.lower()

            for risk_keyword in patterns.get("risk_keywords", []):
                if risk_keyword.lower() in clause_lower:
                    risk_indicators.append(risk_keyword)

        return risk_indicators

    def _identify_sections(self, document_text: str) -> List[Dict[str, Any]]:
        """
        Identify document sections by number and title

        Args:
            document_text: Full document text

        Returns:
            List of section dictionaries
        """
        sections = []
        matches = list(self.section_pattern.finditer(document_text))

        for i, match in enumerate(matches):
            section_num = match.group(1)
            section_title = match.group(2).strip()
            start_pos = match.end()

            # Find end position (start of next section or end of document)
            if i + 1 < len(matches):
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(document_text)

            section_text = document_text[start_pos:end_pos].strip()

            sections.append({
                "number": section_num,
                "title": section_title,
                "text": section_text,
                "start": start_pos,
                "end": end_pos
            })

        # If no sections found, treat entire document as one section
        if not sections:
            sections.append({
                "number": None,
                "title": None,
                "text": document_text,
                "start": 0,
                "end": len(document_text)
            })

        return sections

    def _extract_clauses_from_section(
        self,
        section_text: str,
        section_start: int,
        section_number: Optional[str],
        section_title: Optional[str]
    ) -> List[ExtractedClause]:
        """
        Extract clauses from a single section

        Args:
            section_text: Text of the section
            section_start: Start position in full document
            section_number: Section number
            section_title: Section title

        Returns:
            List of extracted clauses
        """
        clauses = []

        # Split section into paragraphs
        paragraphs = self._split_into_paragraphs(section_text)

        current_pos = section_start
        for paragraph in paragraphs:
            if len(paragraph.strip()) < 50:  # Skip very short paragraphs
                current_pos += len(paragraph)
                continue

            # Classify the paragraph
            clause_type, confidence, keywords = self.classify_clause(paragraph)

            if clause_type != ClauseType.UNKNOWN:
                # Identify risk indicators
                risk_indicators = self.identify_risk_indicators(paragraph, clause_type)

                clause = ExtractedClause(
                    clause_type=clause_type,
                    clause_text=paragraph.strip(),
                    start_position=current_pos,
                    end_position=current_pos + len(paragraph),
                    section_number=section_number,
                    section_title=section_title,
                    confidence=confidence,
                    keywords_matched=keywords,
                    risk_indicators=risk_indicators
                )
                clauses.append(clause)

            current_pos += len(paragraph)

        return clauses

    def _split_into_paragraphs(self, text: str) -> List[str]:
        """
        Split text into paragraphs

        Args:
            text: Text to split

        Returns:
            List of paragraphs
        """
        # Split on double newlines or single newlines followed by significant indentation
        paragraphs = re.split(r'\n\s*\n|\n(?=\s{4,})', text)
        return [p.strip() for p in paragraphs if p.strip()]

    def get_clause_summary(self, clauses: List[ExtractedClause]) -> Dict[str, Any]:
        """
        Generate summary statistics for extracted clauses

        Args:
            clauses: List of extracted clauses

        Returns:
            Summary dictionary
        """
        type_counts = {}
        total_risk_indicators = 0
        high_confidence_count = 0
        clauses_with_risks = 0

        for clause in clauses:
            # Count by type
            type_counts[clause.clause_type.value] = type_counts.get(
                clause.clause_type.value, 0
            ) + 1

            # Count risk indicators
            if clause.risk_indicators:
                total_risk_indicators += len(clause.risk_indicators)
                clauses_with_risks += 1

            # Count high confidence
            if clause.confidence >= 0.8:
                high_confidence_count += 1

        return {
            "total_clauses": len(clauses),
            "clause_types": type_counts,
            "high_confidence_count": high_confidence_count,
            "clauses_with_risk_indicators": clauses_with_risks,
            "total_risk_indicators": total_risk_indicators,
            "average_confidence": sum(c.confidence for c in clauses) / len(clauses) if clauses else 0
        }


# ==================== Factory Function ====================

_extraction_service_instance: Optional[ClauseExtractionService] = None


def get_clause_extraction_service() -> ClauseExtractionService:
    """Get singleton instance of clause extraction service"""
    global _extraction_service_instance
    if _extraction_service_instance is None:
        _extraction_service_instance = ClauseExtractionService()
    return _extraction_service_instance
