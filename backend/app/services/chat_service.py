"""Chat service for AI conversation management."""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, AsyncGenerator
import json

from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.core.database import get_session
from app.models.user import User
from app.models.chat import (
    ChatSession,
    ChatMessage,
    ChatSessionCreate,
    ChatSessionUpdate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatConversationResponse,
    ChatStreamResponse,
    MessageRole,
    ChatSessionType
)
from app.models.document import Document, DocumentSource
from app.services.llm_service import llm_service
from app.services.vector_service import vector_service

logger = logging.getLogger(__name__)


class ChatService:
    """Service for chat management and AI conversation."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create_session(
        self,
        session_data: ChatSessionCreate,
        user: User
    ) -> ChatSessionResponse:
        """Create a new chat session."""
        try:
            # Validate document if provided
            if session_data.document_id:
                document = self.session.get(Document, session_data.document_id)
                if not document:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Document not found"
                    )
                
                # Check permissions
                if document.user_id != user.id and user.role.value != "admin":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not enough permissions to access this document"
                    )
                
                # Set appropriate session type
                if session_data.session_type == ChatSessionType.GENERAL:
                    session_data.session_type = ChatSessionType.DOCUMENT
            
            # Create chat session
            chat_session = ChatSession(
                title=session_data.title,
                session_type=session_data.session_type,
                user_id=user.id,
                document_id=session_data.document_id,
                system_prompt=session_data.system_prompt,
                temperature=session_data.temperature,
                max_tokens=session_data.max_tokens
            )
            
            self.session.add(chat_session)
            self.session.commit()
            self.session.refresh(chat_session)
            
            logger.info(f"Chat session created: {chat_session.id} by user {user.id}")
            return ChatSessionResponse.model_validate(chat_session)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating chat session: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create chat session"
            )
    
    async def get_session(
        self,
        session_id: int,
        user: User
    ) -> Optional[ChatSessionResponse]:
        """Get chat session by ID."""
        try:
            statement = select(ChatSession).where(ChatSession.id == session_id)
            chat_session = self.session.exec(statement).first()
            
            if not chat_session:
                return None
            
            # Check permissions
            if chat_session.user_id != user.id and user.role.value != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
            
            return ChatSessionResponse.model_validate(chat_session)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting chat session {session_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get chat session"
            )
    
    async def get_conversation(
        self,
        session_id: int,
        user: User,
        limit: int = 50,
        offset: int = 0
    ) -> ChatConversationResponse:
        """Get chat session with messages."""
        try:
            # Get session
            session_response = await self.get_session(session_id, user)
            if not session_response:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found"
                )
            
            # Get messages
            statement = (
                select(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.message_index)
                .offset(offset)
                .limit(limit)
            )
            
            messages = self.session.exec(statement).all()
            
            # Convert to response format
            message_responses = []
            for message in messages:
                # Parse sources from JSON - ensure sources is always a list
                sources = []
                if message.sources is not None:
                    try:
                        if isinstance(message.sources, str):
                            # If sources is a JSON string, parse it
                            import json
                            sources_data = json.loads(message.sources)
                            sources = [DocumentSource(**source) for source in sources_data]
                        elif isinstance(message.sources, list):
                            # If sources is already a list
                            sources = [DocumentSource(**source) for source in message.sources]
                    except Exception as e:
                        logger.warning(f"Error parsing message sources: {e}")
                        sources = []

                # Create message response with proper sources
                message_dict = message.__dict__.copy()
                message_dict['sources'] = sources  # Ensure sources is always a list, never None
                message_response = ChatMessageResponse.model_validate(message_dict)
                message_responses.append(message_response)
            
            # Check if there are more messages
            total_messages = self.session.exec(
                select(ChatMessage).where(ChatMessage.session_id == session_id)
            ).all()
            
            has_more = offset + limit < len(total_messages)
            
            return ChatConversationResponse(
                session=session_response,
                messages=message_responses,
                has_more=has_more,
                total_messages=len(total_messages)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting conversation {session_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get conversation"
            )
    
    async def send_message(
        self,
        session_id: int,
        content: str,
        user: User
    ) -> ChatMessageResponse:
        """Send a message and get AI response."""
        try:
            # Get session
            chat_session = await self.get_session(session_id, user)
            if not chat_session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found"
                )
            
            # Create user message
            user_message = await self._create_message(
                session_id=session_id,
                role=MessageRole.USER,
                content=content
            )
            
            # Get conversation context
            conversation_history = await self._get_conversation_history(session_id)
            
            # Get document context if this is a document chat
            document_sources = []
            document_content = None
            if chat_session.document_id:
                # Get the full document content directly from database
                document = self.session.get(Document, chat_session.document_id)
                if document and document.extracted_text:
                    document_content = document.extracted_text
                    # Create a basic document source for reference
                    document_sources = [DocumentSource(
                        document_id=document.id,
                        document_title=document.title or document.original_filename,
                        filename=document.original_filename,
                        excerpt=document.extracted_text[:500] + "..." if len(document.extracted_text) > 500 else document.extracted_text,
                        confidence_score=1.0,
                        relevance_score=1.0
                    )]

                # Try vector search as backup
                try:
                    vector_sources = await self._get_document_context(
                        chat_session.document_id,
                        content
                    )
                    if vector_sources:
                        document_sources.extend(vector_sources)
                except Exception as e:
                    logger.warning(f"Vector search failed, using direct document content: {e}")

            elif chat_session.session_type == ChatSessionType.MULTI_DOCUMENT:
                # Search across all user's documents
                try:
                    document_sources = await vector_service.search_documents(
                        query=content,
                        user_id=user.id,
                        limit=5
                    )
                except Exception as e:
                    logger.warning(f"Multi-document vector search failed: {e}")
                    document_sources = []
            
            # Generate AI response
            ai_response = await self._generate_ai_response(
                conversation_history=conversation_history,
                system_prompt=chat_session.system_prompt,
                temperature=chat_session.temperature,
                max_tokens=chat_session.max_tokens,
                document_context=document_sources
            )
            
            # Create AI message
            ai_message = await self._create_message(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=ai_response["content"],
                model_name=ai_response["model_name"],
                tokens_used=ai_response["tokens_used"],
                response_time_ms=ai_response["response_time_ms"],
                confidence_score=ai_response["confidence_score"],
                sources=ai_response["sources"]
            )
            
            # Update session stats
            await self._update_session_stats(session_id, ai_response["tokens_used"])
            
            # Convert to response format
            sources = [DocumentSource(**source) for source in ai_response["sources"]]
            ai_message_response = ChatMessageResponse.model_validate(ai_message)
            ai_message_response.sources = sources

            return ai_message_response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error sending message to session {session_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message"
            )
    
    async def send_message_streaming(
        self,
        session_id: int,
        content: str,
        user: User
    ) -> AsyncGenerator[ChatStreamResponse, None]:
        """Send a message and stream AI response."""
        try:
            # Get session
            chat_session = await self.get_session(session_id, user)
            if not chat_session:
                yield ChatStreamResponse(
                    session_id=session_id,
                    error="Chat session not found"
                )
                return
            
            # Create user message
            user_message = await self._create_message(
                session_id=session_id,
                role=MessageRole.USER,
                content=content
            )
            
            # Create placeholder AI message
            ai_message = await self._create_message(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content="",
                is_streaming=True,
                is_complete=False
            )
            
            # Get conversation context
            conversation_history = await self._get_conversation_history(session_id)
            
            # Get document context if needed
            document_sources = []
            if chat_session.document_id:
                document_sources = await self._get_document_context(
                    chat_session.document_id,
                    content
                )
            elif chat_session.session_type == ChatSessionType.MULTI_DOCUMENT:
                document_sources = await vector_service.search_documents(
                    query=content,
                    user_id=user.id,
                    limit=5
                )
            
            # Stream AI response
            full_content = ""
            async for chunk in llm_service.generate_streaming_response(
                messages=conversation_history,
                system_prompt=chat_session.system_prompt,
                temperature=chat_session.temperature,
                max_tokens=chat_session.max_tokens,
                document_context=document_sources
            ):
                full_content += chunk.get("content_delta", "")
                
                # Update message in database
                ai_message.content = full_content
                ai_message.is_complete = chunk.get("is_complete", False)
                
                if chunk.get("is_complete"):
                    ai_message.tokens_used = chunk.get("tokens_used", 0)
                    ai_message.response_time_ms = chunk.get("response_time_ms", 0)
                    ai_message.confidence_score = chunk.get("confidence_score", 0.0)
                    ai_message.model_name = chunk.get("model_name")
                    ai_message.sources = chunk.get("sources", [])
                    ai_message.is_streaming = False
                
                self.session.add(ai_message)
                self.session.commit()
                
                # Yield stream response
                yield ChatStreamResponse(
                    session_id=session_id,
                    message_id=ai_message.id,
                    content_delta=chunk.get("content_delta", ""),
                    is_complete=chunk.get("is_complete", False),
                    sources=[DocumentSource(**source) for source in chunk.get("sources", [])],
                    metadata={
                        "tokens_used": chunk.get("tokens_used", 0),
                        "confidence_score": chunk.get("confidence_score", 0.0),
                        "model_name": chunk.get("model_name")
                    }
                )
            
            # Update session stats
            if ai_message.tokens_used:
                await self._update_session_stats(session_id, ai_message.tokens_used)
            
        except Exception as e:
            logger.error(f"Error streaming message to session {session_id}: {e}")
            yield ChatStreamResponse(
                session_id=session_id,
                error=str(e)
            )
    
    async def _create_message(
        self,
        session_id: int,
        role: MessageRole,
        content: str,
        model_name: Optional[str] = None,
        tokens_used: Optional[int] = None,
        response_time_ms: Optional[int] = None,
        confidence_score: Optional[float] = None,
        sources: Optional[List[Dict[str, Any]]] = None,
        is_streaming: bool = False,
        is_complete: bool = True
    ) -> ChatMessage:
        """Create a chat message in the database."""
        
        # Get next message index
        statement = select(ChatMessage).where(ChatMessage.session_id == session_id)
        existing_messages = self.session.exec(statement).all()
        message_index = len(existing_messages)
        
        # Create message
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            message_index=message_index,
            model_name=model_name,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms,
            confidence_score=confidence_score,
            sources=sources,
            is_streaming=is_streaming,
            is_complete=is_complete
        )
        
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)

        # Update session last_message_at for any message type
        chat_session = self.session.get(ChatSession, session_id)
        if chat_session:
            chat_session.last_message_at = datetime.utcnow()
            self.session.add(chat_session)
            self.session.commit()

        return message
    
    async def _get_conversation_history(
        self,
        session_id: int,
        limit: int = 20
    ) -> List[Dict[str, str]]:
        """Get recent conversation history for context."""
        statement = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.message_index.desc())
            .limit(limit)
        )
        
        messages = self.session.exec(statement).all()
        
        # Reverse to get chronological order
        messages = list(reversed(messages))
        
        # Convert to API format
        history = []
        for message in messages:
            history.append({
                "role": message.role.value,
                "content": message.content
            })
        
        return history
    
    async def _get_document_context(
        self,
        document_id: int,
        query: str,
        limit: int = 5
    ) -> List[DocumentSource]:
        """Get relevant document context for the query."""
        try:
            # First try ChromaDB vector search
            sources = await vector_service.search_documents(
                query=query,
                document_ids=[document_id],
                limit=limit,
                min_confidence=0.3
            )

            # If ChromaDB returns no results, fallback to direct document access
            if not sources:
                logger.info(f"No vector search results, using direct document access for document {document_id}")
                document = self.session.get(Document, document_id)
                if document and document.extracted_text:
                    # Create a basic document source with the full text
                    source = DocumentSource(
                        document_id=document.id,
                        document_title=document.title or document.original_filename,
                        filename=document.original_filename,
                        excerpt=document.extracted_text[:2000] + "..." if len(document.extracted_text) > 2000 else document.extracted_text,
                        confidence_score=1.0,
                        relevance_score=1.0
                    )
                    sources = [source]
                    logger.info(f"Using direct document content for document {document_id}")

            return sources

        except Exception as e:
            logger.error(f"Error getting document context for {document_id}: {e}")
            return []
    
    async def _generate_ai_response(
        self,
        conversation_history: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1024,
        document_context: Optional[List[DocumentSource]] = None
    ) -> Dict[str, Any]:
        """Generate AI response using LLM service."""
        try:
            response = await llm_service.generate_response(
                messages=conversation_history,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                document_context=document_context
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return {
                "content": "I apologize, but I'm experiencing technical difficulties. Please try again later.",
                "tokens_used": 0,
                "response_time_ms": 0,
                "confidence_score": 0.0,
                "sources": [],
                "model_name": "error",
                "is_complete": False
            }
    
    async def _update_session_stats(
        self,
        session_id: int,
        tokens_used: int
    ):
        """Update session statistics."""
        try:
            chat_session = self.session.get(ChatSession, session_id)
            if chat_session:
                chat_session.last_message_at = datetime.utcnow()
                chat_session.message_count += 1
                chat_session.total_tokens_used += tokens_used
                
                # Calculate estimated cost (rough estimation)
                # Adjust based on actual model pricing
                cost_per_token = 0.00002  # Example: $0.02 per 1K tokens
                chat_session.estimated_cost += tokens_used * cost_per_token
                
                self.session.add(chat_session)
                self.session.commit()
                
        except Exception as e:
            logger.error(f"Error updating session stats: {e}")
    
    async def update_session(
        self,
        session_id: int,
        update_data: ChatSessionUpdate,
        user: User
    ) -> Optional[ChatSessionResponse]:
        """Update a chat session."""
        try:
            # Get existing session and verify permissions
            existing_session = await self.get_session(session_id, user)
            if not existing_session:
                return None

            # Get the database session
            db_chat_session = self.session.get(ChatSession, session_id)
            if not db_chat_session:
                return None

            # Update fields
            for field, value in update_data.dict(exclude_unset=True).items():
                setattr(db_chat_session, field, value)

            db_chat_session.updated_at = datetime.utcnow()
            self.session.add(db_chat_session)
            self.session.commit()
            self.session.refresh(db_chat_session)

            logger.info(f"Chat session updated: {session_id} by user {user.id}")
            return ChatSessionResponse.model_validate(db_chat_session)

        except Exception as e:
            logger.error(f"Error updating chat session {session_id}: {e}")
            self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update chat session"
            )

    async def delete_session(
        self,
        session_id: int,
        user: User
    ) -> bool:
        """Delete a chat session and its messages."""
        try:
            # Get session
            chat_session = await self.get_session(session_id, user)
            if not chat_session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found"
                )
            
            # Delete messages
            statement = select(ChatMessage).where(ChatMessage.session_id == session_id)
            messages = self.session.exec(statement).all()
            
            for message in messages:
                self.session.delete(message)
            
            # Delete session
            db_session = self.session.get(ChatSession, session_id)
            if db_session:
                self.session.delete(db_session)
            
            self.session.commit()
            
            logger.info(f"Chat session deleted: {session_id} by user {user.id}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting chat session {session_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete chat session"
            )
    
    async def list_user_sessions(
        self,
        user: User,
        limit: int = 20,
        offset: int = 0
    ) -> List[ChatSessionResponse]:
        """List user's chat sessions."""
        try:
            statement = (
                select(ChatSession)
                .where(ChatSession.user_id == user.id)
                .where(ChatSession.is_active == True)
                .order_by(ChatSession.created_at.desc())
                .offset(offset)
                .limit(limit)
            )
            
            sessions = self.session.exec(statement).all()
            
            return [ChatSessionResponse.model_validate(session) for session in sessions]
            
        except Exception as e:
            logger.error(f"Error listing user sessions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list chat sessions"
            )


def get_chat_service(session: Session = next(get_session())) -> ChatService:
    """Get chat service instance."""
    return ChatService(session)