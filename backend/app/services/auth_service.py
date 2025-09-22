"""Authentication service for user management and security."""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import logging

from sqlmodel import Session, select
from fastapi import HTTPException, status
from pydantic import EmailStr

from app.core.database import get_session
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
    rate_limiter
)
from app.core.config import settings
from app.models.user import (
    User, 
    UserCreate, 
    UserUpdate, 
    UserUpdateAdmin,
    PasswordUpdate,
    LoginRequest,
    LoginResponse,
    UserResponse,
    UserRole
)

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service for user management."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def authenticate_user(self, email: str, password: str, ip_address: str = None) -> Optional[User]:
        """Authenticate user with email and password."""
        
        # Rate limiting check
        rate_key = f"login_attempt_{ip_address or 'unknown'}"
        if rate_limiter.is_rate_limited(rate_key, max_attempts=5, window_minutes=15):
            logger.warning(f"Rate limit exceeded for login attempts from {ip_address}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later."
            )
        
        # Get user by email
        statement = select(User).where(User.email == email)
        user = self.session.exec(statement).first()
        
        if not user:
            logger.warning(f"Login attempt with non-existent email: {email}")
            return None
        
        # Check if user is locked
        if user.locked_until and user.locked_until > datetime.utcnow():
            logger.warning(f"Login attempt for locked user: {email}")
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account is locked until {user.locked_until}"
            )
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            # Increment failed login attempts
            user.failed_login_attempts += 1
            
            # Lock account after 5 failed attempts
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=30)
                logger.warning(f"Account locked due to failed attempts: {email}")
            
            self.session.add(user)
            self.session.commit()
            
            logger.warning(f"Failed login attempt for user: {email}")
            return None
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Login attempt for inactive user: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )
        
        # Successful login - reset failed attempts and update last login
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
        self.session.add(user)
        self.session.commit()
        
        logger.info(f"Successful login for user: {email}")
        return user
    
    async def create_user_tokens(self, user: User, remember_me: bool = False) -> Dict[str, Any]:
        """Create access and refresh tokens for user."""
        
        # Token data
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
        
        # Create tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }
    
    async def login(self, login_data: LoginRequest, ip_address: str = None) -> LoginResponse:
        """Login user and return tokens."""
        
        # Authenticate user
        user = await self.authenticate_user(login_data.email, login_data.password, ip_address)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create tokens
        tokens = await self.create_user_tokens(user, login_data.remember_me)
        
        # Create response
        return LoginResponse(
            **tokens,
            user=UserResponse.from_orm(user)
        )
    
    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        from app.core.security import verify_token
        
        # Verify refresh token
        payload = verify_token(refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user
        user_id = payload.get("sub")
        statement = select(User).where(User.id == int(user_id))
        user = self.session.exec(statement).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        return await self.create_user_tokens(user)
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create a new user."""
        
        # Check if user already exists
        statement = select(User).where(User.email == user_data.email)
        existing_user = self.session.exec(statement).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create new user
        user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            role=user_data.role,
            phone=user_data.phone,
            department=user_data.department,
            job_title=user_data.job_title,
            timezone=user_data.timezone,
            language=user_data.language,
            theme=user_data.theme,
            password_changed_at=datetime.utcnow(),
        )
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        
        logger.info(f"New user created: {user.email}")
        return UserResponse.from_orm(user)
    
    async def get_user_by_id(self, user_id: int) -> Optional[UserResponse]:
        """Get user by ID."""
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()
        
        if user:
            return UserResponse.from_orm(user)
        return None
    
    async def get_user_by_email(self, email: EmailStr) -> Optional[UserResponse]:
        """Get user by email."""
        statement = select(User).where(User.email == email)
        user = self.session.exec(statement).first()
        
        if user:
            return UserResponse.from_orm(user)
        return None
    
    async def update_user(self, user_id: int, user_data: UserUpdate, current_user: User) -> UserResponse:
        """Update user information."""
        
        # Get user
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check permissions - users can update themselves, admins can update anyone
        if current_user.role != UserRole.ADMIN and current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Update fields
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        
        logger.info(f"User updated: {user.email}")
        return UserResponse.from_orm(user)
    
    async def update_user_admin(self, user_id: int, user_data: UserUpdateAdmin) -> UserResponse:
        """Update user information (admin only)."""
        
        # Get user
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        
        logger.info(f"User updated by admin: {user.email}")
        return UserResponse.from_orm(user)
    
    async def change_password(self, user_id: int, password_data: PasswordUpdate) -> bool:
        """Change user password."""
        
        # Get user
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(password_data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        user.hashed_password = get_password_hash(password_data.new_password)
        user.password_changed_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        
        self.session.add(user)
        self.session.commit()
        
        logger.info(f"Password changed for user: {user.email}")
        return True
    
    async def request_password_reset(self, email: EmailStr) -> str:
        """Request password reset token."""
        
        # Check if user exists
        statement = select(User).where(User.email == email)
        user = self.session.exec(statement).first()
        
        if not user:
            # Return success even if user doesn't exist (security)
            logger.warning(f"Password reset requested for non-existent email: {email}")
            return "Password reset instructions sent if email exists"
        
        # Create reset token
        reset_token = create_password_reset_token(email)
        
        # TODO: Send email with reset token
        # For now, just log it (in production, send email)
        logger.info(f"Password reset token for {email}: {reset_token}")
        
        return "Password reset instructions sent to your email"
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using reset token."""
        
        # Verify reset token
        email = verify_password_reset_token(token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Get user
        statement = select(User).where(User.email == email)
        user = self.session.exec(statement).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.password_changed_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        user.failed_login_attempts = 0  # Reset failed attempts
        user.locked_until = None  # Unlock account
        
        self.session.add(user)
        self.session.commit()
        
        logger.info(f"Password reset completed for user: {user.email}")
        return True
    
    async def deactivate_user(self, user_id: int) -> UserResponse:
        """Deactivate user account."""
        
        # Get user
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        
        logger.info(f"User deactivated: {user.email}")
        return UserResponse.from_orm(user)

    async def activate_user(self, user_id: int) -> UserResponse:
        """Activate user account."""

        # Get user
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user.is_active = True
        user.updated_at = datetime.utcnow()

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        logger.info(f"User activated: {user.email}")
        return UserResponse.from_orm(user)

    async def update_user_role(self, user_id: int, role: UserRole) -> UserResponse:
        """Update user role."""

        # Get user
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user.role = role
        user.updated_at = datetime.utcnow()

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        logger.info(f"User role updated: {user.email} -> {role}")
        return UserResponse.from_orm(user)


# Dependency to get auth service
def get_auth_service(session: Session = next(get_session())) -> AuthService:
    """Get authentication service instance."""
    return AuthService(session)