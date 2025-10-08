"""
Practice Area Modules

Specialized modules for different legal practice areas:
- Personal Injury (implemented)
- Corporate Law (stub)
- Employment Law (stub)
- Real Estate (stub)
- Intellectual Property (future)
"""

from .personal_injury import PersonalInjuryModule
from .corporate import CorporateLawModule
from .employment import EmploymentLawModule
from .real_estate import RealEstateLawModule

__all__ = [
    "PersonalInjuryModule",
    "CorporateLawModule",
    "EmploymentLawModule",
    "RealEstateLawModule",
]
