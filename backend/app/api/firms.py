"""
Firm Management API Endpoints for LEGAL 3.0
Provides endpoints for managing law firms and multi-tenancy
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from pydantic import BaseModel

from app.core.database import get_session
from app.core.security import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.models.firm import Firm, FirmCreate, FirmUpdate, FirmResponse
from app.services.firm_management_service import get_firm_management_service
from app.middleware.tenant_isolation import ensure_tenant_isolation
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/firms", tags=["Firm Management"])


# ==================== Request/Response Models ====================

class FirmStatisticsResponse(BaseModel):
    """Firm usage statistics"""
    firm_id: int
    firm_name: str
    subscription_tier: str
    users: dict
    documents: dict
    storage: dict
    is_active: bool
    trial_ends_at: Optional[str]
    created_at: str


class AddUserRequest(BaseModel):
    """Request to add user to firm"""
    user_id: int


class FirmLimitsResponse(BaseModel):
    """Firm limits status"""
    users_limit_reached: bool
    documents_limit_reached: bool
    storage_limit_reached: bool
    trial_expired: bool


# ==================== Endpoints ====================

@router.post("/", response_model=FirmResponse)
async def create_firm(
    firm_data: FirmCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new law firm

    The creating user becomes the firm admin.
    Only one firm per user initially.
    """
    try:
        # Check if user already belongs to a firm
        if current_user.firm_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already belongs to a firm"
            )

        # Get firm management service
        firm_service = get_firm_management_service(session)

        # Create firm
        firm = firm_service.create_firm(firm_data, current_user)

        logger.info(f"Created firm {firm.id} by user {current_user.id}")
        return FirmResponse.model_validate(firm)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating firm: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create firm"
        )


@router.get("/{firm_id}", response_model=FirmResponse)
async def get_firm(
    firm_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get firm details"""
    try:
        # Get firm service
        firm_service = get_firm_management_service(session)

        # Get firm
        firm = firm_service.get_firm(firm_id)
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )

        # Check permissions (user must belong to firm or be admin)
        if current_user.firm_id != firm_id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this firm"
            )

        return FirmResponse.model_validate(firm)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting firm: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve firm"
        )


@router.put("/{firm_id}", response_model=FirmResponse)
async def update_firm(
    firm_id: int,
    firm_data: FirmUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update firm information

    Requires firm admin permissions
    """
    try:
        # Get firm service
        firm_service = get_firm_management_service(session)

        # Update firm
        firm = firm_service.update_firm(firm_id, firm_data, current_user)

        logger.info(f"Updated firm {firm_id} by user {current_user.id}")
        return FirmResponse.model_validate(firm)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating firm: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update firm"
        )


@router.get("/{firm_id}/users", response_model=List[dict])
async def get_firm_users(
    firm_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all users in a firm"""
    try:
        # Get firm service
        firm_service = get_firm_management_service(session)

        # Get users
        users = firm_service.get_firm_users(firm_id, current_user)

        # Convert to response format (exclude sensitive info)
        return [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "is_firm_admin": user.can_manage_firm,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat()
            }
            for user in users
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting firm users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve firm users"
        )


@router.post("/{firm_id}/users", response_model=dict)
async def add_user_to_firm(
    firm_id: int,
    request: AddUserRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a user to the firm

    Requires firm admin permissions
    """
    try:
        # Get firm service
        firm_service = get_firm_management_service(session)

        # Add user
        user = firm_service.add_user_to_firm(
            request.user_id,
            firm_id,
            current_user
        )

        logger.info(f"Added user {request.user_id} to firm {firm_id}")
        return {
            "id": user.id,
            "email": user.email,
            "firm_id": user.firm_id,
            "message": "User added to firm successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding user to firm: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add user to firm"
        )


@router.delete("/{firm_id}/users/{user_id}")
async def remove_user_from_firm(
    firm_id: int,
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove a user from the firm

    Requires firm admin permissions
    """
    try:
        # Get firm service
        firm_service = get_firm_management_service(session)

        # Remove user
        user = firm_service.remove_user_from_firm(
            user_id,
            firm_id,
            current_user
        )

        logger.info(f"Removed user {user_id} from firm {firm_id}")
        return {
            "message": "User removed from firm successfully",
            "user_id": user_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing user from firm: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove user from firm"
        )


@router.get("/{firm_id}/statistics", response_model=FirmStatisticsResponse)
async def get_firm_statistics(
    firm_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get firm usage statistics

    Shows user count, document count, storage usage, and limits
    """
    try:
        # Get firm service
        firm_service = get_firm_management_service(session)

        # Get statistics
        stats = firm_service.get_firm_statistics(firm_id, current_user)

        return FirmStatisticsResponse(**stats)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting firm statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve firm statistics"
        )


@router.get("/{firm_id}/limits", response_model=FirmLimitsResponse)
async def check_firm_limits(
    firm_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if firm has reached any limits

    Useful for preventing actions when limits are reached
    """
    try:
        # Check permissions
        if current_user.firm_id != firm_id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view firm limits"
            )

        # Get firm service
        firm_service = get_firm_management_service(session)

        # Check limits
        limits = firm_service.check_firm_limits(firm_id)

        return FirmLimitsResponse(**limits)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking firm limits: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check firm limits"
        )


@router.get("/", response_model=List[FirmResponse])
async def list_all_firms(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all firms (admin only)

    Returns paginated list of all firms in the system
    """
    try:
        from sqlmodel import select

        # Get firms
        statement = select(Firm).offset(skip).limit(limit)
        firms = session.exec(statement).all()

        return [FirmResponse.model_validate(firm) for firm in firms]

    except Exception as e:
        logger.error(f"Error listing firms: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list firms"
        )


@router.get("/code/{firm_code}", response_model=FirmResponse)
async def get_firm_by_code(
    firm_code: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get firm by firm code"""
    try:
        # Get firm service
        firm_service = get_firm_management_service(session)

        # Get firm
        firm = firm_service.get_firm_by_code(firm_code)
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )

        # Check permissions
        if current_user.firm_id != firm.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this firm"
            )

        return FirmResponse.model_validate(firm)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting firm by code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve firm"
        )
