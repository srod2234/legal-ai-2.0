"""
Legal Citation Parser for LEGAL 3.0
Parses and validates legal citations in Bluebook and other formats
"""
import re
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class CitationType(str, Enum):
    """Types of legal citations"""
    FEDERAL_CASE = "federal_case"
    STATE_CASE = "state_case"
    STATUTE = "statute"
    REGULATION = "regulation"
    CONSTITUTIONAL = "constitutional"
    UNKNOWN = "unknown"


@dataclass
class ParsedCitation:
    """Structured representation of a parsed legal citation"""
    raw_citation: str
    citation_type: CitationType
    volume: Optional[str] = None
    reporter: Optional[str] = None
    page: Optional[str] = None
    year: Optional[str] = None
    court: Optional[str] = None
    case_name: Optional[str] = None
    jurisdiction: Optional[str] = None
    pinpoint: Optional[str] = None
    is_valid: bool = True
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "raw_citation": self.raw_citation,
            "citation_type": self.citation_type.value,
            "volume": self.volume,
            "reporter": self.reporter,
            "page": self.page,
            "year": self.year,
            "court": self.court,
            "case_name": self.case_name,
            "jurisdiction": self.jurisdiction,
            "pinpoint": self.pinpoint,
            "is_valid": self.is_valid,
            "confidence": self.confidence
        }


class LegalCitationParser:
    """
    Parser for legal citations following Bluebook format
    Supports federal and state case citations, statutes, and regulations
    """

    # Reporter abbreviations and their full names
    FEDERAL_REPORTERS = {
        "U.S.": "United States Reports",
        "S.Ct.": "Supreme Court Reporter",
        "L.Ed.": "Lawyers' Edition",
        "F.": "Federal Reporter",
        "F.2d": "Federal Reporter, Second Series",
        "F.3d": "Federal Reporter, Third Series",
        "F.4th": "Federal Reporter, Fourth Series",
        "F.Supp.": "Federal Supplement",
        "F.Supp.2d": "Federal Supplement, Second Series",
        "F.Supp.3d": "Federal Supplement, Third Series",
    }

    STATE_REPORTERS = {
        "Cal.": "California Reporter",
        "Cal.2d": "California Reporter, Second Series",
        "Cal.3d": "California Reporter, Third Series",
        "Cal.4th": "California Reporter, Fourth Series",
        "N.Y.": "New York Reports",
        "N.Y.2d": "New York Reports, Second Series",
        "Tex.": "Texas Reports",
        "Fla.": "Florida Reports",
        "Ill.": "Illinois Reports",
        "P.": "Pacific Reporter",
        "P.2d": "Pacific Reporter, Second Series",
        "P.3d": "Pacific Reporter, Third Series",
        "A.": "Atlantic Reporter",
        "A.2d": "Atlantic Reporter, Second Series",
        "A.3d": "Atlantic Reporter, Third Series",
        "N.E.": "North Eastern Reporter",
        "N.E.2d": "North Eastern Reporter, Second Series",
        "N.E.3d": "North Eastern Reporter, Third Series",
        "S.E.": "South Eastern Reporter",
        "S.E.2d": "South Eastern Reporter, Second Series",
        "S.W.": "South Western Reporter",
        "S.W.2d": "South Western Reporter, Second Series",
        "S.W.3d": "South Western Reporter, Third Series",
    }

    # Citation patterns
    CASE_CITATION_PATTERN = r"(\d+)\s+([A-Z][A-Za-z.0-9]+)\s+(\d+)(?:,?\s+(\d+))?"
    YEAR_PATTERN = r"\((\d{4})\)"
    COURT_PATTERN = r"\(([A-Za-z0-9][A-Za-z0-9.\s]+?)\s+(\d{4})\)"

    def __init__(self):
        """Initialize the citation parser"""
        self.all_reporters = {**self.FEDERAL_REPORTERS, **self.STATE_REPORTERS}

    def parse_citation(self, citation_text: str) -> Optional[ParsedCitation]:
        """
        Parse a legal citation string into structured components

        Args:
            citation_text: Raw citation text

        Returns:
            ParsedCitation object or None if parsing fails
        """
        citation_text = citation_text.strip()

        # Try to parse as case citation
        parsed = self._parse_case_citation(citation_text)
        if parsed and parsed.is_valid:
            return parsed

        # Try to parse as statute
        parsed = self._parse_statute(citation_text)
        if parsed and parsed.is_valid:
            return parsed

        # Unknown format
        logger.warning(f"Unable to parse citation: {citation_text}")
        return ParsedCitation(
            raw_citation=citation_text,
            citation_type=CitationType.UNKNOWN,
            is_valid=False,
            confidence=0.0
        )

    def _parse_case_citation(self, citation_text: str) -> Optional[ParsedCitation]:
        """Parse a case citation (e.g., 410 U.S. 113 (1973))"""
        match = re.search(self.CASE_CITATION_PATTERN, citation_text)
        if not match:
            return None

        volume = match.group(1)
        reporter = match.group(2)
        page = match.group(3)
        pinpoint = match.group(4) if match.group(4) else None

        # Validate reporter
        if reporter not in self.all_reporters:
            # Try with common variations
            reporter_normalized = self._normalize_reporter(reporter)
            if reporter_normalized not in self.all_reporters:
                return ParsedCitation(
                    raw_citation=citation_text,
                    citation_type=CitationType.UNKNOWN,
                    volume=volume,
                    reporter=reporter,
                    page=page,
                    is_valid=False,
                    confidence=0.3
                )
            reporter = reporter_normalized

        # Determine citation type
        citation_type = (
            CitationType.FEDERAL_CASE
            if reporter in self.FEDERAL_REPORTERS
            else CitationType.STATE_CASE
        )

        # Extract year and court
        year = None
        court = None

        # Try to match court with year pattern first (e.g., "9th Cir. 2020")
        court_match = re.search(self.COURT_PATTERN, citation_text)
        if court_match:
            court = court_match.group(1)
            year = court_match.group(2)
        else:
            # Try simple year pattern
            year_match = re.search(self.YEAR_PATTERN, citation_text)
            if year_match:
                year = year_match.group(1)

        # Extract case name (usually before the citation)
        case_name = self._extract_case_name(citation_text, match.start())

        # Determine jurisdiction
        jurisdiction = self._determine_jurisdiction(reporter, court)

        return ParsedCitation(
            raw_citation=citation_text,
            citation_type=citation_type,
            volume=volume,
            reporter=reporter,
            page=page,
            year=year,
            court=court,
            case_name=case_name,
            jurisdiction=jurisdiction,
            pinpoint=pinpoint,
            is_valid=True,
            confidence=0.95
        )

    def _parse_statute(self, citation_text: str) -> Optional[ParsedCitation]:
        """Parse a statutory citation (e.g., 42 U.S.C. § 1983)"""
        # Pattern for U.S. Code
        usc_pattern = r"(\d+)\s+U\.S\.C\.\s+§\s*(\d+)"
        match = re.search(usc_pattern, citation_text)

        if match:
            title = match.group(1)
            section = match.group(2)

            return ParsedCitation(
                raw_citation=citation_text,
                citation_type=CitationType.STATUTE,
                volume=title,
                page=section,
                jurisdiction="federal",
                is_valid=True,
                confidence=0.9
            )

        # Pattern for state statutes
        state_pattern = r"([A-Z][a-z.]+)\s+(?:Code|Stat\.)\s+(?:Ann\.\s+)?§\s*(\d+)"
        match = re.search(state_pattern, citation_text)

        if match:
            state = match.group(1)
            section = match.group(2)

            return ParsedCitation(
                raw_citation=citation_text,
                citation_type=CitationType.STATUTE,
                page=section,
                jurisdiction=state.lower(),
                is_valid=True,
                confidence=0.85
            )

        return None

    def _normalize_reporter(self, reporter: str) -> str:
        """Normalize reporter abbreviations"""
        # Remove extra spaces and standardize periods
        normalized = re.sub(r"\s+", "", reporter)
        return normalized

    def _extract_case_name(self, citation_text: str, citation_start: int) -> Optional[str]:
        """Extract case name from citation text"""
        if citation_start > 0:
            # Get text before the citation
            before_citation = citation_text[:citation_start].strip()
            # Remove trailing comma
            case_name = before_citation.rstrip(",").strip()
            if case_name:
                return case_name
        return None

    def _determine_jurisdiction(self, reporter: str, court: Optional[str]) -> Optional[str]:
        """Determine jurisdiction from reporter and court"""
        if reporter == "U.S.":
            return "federal-supreme"

        if reporter in ["F.", "F.2d", "F.3d", "F.4th"]:
            return "federal-circuit"

        if reporter in ["F.Supp.", "F.Supp.2d", "F.Supp.3d"]:
            return "federal-district"

        # State-specific reporters
        state_mapping = {
            "Cal": "california",
            "N.Y": "new-york",
            "Tex": "texas",
            "Fla": "florida",
            "Ill": "illinois"
        }

        for key, state in state_mapping.items():
            if reporter.startswith(key):
                return state

        # Regional reporters - would need court info
        if court:
            return court.lower().replace(" ", "-")

        return None

    def extract_citations_from_text(self, text: str) -> List[ParsedCitation]:
        """
        Extract all citations from a block of text

        Args:
            text: Text containing legal citations

        Returns:
            List of parsed citations
        """
        citations = []
        seen_citations = set()  # Track unique citations by volume/reporter/page

        # Find all potential case citations
        pattern = self.CASE_CITATION_PATTERN
        for match in re.finditer(pattern, text):
            volume = match.group(1)
            reporter = match.group(2)
            page = match.group(3)
            pinpoint = match.group(4) if match.group(4) else None

            # Create unique key for this citation
            cite_key = f"{volume}_{reporter}_{page}"

            # Skip if we've already seen this exact citation
            if cite_key in seen_citations:
                continue

            # Validate reporter
            reporter_normalized = reporter if reporter in self.all_reporters else self._normalize_reporter(reporter)
            if reporter_normalized not in self.all_reporters:
                continue

            # Determine citation type
            citation_type = (
                CitationType.FEDERAL_CASE
                if reporter_normalized in self.FEDERAL_REPORTERS
                else CitationType.STATE_CASE
            )

            # Extract case name from text before citation
            case_name_start = max(0, match.start() - 100)
            case_name_text = text[case_name_start:match.start()].strip().rstrip(",").strip()
            case_name = self._extract_case_name(case_name_text, len(case_name_text))

            # Extract year/court from text after citation
            year_end = min(len(text), match.end() + 50)
            year_context = text[match.end():year_end]

            year = None
            court = None
            court_match = re.search(self.COURT_PATTERN, year_context)
            if court_match:
                court = court_match.group(1)
                year = court_match.group(2)
            else:
                year_match = re.search(self.YEAR_PATTERN, year_context)
                if year_match:
                    year = year_match.group(1)

            jurisdiction = self._determine_jurisdiction(reporter_normalized, court)

            # Create parsed citation
            parsed = ParsedCitation(
                raw_citation=match.group(0),
                citation_type=citation_type,
                volume=volume,
                reporter=reporter_normalized,
                page=page,
                year=year,
                court=court,
                case_name=case_name,
                jurisdiction=jurisdiction,
                pinpoint=pinpoint,
                is_valid=True,
                confidence=0.9
            )

            citations.append(parsed)
            seen_citations.add(cite_key)

        return citations

    def validate_citation(self, citation: ParsedCitation) -> bool:
        """
        Validate that a parsed citation is properly formatted

        Args:
            citation: Parsed citation to validate

        Returns:
            True if valid, False otherwise
        """
        if not citation.is_valid:
            return False

        # Check required fields
        if citation.citation_type in [CitationType.FEDERAL_CASE, CitationType.STATE_CASE]:
            if not all([citation.volume, citation.reporter, citation.page]):
                return False

        if citation.citation_type == CitationType.STATUTE:
            if not citation.page:  # section number
                return False

        return True

    def format_citation(self, citation: ParsedCitation, style: str = "bluebook") -> str:
        """
        Format a parsed citation according to style guide

        Args:
            citation: Parsed citation
            style: Citation style (default: bluebook)

        Returns:
            Formatted citation string
        """
        if style == "bluebook":
            return self._format_bluebook(citation)

        return citation.raw_citation

    def _format_bluebook(self, citation: ParsedCitation) -> str:
        """Format citation in Bluebook style"""
        if citation.citation_type in [CitationType.FEDERAL_CASE, CitationType.STATE_CASE]:
            parts = [f"{citation.volume} {citation.reporter} {citation.page}"]

            if citation.pinpoint:
                parts.append(f"{citation.pinpoint}")

            if citation.court and citation.year:
                parts.append(f"({citation.court} {citation.year})")
            elif citation.year:
                parts.append(f"({citation.year})")

            return " ".join(parts)

        return citation.raw_citation


# ==================== Singleton Instance ====================

_parser_instance: Optional[LegalCitationParser] = None


def get_citation_parser() -> LegalCitationParser:
    """Get singleton instance of citation parser"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = LegalCitationParser()
    return _parser_instance
