"""Document management API endpoints."""

import logging
import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.models.document import (
    Document,
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    DocumentSearchRequest,
    DocumentUploadResponse,
    DocumentProcessingStatus,
    ProcessingStatus,
    DocumentType
)
from app.services.document_service import DocumentService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_document_service(session: Session = Depends(get_session)) -> DocumentService:
    """Get document service dependency."""
    return DocumentService(session)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated tags
    is_confidential: bool = Form(True),
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Upload a new document."""
    logger.info(f"Document upload started - File: {file.filename}, Title: {title}, Description: {description}, Tags: {tags}, Is_confidential: {is_confidential}, User: {current_user.id}")
    logger.info(f"File details - Size: {file.size if hasattr(file, 'size') else 'unknown'}, Content-Type: {file.content_type}")

    # Log form data for debugging
    logger.info(f"Form validation - File present: {file is not None}, File filename: {getattr(file, 'filename', 'N/A')}")

    # Basic validation
    if not file:
        logger.error("No file provided in upload")
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename:
        logger.error("File has no filename")
        raise HTTPException(status_code=400, detail="File must have a filename")
    try:
        # Parse tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Create document data
        document_data = DocumentCreate(
            title=title or file.filename,
            description=description,
            tags=tag_list,
            is_confidential=is_confidential
        )
        
        # Upload and process document
        document = await document_service.upload_document(file, current_user, document_data)
        
        return DocumentUploadResponse(
            document_id=document.id,
            filename=document.filename,
            processing_status=document.processing_status,
            message="Document uploaded successfully and is being processed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")

        # Check if it's a validation error
        if hasattr(e, 'errors'):
            logger.error(f"Validation errors: {e.errors()}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document upload failed: {str(e)}"
        )


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    document_type: Optional[DocumentType] = Query(None),
    processing_status: Optional[ProcessingStatus] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """List documents with filtering and pagination."""
    try:
        search_request = DocumentSearchRequest(
            query=query,
            document_type=document_type,
            processing_status=processing_status,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await document_service.search_documents(search_request, current_user)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document list error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents"
        )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get document details by ID."""
    try:
        document = await document_service.get_document(document_id, current_user)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get document error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve document"
        )


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Update document metadata."""
    try:
        # Get current document
        document = await document_service.get_document(document_id, current_user)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check permissions
        if document.user_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Update document in database
        from app.core.database import get_session
        session = next(get_session())
        
        db_document = session.get(Document, document_id)
        if not db_document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Update fields
        for field, value in document_data.dict(exclude_unset=True).items():
            if field == "tags" and value:
                # Convert tags list to comma-separated string
                setattr(db_document, field, ",".join(value))
            else:
                setattr(db_document, field, value)
        
        db_document.updated_at = datetime.utcnow()
        session.add(db_document)
        session.commit()
        session.refresh(db_document)
        
        # Update vector database metadata if needed
        if db_document.processing_status == ProcessingStatus.READY:
            from app.services.vector_service import vector_service
            await vector_service.update_document_metadata(
                document_id, 
                {
                    "document_type": db_document.document_type or "other",
                    "is_confidential": db_document.is_confidential
                }
            )
        
        logger.info(f"Document updated: {document_id} by user {current_user.id}")
        return DocumentResponse.from_orm(db_document)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update document error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update document"
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Delete document."""
    try:
        success = await document_service.delete_document(document_id, current_user)
        
        if success:
            return {"message": f"Document {document_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Document deletion failed"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete document error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )


@router.get("/{document_id}/status", response_model=DocumentProcessingStatus)
async def get_document_processing_status(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get document processing status."""
    try:
        document = await document_service.get_document(document_id, current_user)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Calculate progress percentage
        progress_percentage = None
        current_step = None
        
        if document.processing_status == ProcessingStatus.UPLOADING:
            progress_percentage = 10.0
            current_step = "Uploading file"
        elif document.processing_status == ProcessingStatus.UPLOADED:
            progress_percentage = 20.0
            current_step = "File uploaded"
        elif document.processing_status == ProcessingStatus.PROCESSING:
            progress_percentage = 50.0
            current_step = "Extracting text"
        elif document.processing_status == ProcessingStatus.OCR_PROCESSING:
            progress_percentage = 70.0
            current_step = "Performing OCR"
        elif document.processing_status == ProcessingStatus.EMBEDDING:
            progress_percentage = 90.0
            current_step = "Creating embeddings"
        elif document.processing_status == ProcessingStatus.READY:
            progress_percentage = 100.0
            current_step = "Ready"
        elif document.processing_status == ProcessingStatus.FAILED:
            progress_percentage = 0.0
            current_step = "Failed"
        
        return DocumentProcessingStatus(
            document_id=document_id,
            status=document.processing_status,
            progress_percentage=progress_percentage,
            current_step=current_step,
            error_message=document.processing_error
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get processing status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get processing status"
        )


@router.get("/{document_id}/content")
async def get_document_content(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get document extracted text content."""
    try:
        document = await document_service.get_document(document_id, current_user)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Get document from database to access extracted text
        from app.core.database import get_session
        session = next(get_session())
        
        db_document = session.get(Document, document_id)
        if not db_document or not db_document.extracted_text:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document content not available"
            )
        
        return {
            "document_id": document_id,
            "content": db_document.extracted_text,
            "word_count": db_document.word_count,
            "language": db_document.language,
            "has_ocr": db_document.has_ocr
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get document content error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get document content"
        )


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Download the original document file."""
    try:
        document = await document_service.get_document(document_id, current_user)

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Get document from database to access file path
        from app.core.database import get_session
        session = next(get_session())

        db_document = session.get(Document, document_id)
        if not db_document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check if file exists
        file_path = db_document.file_path

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found on server"
            )

        # Return file for download
        return FileResponse(
            path=file_path,
            filename=db_document.original_filename,
            media_type=db_document.content_type
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download document error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download document"
        )


@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """Get document chunks from vector database."""
    try:
        document = await document_service.get_document(document_id, current_user)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Get chunks from vector service
        from app.services.vector_service import vector_service
        chunks = await vector_service.get_document_chunks(document_id)
        
        return {
            "document_id": document_id,
            "chunk_count": len(chunks),
            "chunks": [
                {
                    "chunk_id": chunk.chunk_id,
                    "content": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                    "chunk_index": chunk.chunk_index,
                    "token_count": chunk.token_count
                }
                for chunk in chunks
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get document chunks error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get document chunks"
        )


# Admin endpoints

@router.get("/admin/stats")
async def get_document_stats(
    current_user: User = Depends(get_current_admin_user)
):
    """Get document statistics (admin only)."""
    try:
        from app.core.database import get_session
        from sqlmodel import func
        session = next(get_session())
        
        # Get basic stats
        total_docs = session.exec(
            select(func.count(Document.id)).where(
                Document.processing_status != ProcessingStatus.DELETED
            )
        ).first()
        
        # Get stats by status
        status_stats = {}
        for status in ProcessingStatus:
            count = session.exec(
                select(func.count(Document.id)).where(Document.processing_status == status)
            ).first()
            status_stats[status.value] = count
        
        # Get stats by type
        type_stats = {}
        for doc_type in DocumentType:
            count = session.exec(
                select(func.count(Document.id)).where(Document.document_type == doc_type)
            ).first()
            type_stats[doc_type.value] = count
        
        # Get total file size
        total_size = session.exec(
            select(func.sum(Document.file_size)).where(
                Document.processing_status != ProcessingStatus.DELETED
            )
        ).first() or 0
        
        # Get vector database stats
        from app.services.vector_service import vector_service
        vector_stats = await vector_service.get_collection_stats()
        
        return {
            "total_documents": total_docs,
            "documents_by_status": status_stats,
            "documents_by_type": type_stats,
            "total_file_size_bytes": total_size,
            "vector_database": vector_stats
        }
        
    except Exception as e:
        logger.error(f"Get document stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get document statistics"
        )