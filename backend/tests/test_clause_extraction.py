"""
Unit tests for Clause Extraction Service
"""
import pytest
from app.services.clause_extraction_service import (
    ClauseExtractionService,
    ClauseType,
    ExtractedClause,
    get_clause_extraction_service
)


class TestClauseExtractionService:
    """Test suite for ClauseExtractionService"""

    @pytest.fixture
    def service(self):
        """Create service instance"""
        return ClauseExtractionService()

    def test_classify_indemnification_clause(self, service):
        """Test classification of indemnification clause"""
        clause_text = """
        The Company agrees to indemnify and hold harmless the Client from any and all
        claims, damages, or liabilities arising from the Company's performance under this Agreement.
        """

        clause_type, confidence, keywords = service.classify_clause(clause_text)

        assert clause_type == ClauseType.INDEMNIFICATION
        assert confidence > 0.3  # Adjusted for realistic keyword matching
        assert any("indemnify" in k.lower() for k in keywords)

    def test_classify_liability_limitation_clause(self, service):
        """Test classification of liability limitation clause"""
        clause_text = """
        In no event shall either party's aggregate liability exceed the total amount
        paid under this Agreement. Neither party shall be liable for consequential damages.
        """

        clause_type, confidence, keywords = service.classify_clause(clause_text)

        assert clause_type == ClauseType.LIABILITY_LIMITATION
        assert confidence > 0.3

    def test_classify_confidentiality_clause(self, service):
        """Test classification of confidentiality clause"""
        clause_text = """
        All confidential information disclosed under this Agreement shall remain
        the property of the disclosing party and shall not be disclosed to third parties.
        """

        clause_type, confidence, keywords = service.classify_clause(clause_text)

        assert clause_type == ClauseType.CONFIDENTIALITY
        assert confidence > 0.3

    def test_classify_termination_clause(self, service):
        """Test classification of termination clause"""
        clause_text = """
        Either party may terminate this Agreement with 30 days written notice.
        Termination for cause may be immediate upon material breach.
        """

        clause_type, confidence, keywords = service.classify_clause(clause_text)

        assert clause_type == ClauseType.TERMINATION
        assert confidence > 0.3

    def test_identify_risk_indicators(self, service):
        """Test risk indicator identification"""
        clause_text = """
        The Company shall indemnify the Client for any and all damages, including
        consequential and indirect damages, without limitation.
        """

        risk_indicators = service.identify_risk_indicators(
            clause_text,
            ClauseType.INDEMNIFICATION
        )

        assert len(risk_indicators) > 0
        assert any("any and all" in indicator.lower() for indicator in risk_indicators)

    def test_extract_clauses_from_simple_contract(self, service):
        """Test clause extraction from simple contract"""
        contract_text = """
        1. INDEMNIFICATION
        The Seller agrees to indemnify and hold harmless the Buyer from any claims.

        2. LIMITATION OF LIABILITY
        In no event shall liability exceed the purchase price.

        3. CONFIDENTIALITY
        All confidential information shall remain confidential.
        """

        clauses = service.extract_clauses(contract_text, min_confidence=0.3)

        assert len(clauses) >= 2
        assert any(c.clause_type == ClauseType.INDEMNIFICATION for c in clauses)
        assert any(c.section_number is not None for c in clauses)

    def test_extract_clauses_with_confidence_filter(self, service):
        """Test clause extraction with confidence filtering"""
        contract_text = """
        The Company indemnifies the Client. This is a test.
        Payment is due in 30 days.
        """

        # Low confidence threshold
        clauses_low = service.extract_clauses(contract_text, min_confidence=0.1)

        # High confidence threshold
        clauses_high = service.extract_clauses(contract_text, min_confidence=0.8)

        assert len(clauses_low) >= len(clauses_high)

    def test_section_identification(self, service):
        """Test section number and title identification"""
        contract_text = """
        1. DEFINITIONS
        This section defines terms used throughout the agreement.

        2.1 Indemnification Obligations
        The Company shall indemnify the Client against all claims.

        3) Payment Terms
        Payment shall be made within 30 days of invoice.
        """

        sections = service._identify_sections(contract_text)

        assert len(sections) >= 2
        assert any(s["number"] == "1" for s in sections)
        assert any("DEFINITIONS" in str(s.get("title", "")) for s in sections)

    def test_clause_summary(self, service):
        """Test clause summary generation"""
        clauses = [
            ExtractedClause(
                clause_type=ClauseType.INDEMNIFICATION,
                clause_text="Indemnification clause",
                start_position=0,
                end_position=100,
                confidence=0.9,
                risk_indicators=["any and all", "unlimited"]
            ),
            ExtractedClause(
                clause_type=ClauseType.LIABILITY_LIMITATION,
                clause_text="Liability clause",
                start_position=100,
                end_position=200,
                confidence=0.8,
                risk_indicators=[]
            ),
            ExtractedClause(
                clause_type=ClauseType.INDEMNIFICATION,
                clause_text="Another indemnification",
                start_position=200,
                end_position=300,
                confidence=0.7,
                risk_indicators=["consequential"]
            )
        ]

        summary = service.get_clause_summary(clauses)

        assert summary["total_clauses"] == 3
        assert summary["clause_types"][ClauseType.INDEMNIFICATION.value] == 2
        assert summary["clause_types"][ClauseType.LIABILITY_LIMITATION.value] == 1
        assert summary["high_confidence_count"] == 2
        assert summary["clauses_with_risk_indicators"] == 2
        assert summary["total_risk_indicators"] == 3

    def test_empty_document(self, service):
        """Test extraction from empty document"""
        clauses = service.extract_clauses("")

        assert len(clauses) == 0

    def test_no_sections_document(self, service):
        """Test extraction from document without numbered sections"""
        contract_text = """
        This agreement contains indemnification obligations.
        The company will indemnify and hold harmless the client.
        Confidential information must be protected.
        """

        clauses = service.extract_clauses(contract_text, min_confidence=0.3)

        # Should still extract clauses even without sections
        assert len(clauses) >= 1

    def test_clause_to_dict(self, service):
        """Test clause serialization to dictionary"""
        clause = ExtractedClause(
            clause_type=ClauseType.INDEMNIFICATION,
            clause_text="Test clause text",
            start_position=0,
            end_position=100,
            section_number="1.1",
            section_title="Indemnification",
            confidence=0.85,
            keywords_matched=["indemnify", "hold harmless"],
            risk_indicators=["any and all"]
        )

        clause_dict = clause.to_dict()

        assert clause_dict["clause_type"] == "indemnification"
        assert clause_dict["confidence"] == 0.85
        assert clause_dict["section_number"] == "1.1"
        assert len(clause_dict["keywords_matched"]) == 2
        assert len(clause_dict["risk_indicators"]) == 1

    def test_singleton_service(self):
        """Test singleton pattern"""
        service1 = get_clause_extraction_service()
        service2 = get_clause_extraction_service()

        assert service1 is service2


class TestClauseTypeClassification:
    """Test classification of different clause types"""

    @pytest.fixture
    def service(self):
        return ClauseExtractionService()

    def test_ip_clause(self, service):
        """Test intellectual property clause classification"""
        text = "All intellectual property rights shall remain with the Company."
        clause_type, confidence, _ = service.classify_clause(text)
        assert clause_type == ClauseType.INTELLECTUAL_PROPERTY

    def test_payment_clause(self, service):
        """Test payment terms clause classification"""
        text = "Payment shall be due within 30 days of invoice date."
        clause_type, confidence, _ = service.classify_clause(text)
        assert clause_type == ClauseType.PAYMENT_TERMS

    def test_governing_law_clause(self, service):
        """Test governing law clause classification"""
        text = "This Agreement shall be governed by the laws of California."
        clause_type, confidence, _ = service.classify_clause(text)
        assert clause_type == ClauseType.GOVERNING_LAW

    def test_arbitration_clause(self, service):
        """Test arbitration clause classification"""
        text = "Any disputes shall be resolved through binding arbitration under AAA rules."
        clause_type, confidence, _ = service.classify_clause(text)
        assert clause_type == ClauseType.ARBITRATION

    def test_non_compete_clause(self, service):
        """Test non-compete clause classification"""
        text = "Employee agrees to the non-compete clause and will not engage in competitive activities for 2 years."
        clause_type, confidence, _ = service.classify_clause(text)
        assert clause_type == ClauseType.NON_COMPETE
        assert confidence > 0.1


class TestRiskIndicators:
    """Test risk indicator identification"""

    @pytest.fixture
    def service(self):
        return ClauseExtractionService()

    def test_indemnification_risk_indicators(self, service):
        """Test risk indicators in indemnification clauses"""
        text = "Indemnify for any and all damages including consequential damages."
        indicators = service.identify_risk_indicators(text, ClauseType.INDEMNIFICATION)

        assert len(indicators) >= 2
        assert any("any and all" in i.lower() for i in indicators)
        assert any("consequential" in i.lower() for i in indicators)

    def test_termination_risk_indicators(self, service):
        """Test risk indicators in termination clauses"""
        text = "May terminate at any time without cause and without notice."
        indicators = service.identify_risk_indicators(text, ClauseType.TERMINATION)

        assert len(indicators) >= 2
        assert any("without cause" in i.lower() for i in indicators)

    def test_confidentiality_risk_indicators(self, service):
        """Test risk indicators in confidentiality clauses"""
        text = "All information shall remain confidential indefinitely with no limitation."
        indicators = service.identify_risk_indicators(text, ClauseType.CONFIDENTIALITY)

        assert len(indicators) >= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
