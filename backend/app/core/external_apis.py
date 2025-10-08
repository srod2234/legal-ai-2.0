"""
External API Configuration and Clients for LEGAL 3.0
Handles integrations with CourtListener and other legal APIs
"""
from typing import Optional, Dict, Any, List
import httpx
from datetime import datetime, timedelta
import logging
from functools import lru_cache
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)


# ==================== Response Models ====================

class CaseSearchResult(BaseModel):
    """Model for case search results from external APIs"""
    case_id: str
    case_name: str
    citation: str
    court: str
    decision_date: Optional[datetime] = None
    summary: Optional[str] = None
    url: Optional[str] = None
    relevance_score: float = 0.0
    jurisdiction: Optional[str] = None
    case_type: Optional[str] = None


class CaseDetail(BaseModel):
    """Detailed case information"""
    case_id: str
    case_name: str
    citation: str
    court: str
    decision_date: Optional[datetime] = None
    summary: Optional[str] = None
    full_text: Optional[str] = None
    opinion_text: Optional[str] = None
    judges: Optional[List[str]] = None
    parties: Optional[List[str]] = None
    outcome: Optional[str] = None
    precedent_value: Optional[str] = None
    key_issues: Optional[List[str]] = None
    legal_principles: Optional[List[str]] = None
    url: Optional[str] = None
    jurisdiction: Optional[str] = None


# ==================== CourtListener API Client ====================

class CourtListenerClient:
    """
    Client for CourtListener API (https://www.courtlistener.com/api/)
    Free access to 1M+ legal cases with comprehensive search capabilities
    """

    BASE_URL = "https://www.courtlistener.com/api/rest/v3"

    def __init__(self, api_token: Optional[str] = None):
        """Initialize CourtListener client with optional API token"""
        self.api_token = api_token or getattr(settings, "COURTLISTENER_API_TOKEN", None)
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=30.0,
            headers=self._get_headers()
        )
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._cache_ttl = timedelta(hours=24)

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication if available"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Legal-AI-App/3.0"
        }
        if self.api_token:
            headers["Authorization"] = f"Token {self.api_token}"
        return headers

    def _get_cached(self, cache_key: str) -> Optional[Any]:
        """Retrieve cached data if still valid"""
        if cache_key in self._cache:
            data, timestamp = self._cache[cache_key]
            if datetime.now() - timestamp < self._cache_ttl:
                logger.info(f"Cache hit for: {cache_key}")
                return data
            else:
                del self._cache[cache_key]
        return None

    def _set_cache(self, cache_key: str, data: Any) -> None:
        """Cache data with timestamp"""
        self._cache[cache_key] = (data, datetime.now())

    async def search_cases(
        self,
        query: str,
        jurisdiction: Optional[str] = None,
        court: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 20
    ) -> List[CaseSearchResult]:
        """
        Search for cases using CourtListener Opinion Search API

        Args:
            query: Search query string
            jurisdiction: Filter by jurisdiction (e.g., "federal", "california")
            court: Filter by specific court
            date_from: Filter cases from this date
            date_to: Filter cases until this date
            limit: Maximum number of results

        Returns:
            List of case search results
        """
        cache_key = f"search:{query}:{jurisdiction}:{court}:{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        try:
            params: Dict[str, Any] = {
                "q": query,
                "type": "o",  # Opinion search
                "order_by": "score desc",
                "stat_Precedential": "Published"
            }

            if jurisdiction:
                params["court_jurisdiction"] = jurisdiction
            if court:
                params["court"] = court
            if date_from:
                params["filed_after"] = date_from.strftime("%Y-%m-%d")
            if date_to:
                params["filed_before"] = date_to.strftime("%Y-%m-%d")

            response = await self.client.get("/search/", params=params)
            response.raise_for_status()

            data = response.json()
            results = []

            for item in data.get("results", [])[:limit]:
                result = CaseSearchResult(
                    case_id=str(item.get("id", "")),
                    case_name=item.get("caseName", ""),
                    citation=item.get("citation", [""])[0] if item.get("citation") else "",
                    court=item.get("court", ""),
                    decision_date=self._parse_date(item.get("dateFiled")),
                    summary=item.get("snippet", ""),
                    url=item.get("absolute_url", ""),
                    relevance_score=float(item.get("score", 0.0)),
                    jurisdiction=item.get("jurisdiction", "")
                )
                results.append(result)

            self._set_cache(cache_key, results)
            logger.info(f"Found {len(results)} cases for query: {query}")
            return results

        except Exception as e:
            logger.error(f"Error searching cases: {e}")
            return []

    async def get_case_details(self, case_id: str) -> Optional[CaseDetail]:
        """
        Get detailed information about a specific case

        Args:
            case_id: The CourtListener opinion ID

        Returns:
            Detailed case information or None if not found
        """
        cache_key = f"case:{case_id}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        try:
            response = await self.client.get(f"/opinions/{case_id}/")
            response.raise_for_status()

            data = response.json()

            detail = CaseDetail(
                case_id=str(data.get("id", "")),
                case_name=data.get("case_name", ""),
                citation=data.get("citation", [""])[0] if data.get("citation") else "",
                court=data.get("court", ""),
                decision_date=self._parse_date(data.get("date_filed")),
                summary=data.get("summary", ""),
                full_text=data.get("html_with_citations", ""),
                opinion_text=data.get("plain_text", ""),
                judges=data.get("judges", "").split(",") if data.get("judges") else None,
                parties=data.get("parties", []),
                outcome=data.get("outcome", ""),
                precedent_value=data.get("precedential_status", ""),
                url=data.get("absolute_url", ""),
                jurisdiction=data.get("jurisdiction", "")
            )

            self._set_cache(cache_key, detail)
            logger.info(f"Retrieved case details for: {case_id}")
            return detail

        except Exception as e:
            logger.error(f"Error getting case details: {e}")
            return None

    async def find_similar_cases(
        self,
        case_text: str,
        jurisdiction: Optional[str] = None,
        limit: int = 10
    ) -> List[CaseSearchResult]:
        """
        Find cases similar to provided case text using semantic search

        Args:
            case_text: Text to find similar cases for
            jurisdiction: Optional jurisdiction filter
            limit: Maximum number of results

        Returns:
            List of similar cases
        """
        # Extract key legal terms and concepts for search
        search_query = self._extract_search_terms(case_text)
        return await self.search_cases(
            query=search_query,
            jurisdiction=jurisdiction,
            limit=limit
        )

    def _extract_search_terms(self, text: str) -> str:
        """Extract key search terms from legal text"""
        # Simple extraction - can be enhanced with NLP
        words = text.split()
        # Take first 50 words as search query
        return " ".join(words[:50])

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string to datetime object"""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except Exception:
            return None

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# ==================== API Factory ====================

@lru_cache()
def get_courtlistener_client() -> CourtListenerClient:
    """Get singleton instance of CourtListener client"""
    return CourtListenerClient()


async def get_case_law_client() -> CourtListenerClient:
    """Dependency injection for FastAPI routes"""
    return get_courtlistener_client()


# ==================== Helper Functions ====================

async def search_relevant_cases(
    query: str,
    practice_area: Optional[str] = None,
    jurisdiction: Optional[str] = None,
    limit: int = 10
) -> List[CaseSearchResult]:
    """
    High-level helper to search for relevant cases

    Args:
        query: Search query
        practice_area: Optional practice area filter
        jurisdiction: Optional jurisdiction filter
        limit: Maximum results

    Returns:
        List of relevant cases
    """
    client = get_courtlistener_client()

    # Enhance query with practice area if provided
    enhanced_query = query
    if practice_area:
        enhanced_query = f"{query} {practice_area}"

    return await client.search_cases(
        query=enhanced_query,
        jurisdiction=jurisdiction,
        limit=limit
    )


async def get_case_by_citation(citation: str) -> Optional[CaseDetail]:
    """
    Get case details by legal citation

    Args:
        citation: Legal citation (e.g., "410 U.S. 113")

    Returns:
        Case details or None if not found
    """
    client = get_courtlistener_client()

    # Search for case by citation
    results = await client.search_cases(query=citation, limit=1)

    if not results:
        return None

    # Get full details
    return await client.get_case_details(results[0].case_id)
