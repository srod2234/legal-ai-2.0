"""Database configuration and session management."""

from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from sqlalchemy import text
from typing import Generator
import logging
from pathlib import Path

from .config import settings

logger = logging.getLogger(__name__)

# Database engine configuration
if settings.database_url.startswith("sqlite"):
    # SQLite configuration with proper settings for development
    engine = create_engine(
        settings.database_url,
        echo=settings.debug,
        connect_args={
            "check_same_thread": False,  # Allow multiple threads for FastAPI
        },
        poolclass=StaticPool,  # Use static pool for SQLite
    )
else:
    # PostgreSQL configuration for production
    engine = create_engine(
        settings.database_url,
        echo=settings.debug,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,    # Recycle connections every 5 minutes
    )


def create_db_and_tables():
    """Create database and all tables."""
    try:
        # Import all models to ensure they're registered with SQLModel
        from app.models import user, document, chat, admin  # noqa: F401
        
        logger.info("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def get_session() -> Generator[Session, None, None]:
    """Get database session dependency for FastAPI."""
    with Session(engine) as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            session.rollback()
            raise
        finally:
            session.close()


def init_db():
    """Initialize database with default data."""
    try:
        # Create all tables
        create_db_and_tables()
        
        # Create default admin user if it doesn't exist
        from app.models.user import User, UserRole
        from app.core.security import get_password_hash
        
        with Session(engine) as session:
            # Check if admin user exists
            admin_user = session.query(User).filter(User.email == "admin@legal-ai.com").first()
            
            if not admin_user:
                # Create default admin user
                admin_user = User(
                    email="admin@legal-ai.com",
                    hashed_password=get_password_hash("admin123"),
                    full_name="System Administrator",
                    role=UserRole.ADMIN,
                    is_active=True
                )
                session.add(admin_user)
                session.commit()
                logger.info("Default admin user created: admin@legal-ai.com / admin123")
            
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def check_db_connection() -> bool:
    """Check if database connection is working."""
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def backup_database(backup_path: str = None):
    """Backup database (SQLite only)."""
    if not settings.database_url.startswith("sqlite"):
        logger.warning("Database backup only supported for SQLite")
        return
    
    try:
        import shutil
        
        # Extract database file path from URL
        db_path = settings.database_url.replace("sqlite:///", "")
        db_file = Path(db_path)
        
        if not db_file.exists():
            logger.warning(f"Database file not found: {db_file}")
            return
        
        # Create backup
        if not backup_path:
            backup_path = f"{db_path}.backup"
        
        shutil.copy2(db_file, backup_path)
        logger.info(f"Database backed up to: {backup_path}")
        
    except Exception as e:
        logger.error(f"Error backing up database: {e}")
        raise


def get_db_stats():
    """Get basic database statistics."""
    try:
        with Session(engine) as session:
            from app.models.user import User
            from app.models.document import Document
            from app.models.chat import ChatSession, ChatMessage
            
            stats = {
                "users": session.query(User).count(),
                "documents": session.query(Document).count(),
                "chat_sessions": session.query(ChatSession).count(),
                "chat_messages": session.query(ChatMessage).count(),
            }
            
            return stats
            
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        return {}