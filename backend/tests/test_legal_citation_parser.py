"""
Unit tests for Legal Citation Parser
"""
import pytest
from app.services.legal_citation_parser import (
    LegalCitationParser,
    ParsedCitation,
    CitationType,
    get_citation_parser
)


class TestLegalCitationParser:
    """Test suite for LegalCitationParser"""

    @pytest.fixture
    def parser(self):
        """Create parser instance"""
        return LegalCitationParser()

    def test_parse_supreme_court_citation(self, parser):
        """Test parsing U.S. Supreme Court citation"""
        citation = "410 U.S. 113 (1973)"
        parsed = parser.parse_citation(citation)

        assert parsed is not None
        assert parsed.is_valid
        assert parsed.citation_type == CitationType.FEDERAL_CASE
        assert parsed.volume == "410"
        assert parsed.reporter == "U.S."
        assert parsed.page == "113"
        assert parsed.year == "1973"
        assert parsed.jurisdiction == "federal-supreme"

    def test_parse_federal_circuit_citation(self, parser):
        """Test parsing Federal Circuit Court citation"""
        citation = "123 F.3d 456 (9th Cir. 2020)"
        parsed = parser.parse_citation(citation)

        assert parsed is not None
        assert parsed.is_valid
        assert parsed.citation_type == CitationType.FEDERAL_CASE
        assert parsed.volume == "123"
        assert parsed.reporter == "F.3d"
        assert parsed.page == "456"
        assert parsed.year == "2020"

    def test_parse_state_citation(self, parser):
        """Test parsing state court citation"""
        citation = "100 Cal.4th 200 (2018)"
        parsed = parser.parse_citation(citation)

        assert parsed is not None
        assert parsed.is_valid
        assert parsed.citation_type == CitationType.STATE_CASE
        assert parsed.volume == "100"
        assert parsed.reporter == "Cal.4th"
        assert parsed.page == "200"
        assert parsed.year == "2018"

    def test_parse_citation_with_pinpoint(self, parser):
        """Test parsing citation with pinpoint reference"""
        citation = "500 U.S. 100, 105 (1995)"
        parsed = parser.parse_citation(citation)

        assert parsed is not None
        assert parsed.is_valid
        assert parsed.page == "100"
        assert parsed.pinpoint == "105"

    def test_parse_statute_usc(self, parser):
        """Test parsing U.S. Code statute"""
        citation = "42 U.S.C. § 1983"
        parsed = parser.parse_citation(citation)

        assert parsed is not None
        assert parsed.is_valid
        assert parsed.citation_type == CitationType.STATUTE
        assert parsed.volume == "42"
        assert parsed.page == "1983"
        assert parsed.jurisdiction == "federal"

    def test_parse_case_with_name(self, parser):
        """Test parsing citation with case name"""
        citation = "Roe v. Wade, 410 U.S. 113 (1973)"
        parsed = parser.parse_citation(citation)

        assert parsed is not None
        assert parsed.is_valid
        assert parsed.case_name == "Roe v. Wade"

    def test_parse_invalid_citation(self, parser):
        """Test parsing invalid citation"""
        citation = "not a valid citation"
        parsed = parser.parse_citation(citation)

        assert parsed is not None
        assert not parsed.is_valid
        assert parsed.citation_type == CitationType.UNKNOWN

    def test_extract_citations_from_text(self, parser):
        """Test extracting multiple citations from text"""
        text = """
        As established in Brown v. Board of Education, 347 U.S. 483 (1954),
        and later affirmed in Green v. County School Board, 391 U.S. 430 (1968),
        the principle is clear.
        """

        citations = parser.extract_citations_from_text(text)

        assert len(citations) >= 2
        assert any(c.page == "483" for c in citations)
        assert any(c.page == "430" for c in citations)

    def test_validate_citation(self, parser):
        """Test citation validation"""
        valid_citation = ParsedCitation(
            raw_citation="410 U.S. 113 (1973)",
            citation_type=CitationType.FEDERAL_CASE,
            volume="410",
            reporter="U.S.",
            page="113",
            year="1973",
            is_valid=True
        )

        assert parser.validate_citation(valid_citation)

        invalid_citation = ParsedCitation(
            raw_citation="invalid",
            citation_type=CitationType.FEDERAL_CASE,
            is_valid=False
        )

        assert not parser.validate_citation(invalid_citation)

    def test_format_bluebook(self, parser):
        """Test Bluebook formatting"""
        citation = ParsedCitation(
            raw_citation="410 U.S. 113 (1973)",
            citation_type=CitationType.FEDERAL_CASE,
            volume="410",
            reporter="U.S.",
            page="113",
            year="1973",
            is_valid=True
        )

        formatted = parser.format_citation(citation, style="bluebook")
        assert "410" in formatted
        assert "U.S." in formatted
        assert "113" in formatted
        assert "1973" in formatted

    def test_singleton_parser(self):
        """Test singleton pattern"""
        parser1 = get_citation_parser()
        parser2 = get_citation_parser()

        assert parser1 is parser2


class TestCitationTypes:
    """Test citation type detection"""

    @pytest.fixture
    def parser(self):
        return LegalCitationParser()

    def test_federal_reporters(self, parser):
        """Test federal reporter identification"""
        federal_citations = [
            "100 U.S. 200 (1880)",
            "200 F.2d 300 (1950)",
            "300 F.3d 400 (2000)",
            "50 F.Supp.2d 100 (2010)"
        ]

        for citation_text in federal_citations:
            parsed = parser.parse_citation(citation_text)
            assert parsed.citation_type == CitationType.FEDERAL_CASE

    def test_state_reporters(self, parser):
        """Test state reporter identification"""
        state_citations = [
            "100 Cal.3d 200 (2000)",
            "200 N.Y.2d 300 (2010)",
            "300 P.3d 400 (2015)"
        ]

        for citation_text in state_citations:
            parsed = parser.parse_citation(citation_text)
            assert parsed.citation_type == CitationType.STATE_CASE


class TestJurisdictionDetection:
    """Test jurisdiction detection"""

    @pytest.fixture
    def parser(self):
        return LegalCitationParser()

    def test_supreme_court_jurisdiction(self, parser):
        """Test Supreme Court jurisdiction detection"""
        citation = "500 U.S. 100 (2000)"
        parsed = parser.parse_citation(citation)

        assert parsed.jurisdiction == "federal-supreme"

    def test_circuit_court_jurisdiction(self, parser):
        """Test Circuit Court jurisdiction detection"""
        citation = "500 F.3d 100 (2000)"
        parsed = parser.parse_citation(citation)

        assert parsed.jurisdiction == "federal-circuit"

    def test_district_court_jurisdiction(self, parser):
        """Test District Court jurisdiction detection"""
        citation = "500 F.Supp.2d 100 (2010)"
        parsed = parser.parse_citation(citation)

        assert parsed.jurisdiction == "federal-district"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
