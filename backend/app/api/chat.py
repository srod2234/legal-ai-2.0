"""Chat API endpoints and WebSocket handlers."""

import asyncio
import json
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_active_user, validate_token_for_websocket
from app.models.user import User
from app.models.chat import (
    ChatSession,
    ChatSessionCreate,
    ChatSessionUpdate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatConversationResponse,
    ChatStreamResponse,
    ChatSessionListResponse,
    ChatMessageRating,
    WebSocketMessage
)
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_chat_service(session: Session = Depends(get_session)) -> ChatService:
    """Get chat service dependency."""
    return ChatService(session)


# WebSocket connection manager
class ConnectionManager:
    """Manage WebSocket connections for real-time chat."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict = {}  # user_id -> websocket
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket
        logger.info(f"WebSocket connected for user {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, message: str, user_id: int):
        """Send message to specific user."""
        websocket = self.user_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                # Remove broken connection
                self.disconnect(websocket, user_id)


manager = ConnectionManager()


# REST API Endpoints

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_active_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """Create a new chat session."""
    try:
        session = await chat_service.create_session(session_data, current_user)
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create chat session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat session"
        )


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """List user's chat sessions."""
    try:
        sessions = await chat_service.list_user_sessions(current_user, limit, offset)
        return sessions
        
    except Exception as e:
        logger.error(f"List chat sessions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list chat sessions"
        )


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """Get chat session details."""
    try:
        session = await chat_service.get_session(session_id, current_user)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get chat session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat session"
        )


@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(
    session_id: int,
    session_data: ChatSessionUpdate,
    current_user: User = Depends(get_current_active_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """Update chat session."""
    try:
        # Use the chat service to handle the update properly
        updated_session = await chat_service.update_session(session_id, session_data, current_user)

        if not updated_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )

        logger.info(f"Chat session updated: {session_id} by user {current_user.id}")
        return updated_session

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update chat session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update chat session"
        )


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """Delete chat session."""
    try:
        success = await chat_service.delete_session(session_id, current_user)
        
        if success:
            return {"message": f"Chat session {session_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete chat session"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete chat session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat session"
        )


@router.get("/sessions/{session_id}/conversation", response_model=ChatConversationResponse)
async def get_conversation(
    session_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """Get chat conversation (session with messages)."""
    try:
        conversation = await chat_service.get_conversation(
            session_id, current_user, limit, offset
        )
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get conversation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get conversation"
        )


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: int,
    message_content: str,
    current_user: User = Depends(get_current_active_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """Send a message to the chat session."""
    try:
        # Validate message content
        if not message_content or not message_content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty"
            )
        
        response = await chat_service.send_message(
            session_id, message_content.strip(), current_user
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send message error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )


@router.put("/messages/{message_id}/rating")
async def rate_message(
    message_id: int,
    rating_data: ChatMessageRating,
    current_user: User = Depends(get_current_active_user)
):
    """Rate a chat message."""
    try:
        from app.core.database import get_session
        from app.models.chat import ChatMessage
        from sqlmodel import select
        
        session = next(get_session())
        
        # Get message and verify ownership
        statement = select(ChatMessage).where(ChatMessage.id == message_id)
        message = session.exec(statement).first()
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        # Check if user owns the session
        chat_session = session.get(ChatSession, message.session_id)
        if not chat_session or chat_session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Update rating
        message.user_rating = rating_data.rating
        message.user_feedback = rating_data.feedback
        message.updated_at = datetime.utcnow()
        
        session.add(message)
        session.commit()
        
        logger.info(f"Message rated: {message_id} by user {current_user.id}")
        return {"message": "Message rated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rate message error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rate message"
        )


# WebSocket Endpoint

@router.websocket("/ws/{session_id}")
async def websocket_chat_endpoint(websocket: WebSocket, session_id: int, token: str = Query(...)):
    """WebSocket endpoint for real-time chat."""
    user_id = None
    
    try:
        # Validate JWT token
        user_id = validate_token_for_websocket(token)
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify session access
        from app.core.database import get_session
        from sqlmodel import select
        
        db_session = next(get_session())
        chat_service = ChatService(db_session)
        
        # Get user
        from app.models.user import User
        user = db_session.get(User, user_id)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify session access
        session_response = await chat_service.get_session(session_id, user)
        if not session_response:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Connect WebSocket
        await manager.connect(websocket, user_id)
        
        # Send connection confirmation
        welcome_message = WebSocketMessage(
            type="connected",
            session_id=session_id,
            content="Connected to chat session",
            data={"user_id": user_id, "session_id": session_id}
        )
        await websocket.send_text(welcome_message.json())
        
        # Listen for messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                if message_data.get("type") == "message":
                    content = message_data.get("content", "").strip()
                    
                    if content:
                        # Send typing indicator
                        typing_message = WebSocketMessage(
                            type="typing",
                            session_id=session_id,
                            data={"is_typing": True}
                        )
                        await websocket.send_text(typing_message.json())
                        
                        # Process message with streaming response
                        async for stream_response in chat_service.send_message_streaming(
                            session_id, content, user
                        ):
                            # Send streaming response
                            ws_message = WebSocketMessage(
                                type="stream_response",
                                session_id=session_id,
                                content=stream_response.content_delta,
                                data={
                                    "message_id": stream_response.message_id,
                                    "is_complete": stream_response.is_complete,
                                    "sources": [source.dict() for source in stream_response.sources],
                                    "metadata": stream_response.metadata,
                                    "error": stream_response.error
                                }
                            )
                            await websocket.send_text(ws_message.json())
                            
                            # Small delay to prevent overwhelming the client
                            await asyncio.sleep(0.01)
                        
                        # Send typing stopped
                        typing_stopped = WebSocketMessage(
                            type="typing",
                            session_id=session_id,
                            data={"is_typing": False}
                        )
                        await websocket.send_text(typing_stopped.json())
                
                elif message_data.get("type") == "ping":
                    # Respond to ping with pong
                    pong_message = WebSocketMessage(
                        type="pong",
                        session_id=session_id,
                        data={"timestamp": datetime.utcnow().isoformat()}
                    )
                    await websocket.send_text(pong_message.json())
                
            except json.JSONDecodeError:
                # Invalid JSON, send error
                error_message = WebSocketMessage(
                    type="error",
                    session_id=session_id,
                    content="Invalid message format"
                )
                await websocket.send_text(error_message.json())
                
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                error_message = WebSocketMessage(
                    type="error",
                    session_id=session_id,
                    content="Error processing message"
                )
                await websocket.send_text(error_message.json())
    
    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(websocket, user_id)
            logger.info(f"WebSocket disconnected for user {user_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if user_id:
            manager.disconnect(websocket, user_id)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass


# Admin endpoints

@router.get("/admin/stats")
async def get_chat_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Get chat statistics (admin only)."""
    try:
        from app.core.database import get_session
        from sqlmodel import func, select
        from app.models.chat import ChatSession, ChatMessage
        
        if current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        session = next(get_session())
        
        # Get basic stats
        total_sessions = session.exec(
            select(func.count(ChatSession.id))
        ).first()
        
        active_sessions = session.exec(
            select(func.count(ChatSession.id)).where(ChatSession.is_active == True)
        ).first()
        
        total_messages = session.exec(
            select(func.count(ChatMessage.id))
        ).first()
        
        # Get token usage
        total_tokens = session.exec(
            select(func.sum(ChatSession.total_tokens_used))
        ).first() or 0
        
        total_cost = session.exec(
            select(func.sum(ChatSession.estimated_cost))
        ).first() or 0.0
        
        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "total_messages": total_messages,
            "total_tokens_used": total_tokens,
            "estimated_total_cost": total_cost,
            "active_websocket_connections": len(manager.active_connections)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get chat stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat statistics"
        )