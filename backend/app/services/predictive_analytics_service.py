"""
Predictive Analytics Service for LEGAL 3.0

Provides predictive analytics for legal outcomes including:
- Litigation outcome predictions
- Settlement amount estimation
- Timeline predictions
- Case strength analysis
- Historical pattern analysis

Author: LEGAL 3.0 Enterprise Transformation
Created: 2025-09-30
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlmodel import Session, select, func, and_, or_
from statistics import mean, median, stdev
import logging

from app.models.case_precedent import CasePrecedent
from app.models.litigation_prediction import (
    LitigationPrediction,
    LitigationPredictionCreate
)
from app.models.risk_assessment import RiskAssessment
from app.models.contract_clause import ContractClause
from app.models.document import Document

logger = logging.getLogger(__name__)


class PredictiveAnalyticsService:
    """
    Service for predictive legal analytics

    Uses historical case data, risk assessments, and pattern matching
    to predict litigation outcomes and provide data-driven recommendations
    """

    def __init__(self, db: Session):
        self.db = db

    # ==================== OUTCOME PREDICTION ====================

    async def predict_litigation_outcome(
        self,
        document_id: int,
        practice_area: str,
        case_type: Optional[str] = None,
        jurisdiction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Predict litigation outcome based on historical data

        Args:
            document_id: Document ID (contract or legal brief)
            practice_area: Practice area (personal_injury, corporate, etc.)
            case_type: Type of case
            jurisdiction: Legal jurisdiction

        Returns:
            Prediction with probabilities and confidence
        """
        # Get document risk assessment
        risk_assessment = self.db.exec(
            select(RiskAssessment)
            .where(RiskAssessment.document_id == document_id)
            .order_by(RiskAssessment.created_at.desc())
        ).first()

        # Get similar precedents
        precedents = await self._find_similar_cases(
            practice_area=practice_area,
            case_type=case_type,
            jurisdiction=jurisdiction,
            limit=50
        )

        # Calculate outcome probabilities from precedents
        outcome_stats = self._calculate_outcome_probabilities(precedents)

        # Adjust based on risk factors
        if risk_assessment:
            outcome_stats = self._adjust_for_risk_factors(
                outcome_stats,
                risk_assessment.overall_risk_score
            )

        # Calculate confidence score
        confidence = self._calculate_confidence_score(
            precedent_count=len(precedents),
            risk_assessment_available=risk_assessment is not None,
            jurisdiction_match_rate=self._get_jurisdiction_match_rate(precedents, jurisdiction)
        )

        return {
            "outcome_probabilities": outcome_stats,
            "confidence_score": round(confidence, 2),
            "based_on_cases": len(precedents),
            "primary_factors": self._identify_key_factors(risk_assessment, precedents),
            "recommendation": self._generate_outcome_recommendation(outcome_stats, confidence)
        }

    def _calculate_outcome_probabilities(
        self,
        precedents: List[CasePrecedent]
    ) -> Dict[str, float]:
        """Calculate probabilities for each outcome type"""
        if not precedents:
            return {
                "plaintiff_victory": 0.33,
                "defendant_victory": 0.33,
                "settlement": 0.34,
                "dismissed": 0.0
            }

        # Count outcomes
        outcome_counts = {}
        for precedent in precedents:
            outcome = precedent.outcome or "unknown"
            outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

        total = len(precedents)

        # Normalize to probabilities
        probabilities = {
            "plaintiff_victory": outcome_counts.get("plaintiff_win", 0) / total,
            "defendant_victory": outcome_counts.get("defendant_win", 0) / total,
            "settlement": outcome_counts.get("settlement", 0) / total,
            "dismissed": outcome_counts.get("dismissed", 0) / total
        }

        return {k: round(v, 3) for k, v in probabilities.items()}

    def _adjust_for_risk_factors(
        self,
        outcome_stats: Dict[str, float],
        risk_score: float
    ) -> Dict[str, float]:
        """Adjust outcome probabilities based on risk score"""
        # Higher risk score increases settlement/defendant victory probability
        risk_factor = (risk_score - 5.0) / 10.0  # Normalize to -0.5 to 0.5

        adjusted = outcome_stats.copy()

        if risk_factor > 0:  # High risk
            # Increase settlement and defendant victory
            adjusted["settlement"] += risk_factor * 0.1
            adjusted["defendant_victory"] += risk_factor * 0.05
            adjusted["plaintiff_victory"] -= risk_factor * 0.15
        else:  # Low risk
            # Increase plaintiff victory
            adjusted["plaintiff_victory"] += abs(risk_factor) * 0.1
            adjusted["defendant_victory"] -= abs(risk_factor) * 0.05
            adjusted["settlement"] -= abs(risk_factor) * 0.05

        # Normalize to ensure sum = 1.0
        total = sum(adjusted.values())
        return {k: round(v / total, 3) for k, v in adjusted.items()}

    # ==================== SETTLEMENT ESTIMATION ====================

    async def estimate_settlement_amount(
        self,
        document_id: int,
        practice_area: str,
        claim_amount: Optional[float] = None,
        case_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Estimate potential settlement amount based on historical data

        Returns:
            Settlement range with percentiles and recommendations
        """
        # Get similar cases with settlement amounts
        precedents = await self._find_similar_cases_with_settlements(
            practice_area=practice_area,
            case_type=case_type,
            limit=50
        )

        if not precedents:
            return {
                "settlement_range": None,
                "confidence": "low",
                "message": "Insufficient historical data for settlement estimation"
            }

        # Extract settlement amounts
        settlements = [p.settlement_amount for p in precedents if p.settlement_amount]

        if not settlements:
            return {
                "settlement_range": None,
                "confidence": "low",
                "message": "No settlement data available for similar cases"
            }

        # Calculate statistics
        stats = self._calculate_settlement_statistics(settlements)

        # Adjust based on claim amount if provided
        if claim_amount:
            stats = self._adjust_settlement_for_claim(stats, claim_amount)

        # Calculate confidence
        confidence = "high" if len(settlements) >= 20 else "medium" if len(settlements) >= 10 else "low"

        return {
            "settlement_range": {
                "low": stats["p25"],
                "expected": stats["median"],
                "high": stats["p75"]
            },
            "statistics": stats,
            "confidence": confidence,
            "based_on_cases": len(settlements),
            "recommendation": self._generate_settlement_recommendation(stats, claim_amount)
        }

    def _calculate_settlement_statistics(
        self,
        settlements: List[float]
    ) -> Dict[str, float]:
        """Calculate settlement amount statistics"""
        settlements = sorted(settlements)
        n = len(settlements)

        def percentile(p):
            k = (n - 1) * p
            f = int(k)
            c = k - f
            if f + 1 < n:
                return settlements[f] + c * (settlements[f + 1] - settlements[f])
            return settlements[f]

        return {
            "min": min(settlements),
            "p10": percentile(0.10),
            "p25": percentile(0.25),
            "median": percentile(0.50),
            "p75": percentile(0.75),
            "p90": percentile(0.90),
            "max": max(settlements),
            "mean": mean(settlements),
            "std_dev": stdev(settlements) if len(settlements) > 1 else 0
        }

    def _adjust_settlement_for_claim(
        self,
        stats: Dict[str, float],
        claim_amount: float
    ) -> Dict[str, float]:
        """Adjust settlement estimates based on claim amount"""
        # Historical settlements tend to be 40-70% of claim amount
        typical_ratio = 0.55

        # Calculate adjustment factor
        median_historical = stats["median"]
        implied_claim = median_historical / typical_ratio

        if claim_amount > 0:
            adjustment_ratio = claim_amount / implied_claim

            # Apply adjustment to all statistics
            adjusted = {}
            for key, value in stats.items():
                if key != "std_dev":
                    adjusted[key] = value * adjustment_ratio
                else:
                    adjusted[key] = value * adjustment_ratio  # Proportional variance

            return adjusted

        return stats

    # ==================== TIMELINE PREDICTION ====================

    async def predict_case_timeline(
        self,
        practice_area: str,
        case_stage: str = "filing",
        case_type: Optional[str] = None,
        jurisdiction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Predict case timeline from current stage to resolution

        Returns:
            Timeline estimates with milestones
        """
        # Get historical timeline data
        precedents = await self._find_similar_cases(
            practice_area=practice_area,
            case_type=case_type,
            jurisdiction=jurisdiction,
            limit=100
        )

        # Calculate timeline statistics
        timelines = []
        for precedent in precedents:
            if precedent.filing_date and precedent.decision_date:
                delta = (precedent.decision_date - precedent.filing_date).days
                if delta > 0:  # Valid timeline
                    timelines.append(delta)

        if not timelines:
            # Use default estimates based on practice area
            return self._get_default_timeline(practice_area, case_stage)

        # Calculate timeline statistics
        timelines = sorted(timelines)
        n = len(timelines)

        def percentile(p):
            k = (n - 1) * p
            f = int(k)
            c = k - f
            if f + 1 < n:
                return timelines[f] + c * (timelines[f + 1] - timelines[f])
            return timelines[f]

        # Adjust for current stage
        stage_multiplier = {
            "filing": 1.0,
            "discovery": 0.7,
            "pre_trial": 0.4,
            "trial": 0.2,
            "post_trial": 0.1
        }.get(case_stage, 1.0)

        return {
            "estimated_days": {
                "optimistic": int(percentile(0.25) * stage_multiplier),
                "expected": int(percentile(0.50) * stage_multiplier),
                "pessimistic": int(percentile(0.75) * stage_multiplier)
            },
            "estimated_months": {
                "optimistic": round(percentile(0.25) * stage_multiplier / 30, 1),
                "expected": round(percentile(0.50) * stage_multiplier / 30, 1),
                "pessimistic": round(percentile(0.75) * stage_multiplier / 30, 1)
            },
            "based_on_cases": len(timelines),
            "milestones": self._generate_milestone_estimates(
                int(percentile(0.50) * stage_multiplier)
            ),
            "factors": [
                "Court backlog may affect timeline",
                "Settlement negotiations could expedite resolution",
                "Complex cases typically take longer"
            ]
        }

    def _get_default_timeline(
        self,
        practice_area: str,
        case_stage: str
    ) -> Dict[str, Any]:
        """Default timeline estimates when no data available"""
        # Default timelines in days by practice area
        defaults = {
            "personal_injury": 365,
            "corporate": 540,
            "employment": 270,
            "real_estate": 180,
            "intellectual_property": 450
        }

        base_days = defaults.get(practice_area, 365)

        stage_multiplier = {
            "filing": 1.0,
            "discovery": 0.7,
            "pre_trial": 0.4,
            "trial": 0.2,
            "post_trial": 0.1
        }.get(case_stage, 1.0)

        adjusted_days = int(base_days * stage_multiplier)

        return {
            "estimated_days": {
                "optimistic": int(adjusted_days * 0.7),
                "expected": adjusted_days,
                "pessimistic": int(adjusted_days * 1.3)
            },
            "estimated_months": {
                "optimistic": round(adjusted_days * 0.7 / 30, 1),
                "expected": round(adjusted_days / 30, 1),
                "pessimistic": round(adjusted_days * 1.3 / 30, 1)
            },
            "based_on_cases": 0,
            "confidence": "low - using default estimates",
            "milestones": self._generate_milestone_estimates(adjusted_days)
        }

    def _generate_milestone_estimates(self, total_days: int) -> List[Dict[str, Any]]:
        """Generate estimated milestone dates"""
        today = datetime.now()

        milestones = [
            {"name": "Discovery Completion", "percent": 0.40},
            {"name": "Pre-Trial Motions", "percent": 0.60},
            {"name": "Mediation/Settlement Conference", "percent": 0.75},
            {"name": "Trial/Resolution", "percent": 1.0}
        ]

        return [
            {
                "milestone": m["name"],
                "estimated_date": (today + timedelta(days=int(total_days * m["percent"]))).strftime("%Y-%m-%d"),
                "days_from_now": int(total_days * m["percent"])
            }
            for m in milestones
        ]

    # ==================== CASE STRENGTH ANALYSIS ====================

    async def analyze_case_strength(
        self,
        document_id: int,
        practice_area: str,
        plaintiff_perspective: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze overall case strength from given perspective

        Returns:
            Comprehensive strength assessment with score
        """
        # Get risk assessment
        risk_assessment = self.db.exec(
            select(RiskAssessment)
            .where(RiskAssessment.document_id == document_id)
            .order_by(RiskAssessment.created_at.desc())
        ).first()

        # Get outcome prediction
        outcome_pred = await self.predict_litigation_outcome(
            document_id=document_id,
            practice_area=practice_area
        )

        # Calculate strength score (0-10)
        if plaintiff_perspective:
            strength_score = outcome_pred["outcome_probabilities"]["plaintiff_victory"] * 10
        else:
            strength_score = outcome_pred["outcome_probabilities"]["defendant_victory"] * 10

        # Adjust for risk factors
        if risk_assessment:
            risk_adjustment = (10 - risk_assessment.overall_risk_score) / 10
            strength_score = strength_score * (0.7 + 0.3 * risk_adjustment)

        # Generate strengths and weaknesses
        analysis = self._generate_strength_weakness_analysis(
            risk_assessment,
            outcome_pred,
            plaintiff_perspective
        )

        return {
            "strength_score": round(strength_score, 1),
            "strength_category": self._categorize_strength(strength_score),
            "perspective": "plaintiff" if plaintiff_perspective else "defendant",
            "strengths": analysis["strengths"],
            "weaknesses": analysis["weaknesses"],
            "key_factors": analysis["key_factors"],
            "recommendation": self._generate_strength_recommendation(strength_score, plaintiff_perspective),
            "confidence": outcome_pred["confidence_score"]
        }

    def _categorize_strength(self, score: float) -> str:
        """Categorize case strength"""
        if score >= 8.0:
            return "Very Strong"
        elif score >= 6.5:
            return "Strong"
        elif score >= 5.0:
            return "Moderate"
        elif score >= 3.5:
            return "Weak"
        else:
            return "Very Weak"

    # ==================== HELPER METHODS ====================

    async def _find_similar_cases(
        self,
        practice_area: str,
        case_type: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        limit: int = 50
    ) -> List[CasePrecedent]:
        """Find similar cases from precedent database"""
        query = select(CasePrecedent).where(
            CasePrecedent.practice_area == practice_area
        )

        if case_type:
            query = query.where(CasePrecedent.case_type == case_type)

        if jurisdiction:
            query = query.where(CasePrecedent.jurisdiction.like(f"%{jurisdiction}%"))

        query = query.order_by(CasePrecedent.relevance_score.desc()).limit(limit)

        return list(self.db.exec(query).all())

    async def _find_similar_cases_with_settlements(
        self,
        practice_area: str,
        case_type: Optional[str] = None,
        limit: int = 50
    ) -> List[CasePrecedent]:
        """Find similar cases that have settlement data"""
        query = select(CasePrecedent).where(
            and_(
                CasePrecedent.practice_area == practice_area,
                CasePrecedent.settlement_amount.isnot(None),
                CasePrecedent.settlement_amount > 0
            )
        )

        if case_type:
            query = query.where(CasePrecedent.case_type == case_type)

        query = query.order_by(CasePrecedent.relevance_score.desc()).limit(limit)

        return list(self.db.exec(query).all())

    def _calculate_confidence_score(
        self,
        precedent_count: int,
        risk_assessment_available: bool,
        jurisdiction_match_rate: float
    ) -> float:
        """Calculate confidence score for predictions"""
        # Base confidence from data quantity
        data_confidence = min(precedent_count / 50, 1.0) * 0.5

        # Bonus for risk assessment
        risk_bonus = 0.2 if risk_assessment_available else 0.0

        # Jurisdiction match bonus
        jurisdiction_bonus = jurisdiction_match_rate * 0.3

        return min((data_confidence + risk_bonus + jurisdiction_bonus) * 10, 10.0)

    def _get_jurisdiction_match_rate(
        self,
        precedents: List[CasePrecedent],
        target_jurisdiction: Optional[str]
    ) -> float:
        """Calculate rate of jurisdiction matches"""
        if not target_jurisdiction or not precedents:
            return 0.5

        matches = sum(
            1 for p in precedents
            if p.jurisdiction and target_jurisdiction.lower() in p.jurisdiction.lower()
        )

        return matches / len(precedents)

    def _identify_key_factors(
        self,
        risk_assessment: Optional[RiskAssessment],
        precedents: List[CasePrecedent]
    ) -> List[str]:
        """Identify key factors affecting prediction"""
        factors = []

        if risk_assessment:
            factors.append(f"Overall risk score: {risk_assessment.overall_risk_score}/10")
            if risk_assessment.critical_clauses > 0:
                factors.append(f"{risk_assessment.critical_clauses} critical risk factors identified")

        if precedents:
            factors.append(f"Based on {len(precedents)} similar cases")

            # Analyze common outcomes
            outcomes = [p.outcome for p in precedents if p.outcome]
            if outcomes:
                from collections import Counter
                most_common = Counter(outcomes).most_common(1)[0]
                factors.append(f"Most common outcome: {most_common[0]} ({most_common[1]} cases)")

        return factors[:5]  # Top 5 factors

    def _generate_outcome_recommendation(
        self,
        outcome_stats: Dict[str, float],
        confidence: float
    ) -> str:
        """Generate recommendation based on outcome prediction"""
        max_outcome = max(outcome_stats.items(), key=lambda x: x[1])
        outcome_name, probability = max_outcome

        if confidence < 5.0:
            return "Insufficient data for reliable prediction. Seek additional case analysis."

        if outcome_name == "settlement" and probability > 0.4:
            return "High likelihood of settlement. Consider mediation and settlement negotiations."
        elif outcome_name == "plaintiff_victory" and probability > 0.5:
            return "Favorable odds for plaintiff. Consider proceeding with litigation."
        elif outcome_name == "defendant_victory" and probability > 0.5:
            return "Favorable odds for defendant. Strong defense position."
        else:
            return "Uncertain outcome. Consider risk mitigation strategies and settlement options."

    def _generate_settlement_recommendation(
        self,
        stats: Dict[str, float],
        claim_amount: Optional[float]
    ) -> str:
        """Generate settlement recommendation"""
        median_settlement = stats["median"]

        if claim_amount and claim_amount > 0:
            ratio = median_settlement / claim_amount
            if ratio > 0.7:
                return "Historical data suggests high settlement ratio. Strong negotiating position."
            elif ratio > 0.4:
                return "Settlement likely in range of 40-70% of claim amount."
            else:
                return "Historical settlements significantly below claim amount. Adjust expectations."
        else:
            return f"Expected settlement range: ${stats['p25']:,.0f} - ${stats['p75']:,.0f}"

    def _generate_strength_weakness_analysis(
        self,
        risk_assessment: Optional[RiskAssessment],
        outcome_pred: Dict[str, Any],
        plaintiff_perspective: bool
    ) -> Dict[str, Any]:
        """Generate strengths and weaknesses analysis"""
        strengths = []
        weaknesses = []
        key_factors = []

        if risk_assessment:
            if risk_assessment.overall_risk_score < 4.0:
                strengths.append("Low risk assessment score indicates favorable contract terms")
            elif risk_assessment.overall_risk_score > 7.0:
                weaknesses.append("High risk factors identified in contractual terms")

            key_factors.append(f"Risk Score: {risk_assessment.overall_risk_score}/10")

        # Add outcome-based analysis
        probs = outcome_pred["outcome_probabilities"]
        if plaintiff_perspective:
            if probs["plaintiff_victory"] > 0.5:
                strengths.append("Historical data favors plaintiff victory")
            if probs["settlement"] > 0.4:
                strengths.append("High probability of settlement")
            if probs["defendant_victory"] > 0.5:
                weaknesses.append("Historical data favors defendant")
        else:
            if probs["defendant_victory"] > 0.5:
                strengths.append("Historical data favors defendant victory")
            if probs["plaintiff_victory"] > 0.5:
                weaknesses.append("Historical data favors plaintiff")

        return {
            "strengths": strengths or ["Insufficient data for detailed analysis"],
            "weaknesses": weaknesses or ["No significant weaknesses identified"],
            "key_factors": key_factors
        }

    def _generate_strength_recommendation(
        self,
        strength_score: float,
        plaintiff_perspective: bool
    ) -> str:
        """Generate recommendation based on case strength"""
        if strength_score >= 7.5:
            return "Strong case. Recommend proceeding with confidence."
        elif strength_score >= 5.5:
            return "Moderate case strength. Proceed with caution and prepare strong evidence."
        elif strength_score >= 3.5:
            return "Weak case. Consider settlement or alternative dispute resolution."
        else:
            return "Very weak case. Strongly recommend settlement or case re-evaluation."


# ==================== FACTORY FUNCTION ====================

def get_predictive_analytics_service(db: Session) -> PredictiveAnalyticsService:
    """Factory function to create PredictiveAnalyticsService"""
    return PredictiveAnalyticsService(db)
