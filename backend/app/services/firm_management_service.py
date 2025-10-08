"""
Firm Management Service for LEGAL 3.0
Handles multi-tenant firm operations and data isolation
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlmodel import Session, select, func
from fastapi import HTTPException, status
import secrets
import logging

from app.models.firm import Firm, FirmCreate, FirmUpdate
from app.models.user import User
from app.models.document import Document

logger = logging.getLogger(__name__)


class FirmManagementService:
    """
    Service for managing law firms and multi-tenancy

    Handles:
    - Firm creation and configuration
    - User-firm associations
    - Data isolation verification
    - Firm-level permissions
    - Usage tracking and limits
    """

    def __init__(self, session: Session):
        """Initialize firm management service"""
        self.session = session

    def create_firm(
        self,
        firm_data: FirmCreate,
        creator_user: User
    ) -> Firm:
        """
        Create a new law firm

        Args:
            firm_data: Firm creation data
            creator_user: User creating the firm (becomes firm admin)

        Returns:
            Created Firm object
        """
        try:
            # Generate unique firm code
            firm_code = self._generate_firm_code(firm_data.firm_name)

            # Create firm
            firm = Firm(
                firm_name=firm_data.firm_name,
                firm_code=firm_code,
                subscription_tier=firm_data.subscription_tier or "trial",
                license_type=firm_data.license_type or "standard",
                max_users=firm_data.max_users or 5,
                max_documents=firm_data.max_documents or 100,
                max_storage_gb=firm_data.max_storage_gb or 10.0,
                settings=firm_data.settings or {},
                is_active=True,
                trial_ends_at=datetime.now() + timedelta(days=30) if firm_data.subscription_tier == "trial" else None
            )

            self.session.add(firm)
            self.session.commit()
            self.session.refresh(firm)

            # Associate creator as firm admin
            creator_user.firm_id = firm.id
            creator_user.can_manage_firm = True
            self.session.add(creator_user)
            self.session.commit()

            logger.info(f"Created firm {firm.id} ({firm.firm_name}) by user {creator_user.id}")
            return firm

        except Exception as e:
            self.session.rollback()
            logger.error(f"Error creating firm: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create firm"
            )

    def get_firm(self, firm_id: int) -> Optional[Firm]:
        """Get firm by ID"""
        return self.session.get(Firm, firm_id)

    def get_firm_by_code(self, firm_code: str) -> Optional[Firm]:
        """Get firm by firm code"""
        statement = select(Firm).where(Firm.firm_code == firm_code)
        return self.session.exec(statement).first()

    def update_firm(
        self,
        firm_id: int,
        firm_data: FirmUpdate,
        user: User
    ) -> Firm:
        """
        Update firm information

        Args:
            firm_id: ID of firm to update
            firm_data: Update data
            user: User performing update (must have firm admin permissions)

        Returns:
            Updated Firm object
        """
        # Get firm
        firm = self.session.get(Firm, firm_id)
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )

        # Check permissions
        if not self._can_manage_firm(user, firm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to manage this firm"
            )

        # Update fields
        update_data = firm_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(firm, field, value)

        firm.updated_at = datetime.now()
        self.session.add(firm)
        self.session.commit()
        self.session.refresh(firm)

        logger.info(f"Updated firm {firm_id} by user {user.id}")
        return firm

    def add_user_to_firm(
        self,
        user_id: int,
        firm_id: int,
        admin_user: User
    ) -> User:
        """
        Add a user to a firm

        Args:
            user_id: ID of user to add
            firm_id: ID of firm
            admin_user: User performing the action (must be firm admin)

        Returns:
            Updated User object
        """
        # Get firm
        firm = self.session.get(Firm, firm_id)
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )

        # Check permissions
        if not self._can_manage_firm(admin_user, firm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to manage this firm"
            )

        # Check user limit
        current_users = self._get_firm_user_count(firm_id)
        if current_users >= firm.max_users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Firm has reached maximum user limit ({firm.max_users})"
            )

        # Get user
        user = self.session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check if user already belongs to a firm
        if user.firm_id and user.firm_id != firm_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already belongs to another firm"
            )

        # Add user to firm
        user.firm_id = firm_id
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        logger.info(f"Added user {user_id} to firm {firm_id} by admin {admin_user.id}")
        return user

    def remove_user_from_firm(
        self,
        user_id: int,
        firm_id: int,
        admin_user: User
    ) -> User:
        """Remove a user from a firm"""
        # Get firm
        firm = self.session.get(Firm, firm_id)
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )

        # Check permissions
        if not self._can_manage_firm(admin_user, firm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to manage this firm"
            )

        # Get user
        user = self.session.get(User, user_id)
        if not user or user.firm_id != firm_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in this firm"
            )

        # Don't allow removing the last admin
        if user.can_manage_firm:
            admin_count = self.session.exec(
                select(func.count(User.id))
                .where(User.firm_id == firm_id, User.can_manage_firm == True)
            ).one()

            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last firm admin"
                )

        # Remove user from firm
        user.firm_id = None
        user.can_manage_firm = False
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        logger.info(f"Removed user {user_id} from firm {firm_id} by admin {admin_user.id}")
        return user

    def get_firm_users(self, firm_id: int, user: User) -> List[User]:
        """Get all users in a firm"""
        # Get firm
        firm = self.session.get(Firm, firm_id)
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )

        # Check permissions (user must belong to the firm or be admin)
        if user.firm_id != firm_id and user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view firm users"
            )

        # Get users
        statement = select(User).where(User.firm_id == firm_id)
        users = self.session.exec(statement).all()

        return list(users)

    def get_firm_statistics(self, firm_id: int, user: User) -> Dict[str, Any]:
        """
        Get statistics for a firm

        Returns usage metrics, limits, and other stats
        """
        # Get firm
        firm = self.session.get(Firm, firm_id)
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )

        # Check permissions
        if user.firm_id != firm_id and user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view firm statistics"
            )

        # Calculate statistics
        user_count = self._get_firm_user_count(firm_id)
        document_count = self._get_firm_document_count(firm_id)
        storage_used = self._get_firm_storage_usage(firm_id)

        return {
            "firm_id": firm_id,
            "firm_name": firm.firm_name,
            "subscription_tier": firm.subscription_tier,
            "users": {
                "current": user_count,
                "limit": firm.max_users,
                "percentage": round((user_count / firm.max_users) * 100, 1) if firm.max_users else 0
            },
            "documents": {
                "current": document_count,
                "limit": firm.max_documents,
                "percentage": round((document_count / firm.max_documents) * 100, 1) if firm.max_documents else 0
            },
            "storage": {
                "used_gb": round(storage_used, 2),
                "limit_gb": firm.max_storage_gb,
                "percentage": round((storage_used / firm.max_storage_gb) * 100, 1) if firm.max_storage_gb else 0
            },
            "is_active": firm.is_active,
            "trial_ends_at": firm.trial_ends_at.isoformat() if firm.trial_ends_at else None,
            "created_at": firm.created_at.isoformat()
        }

    def check_firm_limits(self, firm_id: int) -> Dict[str, bool]:
        """
        Check if firm has reached any limits

        Returns dict with limit status
        """
        firm = self.session.get(Firm, firm_id)
        if not firm:
            return {"users": False, "documents": False, "storage": False}

        user_count = self._get_firm_user_count(firm_id)
        document_count = self._get_firm_document_count(firm_id)
        storage_used = self._get_firm_storage_usage(firm_id)

        return {
            "users_limit_reached": user_count >= firm.max_users,
            "documents_limit_reached": document_count >= firm.max_documents,
            "storage_limit_reached": storage_used >= firm.max_storage_gb,
            "trial_expired": firm.trial_ends_at and firm.trial_ends_at < datetime.now() if firm.trial_ends_at else False
        }

    def verify_data_isolation(self, user: User, resource_firm_id: Optional[int]) -> bool:
        """
        Verify that a user can access a resource based on firm membership

        Args:
            user: User attempting access
            resource_firm_id: Firm ID of the resource

        Returns:
            True if access is allowed, False otherwise
        """
        # System admins can access everything
        if user.role.value == "admin":
            return True

        # Resources without firm ID are accessible (legacy data)
        if resource_firm_id is None:
            return True

        # User must belong to same firm
        return user.firm_id == resource_firm_id

    # ==================== Private Helper Methods ====================

    def _generate_firm_code(self, firm_name: str) -> str:
        """Generate unique firm code from firm name"""
        # Create base code from firm name
        base_code = "".join(
            c.upper() for c in firm_name if c.isalnum()
        )[:6]

        # Add random suffix
        suffix = secrets.token_hex(3).upper()
        firm_code = f"{base_code}-{suffix}"

        # Ensure uniqueness
        existing = self.get_firm_by_code(firm_code)
        if existing:
            # Recursive retry with new suffix
            return self._generate_firm_code(firm_name)

        return firm_code

    def _can_manage_firm(self, user: User, firm: Firm) -> bool:
        """Check if user can manage the firm"""
        # System admin can manage all firms
        if user.role.value == "admin":
            return True

        # User must belong to firm and have management permission
        return user.firm_id == firm.id and user.can_manage_firm

    def _get_firm_user_count(self, firm_id: int) -> int:
        """Get count of users in firm"""
        return self.session.exec(
            select(func.count(User.id)).where(User.firm_id == firm_id)
        ).one()

    def _get_firm_document_count(self, firm_id: int) -> int:
        """Get count of documents in firm"""
        return self.session.exec(
            select(func.count(Document.id)).where(Document.firm_id == firm_id)
        ).one()

    def _get_firm_storage_usage(self, firm_id: int) -> float:
        """Get storage usage in GB for firm"""
        total_bytes = self.session.exec(
            select(func.sum(Document.file_size)).where(Document.firm_id == firm_id)
        ).one() or 0

        # Convert bytes to GB
        return total_bytes / (1024 ** 3)


# ==================== Factory Function ====================

def get_firm_management_service(session: Session) -> FirmManagementService:
    """Factory function to create FirmManagementService"""
    return FirmManagementService(session)
