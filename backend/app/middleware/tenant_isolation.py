"""
Tenant Isolation Middleware for LEGAL 3.0
Ensures data isolation between law firms (tenants)
"""
from typing import Optional, Callable
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

from app.models.user import User
from app.core.security import get_current_user_from_token

logger = logging.getLogger(__name__)


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce tenant (firm) data isolation

    Ensures that users can only access data belonging to their firm.
    Adds firm context to requests for query filtering.
    """

    # Routes that don't require tenant isolation
    EXCLUDED_PATHS = [
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/logout",
        "/api/auth/refresh",
    ]

    # Routes where system admins can access all firms
    ADMIN_BYPASS_PATHS = [
        "/api/admin/",
        "/api/firms/",
    ]

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        logger.info("Tenant isolation middleware initialized")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and enforce tenant isolation"""

        # Skip middleware for excluded paths
        if self._is_excluded_path(request.url.path):
            return await call_next(request)

        # Add firm context to request state
        try:
            user = await self._get_user_from_request(request)

            if user:
                # Add firm context to request state
                request.state.firm_id = user.firm_id
                request.state.user_id = user.id
                request.state.is_firm_admin = user.can_manage_firm
                request.state.is_system_admin = user.role.value == "admin"

                # Log tenant context for debugging
                logger.debug(
                    f"Tenant context: user={user.id}, firm={user.firm_id}, "
                    f"is_admin={user.role.value == 'admin'}"
                )
            else:
                # No authenticated user, clear context
                request.state.firm_id = None
                request.state.user_id = None
                request.state.is_firm_admin = False
                request.state.is_system_admin = False

        except Exception as e:
            logger.warning(f"Error setting tenant context: {e}")
            request.state.firm_id = None
            request.state.user_id = None
            request.state.is_firm_admin = False
            request.state.is_system_admin = False

        # Process request
        response = await call_next(request)

        # Add tenant info to response headers (for debugging in dev)
        if hasattr(request.state, "firm_id") and request.state.firm_id:
            response.headers["X-Tenant-ID"] = str(request.state.firm_id)

        return response

    def _is_excluded_path(self, path: str) -> bool:
        """Check if path is excluded from tenant isolation"""
        return any(path.startswith(excluded) for excluded in self.EXCLUDED_PATHS)

    async def _get_user_from_request(self, request: Request) -> Optional[User]:
        """Extract user from request token"""
        try:
            # Get authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                # Try to get from cookie
                token = request.cookies.get("access_token")
            else:
                token = auth_header.replace("Bearer ", "")

            if not token:
                return None

            # Get user from token
            user = get_current_user_from_token(token)
            return user

        except Exception as e:
            logger.debug(f"Could not extract user from request: {e}")
            return None


def verify_tenant_access(
    user: User,
    resource_firm_id: Optional[int],
    allow_admin_bypass: bool = True
) -> bool:
    """
    Verify that user can access a resource based on firm membership

    Args:
        user: User attempting access
        resource_firm_id: Firm ID of the resource being accessed
        allow_admin_bypass: Allow system admins to bypass check

    Returns:
        True if access is allowed

    Raises:
        HTTPException: If access is denied
    """
    # System admins can access everything (if allowed)
    if allow_admin_bypass and user.role.value == "admin":
        return True

    # Resources without firm ID are accessible (legacy data or no firm required)
    if resource_firm_id is None:
        return True

    # User must belong to same firm
    if user.firm_id != resource_firm_id:
        logger.warning(
            f"Tenant isolation violation: User {user.id} (firm {user.firm_id}) "
            f"attempted to access resource from firm {resource_firm_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Resource belongs to another organization"
        )

    return True


def get_firm_filter(user: User, allow_admin_bypass: bool = True) -> Optional[int]:
    """
    Get firm ID to use for filtering queries

    Args:
        user: Current user
        allow_admin_bypass: If True, admins get None (see all firms)

    Returns:
        Firm ID to filter by, or None to see all
    """
    # System admins can see all firms (if allowed)
    if allow_admin_bypass and user.role.value == "admin":
        return None

    # Regular users see only their firm
    return user.firm_id


class TenantQueryFilter:
    """
    Helper class to add tenant filtering to database queries

    Usage:
        query = select(Document)
        query = TenantQueryFilter.apply(query, Document.firm_id, user)
    """

    @staticmethod
    def apply(query, firm_id_column, user: User, allow_admin_bypass: bool = True):
        """
        Apply tenant filter to a SQLModel query

        Args:
            query: SQLModel select query
            firm_id_column: The firm_id column to filter on (e.g., Document.firm_id)
            user: Current user
            allow_admin_bypass: Allow admins to bypass filter

        Returns:
            Filtered query
        """
        firm_filter = get_firm_filter(user, allow_admin_bypass)

        # If firm_filter is None, return query unchanged (admin viewing all)
        if firm_filter is None:
            return query

        # Add firm filter
        return query.where(firm_id_column == firm_filter)


# ==================== Convenience Functions ====================

def ensure_tenant_isolation(user: User, resource_firm_id: Optional[int]) -> None:
    """
    Ensure tenant isolation for a resource access

    Raises HTTPException if access is denied
    """
    verify_tenant_access(user, resource_firm_id, allow_admin_bypass=True)


def can_access_firm_resource(
    user: User,
    resource_firm_id: Optional[int],
    allow_admin_bypass: bool = True
) -> bool:
    """
    Check if user can access a firm resource without raising exception

    Returns:
        True if access is allowed, False otherwise
    """
    try:
        verify_tenant_access(user, resource_firm_id, allow_admin_bypass)
        return True
    except HTTPException:
        return False
