"""Security utilities for JWT authentication and password hashing."""

from datetime import datetime, timedelta, timezone
from typing import Optional, Union
import logging

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from .config import settings
from .database import get_session

logger = logging.getLogger(__name__)

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer security scheme
security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating access token: {e}")
        raise


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating refresh token: {e}")
        raise


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        
        # Check token type
        if payload.get("type") != token_type:
            logger.warning(f"Invalid token type: expected {token_type}, got {payload.get('type')}")
            return None
        
        # Check expiration
        exp = payload.get("exp")
        if exp is None:
            logger.warning("Token missing expiration")
            return None
        
        if datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            logger.warning("Token has expired")
            return None
        
        return payload
        
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return None


async def get_current_user_from_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token: Optional[str] = Cookie(None),
    session: Session = Depends(get_session)
):
    """Get current user from JWT token (Bearer or Cookie)."""
    from app.models.user import User
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = None
    
    # Try to get token from Authorization header first
    if credentials:
        token = credentials.credentials
    # Fallback to cookie (for browser requests)
    elif access_token:
        token = access_token
    
    if not token:
        raise credentials_exception
    
    # Verify token
    payload = verify_token(token, "access")
    if payload is None:
        raise credentials_exception
    
    # Get user ID from token
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    try:
        statement = select(User).where(User.id == user_id)
        user = session.exec(statement).first()
        
        if user is None:
            raise credentials_exception
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise credentials_exception


async def get_current_active_user(
    current_user = Depends(get_current_user_from_token)
):
    """Get current active user."""
    return current_user


async def get_current_admin_user(
    current_user = Depends(get_current_active_user)
):
    """Get current admin user (role-based access control)."""
    from app.models.user import UserRole
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return current_user


def validate_token_for_websocket(token: str) -> Optional[int]:
    """Validate JWT token for WebSocket connections and return user ID."""
    try:
        payload = verify_token(token, "access")
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        return user_id
        
    except Exception as e:
        logger.error(f"Error validating WebSocket token: {e}")
        return None


def create_password_reset_token(email: str) -> str:
    """Create password reset token."""
    delta = timedelta(hours=1)  # Password reset tokens expire in 1 hour
    expire = datetime.now(timezone.utc) + delta
    
    to_encode = {"email": email, "exp": expire, "type": "password_reset"}
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating password reset token: {e}")
        raise


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email."""
    try:
        payload = verify_token(token, "password_reset")
        if payload is None:
            return None
        
        email = payload.get("email")
        return email
        
    except Exception as e:
        logger.error(f"Error verifying password reset token: {e}")
        return None


# Rate limiting helper
class RateLimiter:
    """Simple in-memory rate limiter for security."""
    
    def __init__(self):
        self.attempts = {}
    
    def is_rate_limited(self, key: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        """Check if key is rate limited."""
        now = datetime.now(timezone.utc)
        window = timedelta(minutes=window_minutes)
        
        if key not in self.attempts:
            self.attempts[key] = []
        
        # Remove old attempts outside the window
        self.attempts[key] = [
            attempt for attempt in self.attempts[key]
            if now - attempt < window
        ]
        
        # Check if rate limited
        if len(self.attempts[key]) >= max_attempts:
            return True
        
        # Record this attempt
        self.attempts[key].append(now)
        return False


# Global rate limiter instance
rate_limiter = RateLimiter()