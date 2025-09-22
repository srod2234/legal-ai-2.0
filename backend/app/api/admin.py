"""Admin API endpoints for system management."""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import psutil
import platform

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from app.core.database import get_session, get_db_stats
from app.core.security import get_current_admin_user
from app.core.config import settings
from app.models.user import User, UserStats
from app.models.admin import (
    AuditLog,
    AuditLogSearchRequest,
    AuditLogListResponse,
    AuditLogResponse,
    SystemStats,
    SystemHealth,
    SecuritySummary,
    PerformanceMetrics,
    AdminDashboardData,
    UserActivity
)
from app.models.document import Document, ProcessingStatus, DocumentType
from app.models.chat import ChatSession, ChatMessage

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/dashboard", response_model=AdminDashboardData)
async def get_admin_dashboard(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get comprehensive admin dashboard data."""
    try:
        # Get system stats
        system_stats = await _get_system_stats(session)
        
        # Get system health
        system_health = await _get_system_health()
        
        # Get security summary
        security_summary = await _get_security_summary(session)
        
        # Get performance metrics
        performance_metrics = await _get_performance_metrics(session)
        
        # Get recent activities
        recent_activities = await _get_recent_user_activities(session)
        
        # Get recent alerts (mock data for now)
        recent_alerts = []
        
        return AdminDashboardData(
            system_stats=system_stats,
            system_health=system_health,
            security_summary=security_summary,
            performance_metrics=performance_metrics,
            recent_activities=recent_activities,
            recent_alerts=recent_alerts
        )
        
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get dashboard data"
        )


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get detailed system statistics."""
    try:
        return await _get_system_stats(session)
        
    except Exception as e:
        logger.error(f"Get system stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system statistics"
        )


@router.get("/health", response_model=SystemHealth)
async def get_system_health(
    current_user: User = Depends(get_current_admin_user)
):
    """Get system health status."""
    try:
        return await _get_system_health()
        
    except Exception as e:
        logger.error(f"Get system health error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system health"
        )


@router.get("/users", response_model=List[UserActivity])
async def get_user_activities(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("last_activity"),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get user activity summary."""
    try:
        # Get users with activity data
        statement = (
            select(User)
            .where(User.is_active == True)
            .offset(offset)
            .limit(limit)
        )
        
        users = session.exec(statement).all()
        activities = []
        
        for user in users:
            # Get user document count
            doc_count = session.exec(
                select(func.count(Document.id)).where(
                    Document.user_id == user.id,
                    Document.processing_status != ProcessingStatus.DELETED
                )
            ).first() or 0
            
            # Get user chat message count
            chat_count = session.exec(
                select(func.count(ChatMessage.id))
                .join(ChatSession)
                .where(ChatSession.user_id == user.id)
            ).first() or 0
            
            # Get recent audit logs for activity
            recent_audit = session.exec(
                select(AuditLog)
                .where(AuditLog.user_id == user.id)
                .order_by(AuditLog.timestamp.desc())
                .limit(1)
            ).first()
            
            activity = UserActivity(
                user_id=user.id,
                user_email=user.email,
                last_login=user.last_login,
                login_count_today=0,  # Would need to calculate from audit logs
                documents_uploaded=doc_count,
                chat_messages_sent=chat_count,
                last_activity=recent_audit.timestamp if recent_audit else None,
                risk_score=0.0  # Would calculate based on activities
            )
            activities.append(activity)
        
        return activities
        
    except Exception as e:
        logger.error(f"Get user activities error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user activities"
        )


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def search_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=1000),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Search audit logs with filters."""
    try:
        # Build query
        statement = select(AuditLog)
        
        # Apply filters
        if user_id:
            statement = statement.where(AuditLog.user_id == user_id)
        
        if action:
            statement = statement.where(AuditLog.action == action)
        
        if resource_type:
            statement = statement.where(AuditLog.resource_type == resource_type)
        
        if date_from:
            statement = statement.where(AuditLog.timestamp >= date_from)
        
        if date_to:
            statement = statement.where(AuditLog.timestamp <= date_to)
        
        # Count total results
        count_statement = select(func.count()).select_from(statement.subquery())
        total_count = session.exec(count_statement).first()
        
        # Apply pagination and ordering
        statement = statement.order_by(AuditLog.timestamp.desc())
        statement = statement.offset((page - 1) * per_page).limit(per_page)
        
        # Execute query
        audit_logs = session.exec(statement).all()
        
        # Convert to response format
        log_responses = [AuditLogResponse.from_orm(log) for log in audit_logs]
        
        return AuditLogListResponse(
            logs=log_responses,
            total=total_count,
            page=page,
            per_page=per_page,
            has_next=(page * per_page) < total_count,
            has_prev=page > 1
        )
        
    except Exception as e:
        logger.error(f"Search audit logs error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search audit logs"
        )


@router.get("/audit-logs/export")
async def export_audit_logs(
    format: str = Query("csv"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Export audit logs in specified format."""
    try:
        from fastapi.responses import StreamingResponse
        import csv
        import io
        
        # Build query
        statement = select(AuditLog).order_by(AuditLog.timestamp.desc())
        
        if date_from:
            statement = statement.where(AuditLog.timestamp >= date_from)
        
        if date_to:
            statement = statement.where(AuditLog.timestamp <= date_to)
        
        # Execute query
        audit_logs = session.exec(statement).all()
        
        if format.lower() == "csv":
            # Create CSV response
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([
                'ID', 'User ID', 'User Email', 'Action', 'Resource Type',
                'Resource ID', 'Description', 'IP Address', 'Status Code',
                'Timestamp', 'Risk Level'
            ])
            
            # Write data
            for log in audit_logs:
                writer.writerow([
                    log.id, log.user_id, log.user_email, log.action,
                    log.resource_type, log.resource_id, log.description,
                    log.ip_address, log.status_code, log.timestamp,
                    log.risk_level
                ])
            
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode()),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=audit_logs.csv"}
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported export format"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export audit logs error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export audit logs"
        )


@router.get("/users/list", response_model=List[User])
async def get_users_list(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get list of users for admin management."""
    try:
        statement = (
            select(User)
            .where(User.is_active == True)
            .offset(offset)
            .limit(limit)
            .order_by(User.created_at.desc())
        )

        users = session.exec(statement).all()
        return users

    except Exception as e:
        logger.error(f"Get users list error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users list"
        )


@router.get("/users/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get user statistics."""
    try:
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Get user counts
        total_users = session.exec(select(func.count(User.id))).first()
        active_users = session.exec(
            select(func.count(User.id)).where(User.is_active == True)
        ).first()
        admin_users = session.exec(
            select(func.count(User.id)).where(User.role == "admin")
        ).first()
        standard_users = session.exec(
            select(func.count(User.id)).where(User.role == "standard")
        ).first()
        
        # Get new user counts
        new_users_today = session.exec(
            select(func.count(User.id)).where(User.created_at >= today)
        ).first()
        new_users_this_week = session.exec(
            select(func.count(User.id)).where(User.created_at >= week_ago)
        ).first()
        new_users_this_month = session.exec(
            select(func.count(User.id)).where(User.created_at >= month_ago)
        ).first()
        
        return UserStats(
            total_users=total_users,
            active_users=active_users,
            admin_users=admin_users,
            standard_users=standard_users,
            new_users_today=new_users_today,
            new_users_this_week=new_users_this_week,
            new_users_this_month=new_users_this_month
        )
        
    except Exception as e:
        logger.error(f"Get user stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user statistics"
        )


# Helper functions

async def _get_system_stats(session: Session) -> SystemStats:
    """Get comprehensive system statistics."""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    # User stats
    total_users = session.exec(select(func.count(User.id))).first() or 0
    active_users = session.exec(
        select(func.count(User.id)).where(User.is_active == True)
    ).first() or 0
    new_users_today = session.exec(
        select(func.count(User.id)).where(User.created_at >= today)
    ).first() or 0
    new_users_this_week = session.exec(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    ).first() or 0
    new_users_this_month = session.exec(
        select(func.count(User.id)).where(User.created_at >= today - timedelta(days=30))
    ).first() or 0
    
    # Document stats
    total_documents = session.exec(
        select(func.count(Document.id)).where(
            Document.processing_status != ProcessingStatus.DELETED
        )
    ).first() or 0
    documents_processed_today = session.exec(
        select(func.count(Document.id)).where(
            Document.created_at >= today,
            Document.processing_status == ProcessingStatus.READY
        )
    ).first() or 0
    documents_processing = session.exec(
        select(func.count(Document.id)).where(
            Document.processing_status.in_([
                ProcessingStatus.PROCESSING,
                ProcessingStatus.EMBEDDING,
                ProcessingStatus.OCR_PROCESSING
            ])
        )
    ).first() or 0
    documents_failed = session.exec(
        select(func.count(Document.id)).where(
            Document.processing_status == ProcessingStatus.FAILED
        )
    ).first() or 0
    
    total_file_size = session.exec(
        select(func.sum(Document.file_size)).where(
            Document.processing_status != ProcessingStatus.DELETED
        )
    ).first() or 0
    total_file_size_gb = total_file_size / (1024 ** 3)
    
    # Chat stats
    total_chat_sessions = session.exec(select(func.count(ChatSession.id))).first() or 0
    active_chat_sessions = session.exec(
        select(func.count(ChatSession.id)).where(ChatSession.is_active == True)
    ).first() or 0
    messages_today = session.exec(
        select(func.count(ChatMessage.id)).where(ChatMessage.created_at >= today)
    ).first() or 0
    messages_this_week = session.exec(
        select(func.count(ChatMessage.id)).where(ChatMessage.created_at >= week_ago)
    ).first() or 0
    
    total_tokens_used = session.exec(
        select(func.sum(ChatSession.total_tokens_used))
    ).first() or 0
    estimated_cost_total = session.exec(
        select(func.sum(ChatSession.estimated_cost))
    ).first() or 0.0
    
    # Estimated cost today (simplified calculation)
    sessions_today = session.exec(
        select(ChatSession).where(ChatSession.last_message_at >= today)
    ).all()
    estimated_cost_today = sum(s.estimated_cost for s in sessions_today if s.estimated_cost)
    
    # System stats
    uptime_hours = 24.0  # Would calculate actual uptime
    
    # Security stats
    login_attempts_today = session.exec(
        select(func.count(AuditLog.id)).where(
            AuditLog.action == "login",
            AuditLog.timestamp >= today
        )
    ).first() or 0
    failed_logins_today = session.exec(
        select(func.count(AuditLog.id)).where(
            AuditLog.action == "login",
            AuditLog.status_code == 401,
            AuditLog.timestamp >= today
        )
    ).first() or 0
    
    return SystemStats(
        total_users=total_users,
        active_users=active_users,
        new_users_today=new_users_today,
        new_users_this_week=new_users_this_week,
        new_users_this_month=new_users_this_month,
        total_documents=total_documents,
        documents_processed_today=documents_processed_today,
        documents_processing=documents_processing,
        documents_failed=documents_failed,
        total_file_size_gb=total_file_size_gb,
        total_chat_sessions=total_chat_sessions,
        active_chat_sessions=active_chat_sessions,
        messages_today=messages_today,
        messages_this_week=messages_this_week,
        total_tokens_used=total_tokens_used,
        estimated_cost_today=estimated_cost_today,
        estimated_cost_total=estimated_cost_total,
        uptime_hours=uptime_hours,
        login_attempts_today=login_attempts_today,
        failed_logins_today=failed_logins_today,
        active_sessions=0,  # Would track active sessions
        suspicious_activities=0  # Would calculate from audit logs
    )


async def _get_system_health() -> SystemHealth:
    """Get system health status."""
    try:
        components = {}
        overall_status = "healthy"
        
        # Database health
        try:
            from app.core.database import check_db_connection
            db_healthy = check_db_connection()
            components["database"] = {
                "status": "healthy" if db_healthy else "unhealthy",
                "response_time_ms": 0,  # Would measure actual response time
                "details": "Database connection OK" if db_healthy else "Database connection failed"
            }
            if not db_healthy:
                overall_status = "unhealthy"
        except Exception as e:
            components["database"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            overall_status = "unhealthy"
        
        # Vector database health (optional service)
        try:
            from app.services.vector_service import vector_service
            vector_healthy = await vector_service.health_check()
            components["vector_database"] = {
                "status": "healthy" if vector_healthy else "degraded",
                "details": "ChromaDB connection OK" if vector_healthy else "ChromaDB connection issues"
            }
            if not vector_healthy and overall_status == "healthy":
                overall_status = "degraded"
        except ImportError:
            components["vector_database"] = {
                "status": "unknown",
                "details": "Vector service not available"
            }
        except Exception as e:
            components["vector_database"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            if overall_status == "healthy":
                overall_status = "degraded"

        # LLM service health (optional service)
        try:
            from app.services.llm_service import llm_service
            llm_healthy = await llm_service.health_check()
            components["llm_service"] = {
                "status": "healthy" if llm_healthy else "degraded",
                "details": "LLM service responding" if llm_healthy else "LLM service issues"
            }
            if not llm_healthy and overall_status == "healthy":
                overall_status = "degraded"
        except ImportError:
            components["llm_service"] = {
                "status": "unknown",
                "details": "LLM service not available"
            }
        except Exception as e:
            components["llm_service"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            if overall_status == "healthy":
                overall_status = "degraded"
        
        # System resources
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            components["system_resources"] = {
                "status": "healthy" if cpu_percent < 80 and memory.percent < 85 else "degraded",
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "details": f"CPU: {cpu_percent}%, Memory: {memory.percent}%, Disk: {disk.percent}%"
            }
            
            if cpu_percent > 90 or memory.percent > 95:
                overall_status = "unhealthy"
            elif (cpu_percent > 80 or memory.percent > 85) and overall_status == "healthy":
                overall_status = "degraded"
                
        except Exception as e:
            components["system_resources"] = {
                "status": "unknown",
                "error": str(e)
            }
        
        return SystemHealth(
            status=overall_status,
            components=components,
            timestamp=datetime.utcnow(),
            uptime_seconds=0.0,  # Would calculate actual uptime
            version="1.0.0"
        )
        
    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        return SystemHealth(
            status="unhealthy",
            components={"error": {"status": "unhealthy", "error": str(e)}},
            timestamp=datetime.utcnow(),
            uptime_seconds=0.0,
            version="1.0.0"
        )


async def _get_security_summary(session: Session) -> SecuritySummary:
    """Get security summary."""
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    
    # Get security metrics
    total_audit_logs = session.exec(select(func.count(AuditLog.id))).first() or 0
    high_risk_events = session.exec(
        select(func.count(AuditLog.id)).where(AuditLog.risk_level == "high")
    ).first() or 0
    failed_logins_24h = session.exec(
        select(func.count(AuditLog.id)).where(
            AuditLog.action == "login",
            AuditLog.status_code == 401,
            AuditLog.timestamp >= last_24h
        )
    ).first() or 0
    
    # Get recent admin actions
    recent_admin_logs = session.exec(
        select(AuditLog)
        .where(AuditLog.action == "admin_action")
        .order_by(AuditLog.timestamp.desc())
        .limit(5)
    ).all()
    
    recent_admin_actions = [AuditLogResponse.from_orm(log) for log in recent_admin_logs]
    
    return SecuritySummary(
        total_audit_logs=total_audit_logs,
        high_risk_events=high_risk_events,
        failed_logins_24h=failed_logins_24h,
        suspicious_ips=[],  # Would analyze IPs with multiple failed attempts
        active_sessions=0,  # Would track active sessions
        recent_admin_actions=recent_admin_actions,
        security_alerts=0  # Would count active security alerts
    )


async def _get_performance_metrics(session: Session) -> PerformanceMetrics:
    """Get performance metrics."""
    # These would be calculated from actual metrics
    return PerformanceMetrics(
        avg_response_time_ms=150.0,
        total_requests_24h=1000,
        error_rate_percent=0.5,
        document_processing_avg_time=30.0,
        chat_response_avg_time=800.0,
        database_query_avg_time=50.0,
        vector_search_avg_time=200.0
    )


async def _get_recent_user_activities(session: Session, limit: int = 10) -> List[UserActivity]:
    """Get recent user activities."""
    # Get users with recent activity
    statement = (
        select(User)
        .where(User.is_active == True)
        .order_by(User.last_login.desc())
        .limit(limit)
    )
    
    users = session.exec(statement).all()
    activities = []
    
    for user in users:
        activity = UserActivity(
            user_id=user.id,
            user_email=user.email,
            last_login=user.last_login,
            login_count_today=0,  # Would calculate from audit logs
            documents_uploaded=0,  # Would calculate
            chat_messages_sent=0,  # Would calculate
            last_activity=user.last_login,
            risk_score=0.0
        )
        activities.append(activity)
    
    return activities