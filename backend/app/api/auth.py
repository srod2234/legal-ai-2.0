"""Authentication API endpoints."""

from datetime import timedelta
from typing import Any
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_active_user, get_current_admin_user
from app.core.config import settings
from app.models.user import (
    User,
    UserCreate,
    UserUpdate,
    PasswordUpdate,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserResponse,
    UserRole
)
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    """Get authentication service dependency."""
    return AuthService(session)


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """User login endpoint."""
    try:
        # Get client IP for rate limiting
        client_ip = get_client_ip(request)
        
        # Authenticate user and get tokens
        login_response = await auth_service.login(login_data, client_ip)
        
        # Set httpOnly cookies for secure token storage
        cookie_max_age = settings.access_token_expire_minutes * 60
        if login_data.remember_me:
            cookie_max_age = settings.refresh_token_expire_days * 24 * 60 * 60
        
        # Set access token cookie
        response.set_cookie(
            key="access_token",
            value=login_response.access_token,
            max_age=cookie_max_age,
            httponly=True,
            secure=False,  # Use secure=False for localhost development
            samesite="lax"  # Use 'lax' for development localhost
        )

        # Set refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=login_response.refresh_token,
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
            httponly=True,
            secure=False,  # Use secure=False for localhost development
            samesite="lax"  # Use 'lax' for development localhost
        )
        
        logger.info(f"User logged in: {login_data.email} from IP: {client_ip}")
        return login_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_active_user)
):
    """User logout endpoint."""
    try:
        # Clear authentication cookies
        response.delete_cookie(
            key="access_token",
            httponly=True,
            secure=False,
            samesite="none" if settings.debug else "lax"
        )
        response.delete_cookie(
            key="refresh_token",
            httponly=True,
            secure=False,
            samesite="none" if settings.debug else "lax"
        )
        
        logger.info(f"User logged out: {current_user.email}")
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post("/refresh", response_model=dict)
async def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None),
    refresh_request: RefreshTokenRequest = None,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh access token endpoint."""
    try:
        # Get refresh token from cookie or request body
        token = refresh_token
        if refresh_request and refresh_request.refresh_token:
            token = refresh_request.refresh_token
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not provided"
            )
        
        # Refresh tokens
        tokens = await auth_service.refresh_tokens(token)
        
        # Update access token cookie
        response.set_cookie(
            key="access_token",
            value=tokens["access_token"],
            max_age=settings.access_token_expire_minutes * 60,
            httponly=True,
            secure=False,  # Use secure=False for localhost development
            samesite="lax"  # Use 'lax' for development localhost
        )
        
        logger.info("Tokens refreshed successfully")
        return tokens
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """User registration endpoint (admin only)."""
    try:
        user = await auth_service.create_user(user_data)
        logger.info(f"New user registered: {user.email} by admin: {current_user.email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile."""
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Update current user profile."""
    try:
        updated_user = await auth_service.update_user(current_user.id, user_data, current_user)
        logger.info(f"User profile updated: {current_user.email}")
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )


@router.put("/change-password")
async def change_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Change user password."""
    try:
        success = await auth_service.change_password(current_user.id, password_data)
        if success:
            logger.info(f"Password changed for user: {current_user.email}")
            return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )


@router.post("/password-reset/request")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Request password reset."""
    try:
        message = await auth_service.request_password_reset(reset_request.email)
        logger.info(f"Password reset requested for: {reset_request.email}")
        return {"message": message}
        
    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        # Always return success for security (don't reveal if email exists)
        return {"message": "Password reset instructions sent if email exists"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Confirm password reset with token."""
    try:
        success = await auth_service.reset_password(reset_data.token, reset_data.new_password)
        if success:
            logger.info("Password reset completed successfully")
            return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirmation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )


@router.get("/verify-token")
async def verify_token(
    current_user: User = Depends(get_current_active_user)
):
    """Verify if current token is valid."""
    return {
        "valid": True,
        "user": UserResponse.from_orm(current_user)
    }


@router.get("/websocket-token")
async def get_websocket_token(
    current_user: User = Depends(get_current_active_user),
    access_token: str = Cookie(None)
):
    """Get JWT token for WebSocket connections."""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token found"
        )

    return {
        "token": access_token,
        "user_id": current_user.id
    }


# Admin endpoints for user management

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Get user by ID (admin only)."""
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Update user (admin only)."""
    try:
        updated_user = await auth_service.update_user(user_id, user_data, current_user)
        logger.info(f"User updated by admin: {updated_user.email}")
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User update failed"
        )


@router.put("/users/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Deactivate user (admin only)."""
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )

        deactivated_user = await auth_service.deactivate_user(user_id)
        logger.info(f"User deactivated by admin: {deactivated_user.email}")
        return deactivated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User deactivation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User deactivation failed"
        )


@router.put("/users/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Activate user (admin only)."""
    try:
        activated_user = await auth_service.activate_user(user_id)
        logger.info(f"User activated by admin: {activated_user.email}")
        return activated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User activation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User activation failed"
        )


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_data: dict,
    current_user: User = Depends(get_current_admin_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Update user role (admin only)."""
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change your own role"
            )

        role = role_data.get("role")
        if role not in ["admin", "standard"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'admin' or 'standard'"
            )

        # Convert to UserRole enum
        user_role = UserRole.ADMIN if role == "admin" else UserRole.STANDARD
        updated_user = await auth_service.update_user_role(user_id, user_role)
        logger.info(f"User role updated by admin: {updated_user.email} -> {role}")
        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User role update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User role update failed"
        )