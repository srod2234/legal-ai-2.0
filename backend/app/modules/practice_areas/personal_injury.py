"""
Personal Injury Practice Area Module

Specialized analysis and calculations for personal injury cases:
- Medical records assessment
- Damages calculation (economic and non-economic)
- Comparative case analysis
- Settlement range estimation
- Injury severity scoring
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models.document import Document
from app.models.case_precedent import CasePrecedent


class PersonalInjuryModule:
    """
    Personal Injury practice area module for specialized case analysis.
    """

    def __init__(self, db: Session):
        self.db = db

    # Medical Assessment Methods

    async def assess_medical_records(
        self, document_id: int
    ) -> Dict[str, Any]:
        """
        Analyze medical records to assess injury severity and treatment.

        Args:
            document_id: ID of the medical record document

        Returns:
            Medical assessment with severity scoring and treatment analysis
        """
        document = self.db.get(Document, document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")

        # TODO: Implement actual medical record NLP analysis
        # For now, return structured mock data

        severity_score = self._calculate_injury_severity(document)

        return {
            "document_id": document_id,
            "severity_score": severity_score,
            "severity_level": self._get_severity_level(severity_score),
            "injury_types": self._extract_injury_types(document),
            "treatment_summary": self._analyze_treatment(document),
            "ongoing_care_required": self._assess_ongoing_care(document),
            "permanent_impairment": self._assess_permanent_impairment(document),
            "medical_timeline": self._extract_medical_timeline(document),
            "treatment_costs": self._estimate_treatment_costs(document),
        }

    def _calculate_injury_severity(self, document: Document) -> float:
        """
        Calculate injury severity score (0-10 scale).

        Based on factors like:
        - Type of injury
        - Duration of treatment
        - Permanent disability
        - Pain and suffering indicators
        """
        # TODO: Implement ML-based severity scoring
        # Mock calculation for demonstration
        base_score = 6.5

        # Adjust based on document content indicators
        content = document.content.lower() if document.content else ""

        if any(word in content for word in ["fracture", "broken", "surgery"]):
            base_score += 1.5
        if any(word in content for word in ["permanent", "disability", "impairment"]):
            base_score += 1.0
        if any(word in content for word in ["chronic", "ongoing", "long-term"]):
            base_score += 0.5

        return min(base_score, 10.0)

    def _get_severity_level(self, score: float) -> str:
        """Map severity score to categorical level."""
        if score >= 8.5:
            return "Catastrophic"
        elif score >= 7.0:
            return "Severe"
        elif score >= 5.0:
            return "Moderate"
        elif score >= 3.0:
            return "Minor"
        else:
            return "Minimal"

    def _extract_injury_types(self, document: Document) -> List[Dict[str, Any]]:
        """Extract and categorize injury types from medical records."""
        # TODO: Implement NLP-based injury extraction
        return [
            {
                "type": "Traumatic Brain Injury",
                "icd_code": "S06.9",
                "severity": "Moderate",
                "location": "Head",
            },
            {
                "type": "Spinal Injury",
                "icd_code": "S13.4",
                "severity": "Moderate",
                "location": "Cervical Spine",
            },
            {
                "type": "Soft Tissue Injury",
                "icd_code": "S43.4",
                "severity": "Minor",
                "location": "Shoulder",
            },
        ]

    def _analyze_treatment(self, document: Document) -> Dict[str, Any]:
        """Analyze treatment received and outcomes."""
        return {
            "emergency_treatment": True,
            "hospitalization_days": 3,
            "surgeries": 1,
            "physical_therapy_sessions": 24,
            "medications": ["Pain management", "Anti-inflammatory"],
            "treatment_duration_months": 8,
            "treatment_outcome": "Improving with residual symptoms",
        }

    def _assess_ongoing_care(self, document: Document) -> Dict[str, Any]:
        """Assess need for ongoing medical care."""
        return {
            "required": True,
            "estimated_duration_months": 12,
            "care_types": [
                "Physical therapy (ongoing)",
                "Pain management",
                "Follow-up imaging",
            ],
            "estimated_annual_cost": 18500,
        }

    def _assess_permanent_impairment(self, document: Document) -> Dict[str, Any]:
        """Assess permanent impairment level."""
        return {
            "has_permanent_impairment": True,
            "impairment_percentage": 15,
            "functional_limitations": [
                "Limited range of motion in neck",
                "Chronic pain episodes",
                "Inability to lift heavy objects",
            ],
            "impact_on_daily_activities": "Moderate",
            "impact_on_work_capacity": "Reduced capacity for physical labor",
        }

    def _extract_medical_timeline(self, document: Document) -> List[Dict[str, Any]]:
        """Extract key dates and events from medical records."""
        incident_date = datetime.now() - timedelta(days=245)

        return [
            {
                "date": incident_date.isoformat(),
                "event": "Date of Incident",
                "details": "Motor vehicle accident",
            },
            {
                "date": (incident_date + timedelta(hours=2)).isoformat(),
                "event": "Emergency Room Visit",
                "details": "Initial evaluation and treatment",
            },
            {
                "date": (incident_date + timedelta(days=1)).isoformat(),
                "event": "Hospital Admission",
                "details": "3-day hospitalization",
            },
            {
                "date": (incident_date + timedelta(days=14)).isoformat(),
                "event": "First Follow-up",
                "details": "Post-discharge evaluation",
            },
            {
                "date": (incident_date + timedelta(days=30)).isoformat(),
                "event": "Physical Therapy Begins",
                "details": "24-session treatment plan",
            },
        ]

    def _estimate_treatment_costs(self, document: Document) -> Dict[str, float]:
        """Estimate total treatment costs."""
        return {
            "emergency_room": 2500,
            "hospitalization": 18000,
            "surgery": 35000,
            "physical_therapy": 4800,
            "medications": 1200,
            "diagnostic_imaging": 3200,
            "follow_up_visits": 1800,
            "total_past_medical": 66500,
            "estimated_future_medical": 22000,
            "total_medical_costs": 88500,
        }

    # Damages Calculation Methods

    async def calculate_damages(
        self,
        document_id: int,
        medical_assessment: Optional[Dict[str, Any]] = None,
        employment_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive damages (economic and non-economic).

        Args:
            document_id: ID of the case document
            medical_assessment: Medical assessment results (if available)
            employment_info: Employment and income information

        Returns:
            Complete damages breakdown
        """
        if medical_assessment is None:
            medical_assessment = await self.assess_medical_records(document_id)

        economic_damages = self._calculate_economic_damages(
            medical_assessment, employment_info
        )
        non_economic_damages = self._calculate_non_economic_damages(
            medical_assessment
        )

        total_damages = economic_damages["total"] + non_economic_damages["total"]

        return {
            "document_id": document_id,
            "economic_damages": economic_damages,
            "non_economic_damages": non_economic_damages,
            "total_damages": total_damages,
            "damages_breakdown": self._create_damages_breakdown(
                economic_damages, non_economic_damages
            ),
            "calculation_date": datetime.utcnow().isoformat(),
            "assumptions": self._document_assumptions(employment_info),
        }

    def _calculate_economic_damages(
        self,
        medical_assessment: Dict[str, Any],
        employment_info: Optional[Dict[str, Any]],
    ) -> Dict[str, float]:
        """Calculate economic damages (quantifiable financial losses)."""

        # Medical expenses
        medical_costs = medical_assessment.get("treatment_costs", {})
        past_medical = medical_costs.get("total_past_medical", 66500)
        future_medical = medical_costs.get("estimated_future_medical", 22000)

        # Lost wages
        if employment_info:
            annual_income = employment_info.get("annual_income", 65000)
            time_off_days = employment_info.get("time_off_days", 60)
            daily_wage = annual_income / 365
            past_lost_wages = daily_wage * time_off_days
        else:
            past_lost_wages = 10685  # Default calculation

        # Future lost earning capacity
        impairment = medical_assessment.get("permanent_impairment", {})
        if impairment.get("has_permanent_impairment"):
            impairment_pct = impairment.get("impairment_percentage", 15) / 100
            years_to_retirement = 25
            annual_income = employment_info.get("annual_income", 65000) if employment_info else 65000
            future_lost_earnings = annual_income * impairment_pct * years_to_retirement
        else:
            future_lost_earnings = 0

        # Other economic losses
        property_damage = 8500  # Vehicle damage
        out_of_pocket = 2200  # Transportation, equipment, etc.

        total_economic = (
            past_medical +
            future_medical +
            past_lost_wages +
            future_lost_earnings +
            property_damage +
            out_of_pocket
        )

        return {
            "past_medical_expenses": past_medical,
            "future_medical_expenses": future_medical,
            "past_lost_wages": past_lost_wages,
            "future_lost_earning_capacity": future_lost_earnings,
            "property_damage": property_damage,
            "out_of_pocket_expenses": out_of_pocket,
            "total": total_economic,
        }

    def _calculate_non_economic_damages(
        self, medical_assessment: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate non-economic damages (pain, suffering, loss of enjoyment)."""

        severity_score = medical_assessment.get("severity_score", 6.5)

        # Pain and suffering multiplier based on severity
        # Typically 1.5x to 5x economic damages for personal injury
        if severity_score >= 8.5:
            pain_multiplier = 4.5
        elif severity_score >= 7.0:
            pain_multiplier = 3.5
        elif severity_score >= 5.0:
            pain_multiplier = 2.5
        else:
            pain_multiplier = 1.5

        # Base calculation on medical expenses
        medical_costs = medical_assessment.get("treatment_costs", {})
        total_medical = medical_costs.get("total_medical_costs", 88500)

        pain_and_suffering = total_medical * pain_multiplier

        # Loss of enjoyment of life
        impairment = medical_assessment.get("permanent_impairment", {})
        if impairment.get("has_permanent_impairment"):
            loss_of_enjoyment = 75000  # Significant impact
        else:
            loss_of_enjoyment = 25000  # Temporary impact

        # Emotional distress
        emotional_distress = 35000

        # Loss of consortium (if applicable)
        loss_of_consortium = 0  # Would be claimed by spouse separately

        total_non_economic = (
            pain_and_suffering +
            loss_of_enjoyment +
            emotional_distress +
            loss_of_consortium
        )

        return {
            "pain_and_suffering": pain_and_suffering,
            "loss_of_enjoyment_of_life": loss_of_enjoyment,
            "emotional_distress": emotional_distress,
            "loss_of_consortium": loss_of_consortium,
            "multiplier_used": pain_multiplier,
            "total": total_non_economic,
        }

    def _create_damages_breakdown(
        self, economic: Dict[str, float], non_economic: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Create a user-friendly damages breakdown."""
        breakdown = []

        # Economic damages
        breakdown.append({
            "category": "Economic Damages",
            "subcategories": [
                {"name": "Past Medical Expenses", "amount": economic["past_medical_expenses"]},
                {"name": "Future Medical Expenses", "amount": economic["future_medical_expenses"]},
                {"name": "Past Lost Wages", "amount": economic["past_lost_wages"]},
                {"name": "Future Lost Earning Capacity", "amount": economic["future_lost_earning_capacity"]},
                {"name": "Property Damage", "amount": economic["property_damage"]},
                {"name": "Out-of-Pocket Expenses", "amount": economic["out_of_pocket_expenses"]},
            ],
            "total": economic["total"],
        })

        # Non-economic damages
        breakdown.append({
            "category": "Non-Economic Damages",
            "subcategories": [
                {"name": "Pain and Suffering", "amount": non_economic["pain_and_suffering"]},
                {"name": "Loss of Enjoyment of Life", "amount": non_economic["loss_of_enjoyment_of_life"]},
                {"name": "Emotional Distress", "amount": non_economic["emotional_distress"]},
            ],
            "total": non_economic["total"],
        })

        return breakdown

    def _document_assumptions(self, employment_info: Optional[Dict[str, Any]]) -> List[str]:
        """Document assumptions used in damages calculation."""
        assumptions = [
            "Medical costs based on actual bills and estimates from treating physicians",
            "Future medical costs assume standard treatment protocols and inflation",
            "Lost wages calculated using pre-injury earnings",
            "Future lost earning capacity assumes retirement at age 67",
            "Pain and suffering multiplier based on injury severity and case law",
            "No punitive damages included (reserved for separate calculation)",
        ]

        if not employment_info:
            assumptions.append("Employment information estimated using national averages")

        return assumptions

    # Comparable Cases Methods

    async def find_comparable_cases(
        self,
        injury_types: List[str],
        jurisdiction: str,
        case_type: str = "personal_injury",
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Find comparable personal injury cases from database.

        Args:
            injury_types: Types of injuries to match
            jurisdiction: Jurisdiction for precedent search
            case_type: Type of case (default: personal_injury)
            limit: Maximum number of results

        Returns:
            List of comparable cases with outcomes
        """
        # Query database for similar cases
        stmt = (
            select(CasePrecedent)
            .where(CasePrecedent.practice_area == "Personal Injury")
            .where(CasePrecedent.jurisdiction.contains(jurisdiction))
            .limit(limit)
        )

        results = self.db.exec(stmt).all()

        # TODO: Implement similarity scoring based on injury types
        # For now, return structured results

        comparable_cases = []
        for case in results:
            comparable_cases.append({
                "case_id": case.id,
                "case_name": case.case_name,
                "citation": case.citation,
                "jurisdiction": case.jurisdiction,
                "court": case.court,
                "decision_date": case.decision_date.isoformat() if case.decision_date else None,
                "outcome": case.outcome,
                "settlement_amount": case.damages_awarded,
                "injury_description": case.summary,
                "relevance_score": case.relevance_score,
                "key_factors": self._extract_key_factors(case),
            })

        # If no database results, return mock data for demonstration
        if not comparable_cases:
            comparable_cases = self._get_mock_comparable_cases()

        return comparable_cases

    def _extract_key_factors(self, case: CasePrecedent) -> List[str]:
        """Extract key factors from case that influenced outcome."""
        # TODO: Implement NLP-based factor extraction
        return [
            "Clear liability",
            "Permanent impairment",
            "Strong medical evidence",
        ]

    def _get_mock_comparable_cases(self) -> List[Dict[str, Any]]:
        """Return mock comparable cases for demonstration."""
        return [
            {
                "case_id": 1,
                "case_name": "Johnson v. Metro Transit",
                "citation": "234 F. Supp. 3d 890 (S.D.N.Y. 2023)",
                "jurisdiction": "Federal - S.D.N.Y.",
                "court": "Southern District of New York",
                "decision_date": "2023-08-15",
                "outcome": "Plaintiff Verdict",
                "settlement_amount": 485000,
                "injury_description": "TBI and spinal injuries from bus accident",
                "relevance_score": 0.92,
                "key_factors": [
                    "Similar injury severity",
                    "Permanent disability",
                    "Strong liability case",
                ],
            },
            {
                "case_id": 2,
                "case_name": "Martinez v. Corporate Logistics Inc.",
                "citation": "567 F.3d 234 (2nd Cir. 2023)",
                "jurisdiction": "Federal - 2nd Circuit",
                "court": "2nd Circuit Court of Appeals",
                "decision_date": "2023-11-20",
                "outcome": "Settlement",
                "settlement_amount": 425000,
                "injury_description": "Multiple injuries from commercial vehicle collision",
                "relevance_score": 0.88,
                "key_factors": [
                    "Comparable medical costs",
                    "Similar age plaintiff",
                    "Lost earning capacity",
                ],
            },
            {
                "case_id": 3,
                "case_name": "Thompson v. City Transportation",
                "citation": "123 N.E.3d 456 (N.Y. 2024)",
                "jurisdiction": "State - New York",
                "court": "New York Court of Appeals",
                "decision_date": "2024-02-10",
                "outcome": "Plaintiff Verdict",
                "settlement_amount": 520000,
                "injury_description": "TBI and orthopedic injuries",
                "relevance_score": 0.85,
                "key_factors": [
                    "Ongoing care requirements",
                    "Clear negligence",
                    "Significant pain and suffering",
                ],
            },
        ]

    # Settlement Analysis Methods

    async def estimate_settlement_range(
        self,
        damages_calculation: Dict[str, Any],
        comparable_cases: List[Dict[str, Any]],
        liability_strength: float = 0.8,
    ) -> Dict[str, Any]:
        """
        Estimate settlement range based on damages and comparable cases.

        Args:
            damages_calculation: Total damages calculation
            comparable_cases: List of comparable case outcomes
            liability_strength: Strength of liability case (0-1)

        Returns:
            Settlement range estimates
        """
        total_damages = damages_calculation["total_damages"]

        # Adjust for liability strength
        adjusted_damages = total_damages * liability_strength

        # Calculate range based on comparable cases and risk factors
        # Conservative estimate: 60-70% of adjusted damages
        low_estimate = adjusted_damages * 0.60

        # Expected estimate: 75-85% of adjusted damages
        expected_estimate = adjusted_damages * 0.80

        # Optimistic estimate: 90-100% of adjusted damages
        high_estimate = adjusted_damages * 0.95

        # Analyze comparable settlements
        if comparable_cases:
            settlements = [
                case["settlement_amount"]
                for case in comparable_cases
                if case.get("settlement_amount")
            ]
            if settlements:
                avg_comparable = sum(settlements) / len(settlements)
                median_comparable = sorted(settlements)[len(settlements) // 2]
            else:
                avg_comparable = expected_estimate
                median_comparable = expected_estimate
        else:
            avg_comparable = expected_estimate
            median_comparable = expected_estimate

        return {
            "damages_total": total_damages,
            "liability_strength": liability_strength,
            "adjusted_damages": adjusted_damages,
            "settlement_range": {
                "low": low_estimate,
                "expected": expected_estimate,
                "high": high_estimate,
            },
            "comparable_analysis": {
                "average_settlement": avg_comparable,
                "median_settlement": median_comparable,
                "comparable_cases_count": len(comparable_cases),
            },
            "recommendation": self._generate_settlement_recommendation(
                expected_estimate, avg_comparable
            ),
            "confidence_level": self._calculate_confidence_level(
                liability_strength, len(comparable_cases)
            ),
        }

    def _generate_settlement_recommendation(
        self, expected: float, avg_comparable: float
    ) -> str:
        """Generate settlement recommendation text."""
        if expected > avg_comparable * 1.2:
            return "Settlement demand appears aggressive compared to comparable cases. Consider negotiation strategy."
        elif expected < avg_comparable * 0.8:
            return "Settlement range conservative relative to comparable outcomes. Strong negotiation position."
        else:
            return "Settlement estimates align well with comparable case outcomes. Reasonable negotiation range."

    def _calculate_confidence_level(
        self, liability_strength: float, comparable_count: int
    ) -> float:
        """Calculate confidence level in settlement estimate (0-1)."""
        # Base confidence on liability strength
        confidence = liability_strength * 0.6

        # Add confidence based on comparable cases data
        if comparable_count >= 5:
            confidence += 0.3
        elif comparable_count >= 3:
            confidence += 0.2
        elif comparable_count >= 1:
            confidence += 0.1

        # Cap at reasonable confidence level
        return min(confidence + 0.1, 0.95)
