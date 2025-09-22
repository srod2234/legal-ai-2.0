"""Vector database service for ChromaDB integration."""

import asyncio
import logging
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import hashlib
import json

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions
import openai

from app.core.config import settings
from app.models.document import Document, DocumentChunk, DocumentSource

logger = logging.getLogger(__name__)


class VectorService:
    """Service for vector database operations using ChromaDB."""

    def __init__(self):
        self.client = None
        self.collection = None
        self.embedding_function = None
        self._initialized = False
    
    def _initialize_client(self):
        """Initialize ChromaDB client and embedding function."""
        try:
            # Initialize ChromaDB client
            if settings.chroma_host == "localhost":
                # Try HTTP client first for containerized ChromaDB
                try:
                    self.client = chromadb.HttpClient(
                        host=settings.chroma_host,
                        port=settings.chroma_port
                    )
                    # Test connection
                    self.client.heartbeat()
                    logger.info(f"Connected to ChromaDB via HTTP at {settings.chroma_host}:{settings.chroma_port}")
                except Exception as e:
                    logger.warning(f"Failed to connect to ChromaDB via HTTP: {e}")
                    # Fallback to PersistentClient for local development
                    logger.info("Falling back to PersistentClient for local development")
                    self.client = chromadb.PersistentClient(path="./chroma_db")
            else:
                # Production setup with HTTP client
                self.client = chromadb.HttpClient(
                    host=settings.chroma_host,
                    port=settings.chroma_port
                )
            
            # Initialize embedding function
            if settings.embedding_provider == "openai" and (settings.embedding_api_key or settings.llm_api_key):
                # Use OpenAI embedding function
                openai_api_key = settings.embedding_api_key or settings.llm_api_key
                self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                    api_key=openai_api_key,
                    model_name="text-embedding-3-large"
                )
                logger.info("Using OpenAI embeddings")
            else:
                # Use sentence transformers as fallback with correct model name
                self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name="all-MiniLM-L6-v2"  # Use valid SentenceTransformers model
                )
                logger.info("Using SentenceTransformers embeddings: all-MiniLM-L6-v2")
            
            # Mark as initialized
            self._initialized = True
            logger.info("ChromaDB client initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB client: {e}")
            self._initialized = False
            # Don't raise exception - allow graceful degradation

    def _ensure_initialized(self):
        """Ensure the service is initialized before use."""
        if not self._initialized:
            self._initialize_client()

        if not self._initialized:
            raise Exception("ChromaDB service not available")

        # Only try to create collection once - if it failed before, don't retry
        if not self.collection and not hasattr(self, '_collection_creation_attempted'):
            self.collection = self._get_or_create_collection(settings.chroma_collection_name)
            self._collection_creation_attempted = True
    
    def _get_or_create_collection(self, collection_name: str):
        """Get or create a ChromaDB collection."""
        try:
            # Try to get existing collection
            collection = self.client.get_collection(
                name=collection_name,
                embedding_function=self.embedding_function
            )
            logger.info(f"Using existing collection: {collection_name}")
            return collection

        except Exception as e:
            logger.info(f"Collection {collection_name} doesn't exist, creating new one...")
            # Create new collection if it doesn't exist
            try:
                # For ChromaDB 0.5.x, use the simpler API without extra metadata
                collection = self.client.create_collection(
                    name=collection_name,
                    embedding_function=self.embedding_function
                )
                logger.info(f"Created new collection: {collection_name}")
                return collection

            except Exception as create_error:
                logger.error(f"Failed to create collection {collection_name}: {create_error}")
                # Try without embedding function and set it later
                try:
                    collection = self.client.create_collection(name=collection_name)
                    collection._embedding_function = self.embedding_function
                    logger.info(f"Created simple collection: {collection_name}")
                    return collection
                except Exception as simple_error:
                    logger.error(f"Collection creation failed: {simple_error}")
                    # If ChromaDB collection creation fails completely, disable embeddings
                    logger.warning("ChromaDB collection creation failed - document embeddings will be disabled")
                    return None
    
    async def chunk_document(self, text: str, document_id: int, max_chunk_size: int = 1000) -> List[DocumentChunk]:
        """Split document text into chunks for embedding."""
        try:
            chunks = []
            
            # Simple text chunking by sentences and paragraphs
            paragraphs = text.split('\n\n')
            current_chunk = ""
            chunk_index = 0
            
            for paragraph in paragraphs:
                # If adding this paragraph would exceed max size, save current chunk
                if len(current_chunk) + len(paragraph) > max_chunk_size and current_chunk:
                    chunk_id = f"doc_{document_id}_chunk_{chunk_index}"
                    
                    chunk = DocumentChunk(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        content=current_chunk.strip(),
                        chunk_index=chunk_index,
                        token_count=len(current_chunk.split()),
                        metadata={
                            "created_at": datetime.utcnow().isoformat(),
                            "chunk_size": len(current_chunk)
                        }
                    )
                    chunks.append(chunk)
                    
                    current_chunk = paragraph
                    chunk_index += 1
                else:
                    current_chunk += "\n\n" + paragraph if current_chunk else paragraph
            
            # Add the last chunk
            if current_chunk.strip():
                chunk_id = f"doc_{document_id}_chunk_{chunk_index}"
                
                chunk = DocumentChunk(
                    chunk_id=chunk_id,
                    document_id=document_id,
                    content=current_chunk.strip(),
                    chunk_index=chunk_index,
                    token_count=len(current_chunk.split()),
                    metadata={
                        "created_at": datetime.utcnow().isoformat(),
                        "chunk_size": len(current_chunk)
                    }
                )
                chunks.append(chunk)
            
            logger.info(f"Document {document_id} split into {len(chunks)} chunks")
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking document {document_id}: {e}")
            raise
    
    async def embed_document(self, document: Document, text: str) -> bool:
        """Embed document text into ChromaDB."""
        try:
            self._ensure_initialized()

            # Check if collection creation failed
            if not self.collection:
                logger.warning(f"ChromaDB collection not available - skipping embeddings for document {document.id}")
                return True  # Return True to not fail the entire document processing

            # Chunk the document text
            chunks = await self.chunk_document(text, document.id)
            
            if not chunks:
                logger.warning(f"No chunks created for document {document.id}")
                return False
            
            # Prepare data for ChromaDB
            chunk_ids = [chunk.chunk_id for chunk in chunks]
            chunk_texts = [chunk.content for chunk in chunks]
            chunk_metadata = []
            
            for chunk in chunks:
                metadata = {
                    "document_id": str(document.id),
                    "user_id": str(document.user_id),
                    "filename": document.filename,
                    "document_type": document.document_type or "other",
                    "chunk_index": chunk.chunk_index,
                    "token_count": chunk.token_count,
                    "created_at": document.created_at.isoformat(),
                    "is_confidential": document.is_confidential,
                    **chunk.metadata
                }
                chunk_metadata.append(metadata)
            
            # Use asyncio.run_in_executor for ChromaDB operations (sync API)
            loop = asyncio.get_event_loop()
            
            await loop.run_in_executor(
                None,
                lambda: self.collection.add(
                    ids=chunk_ids,
                    documents=chunk_texts,
                    metadatas=chunk_metadata
                )
            )
            
            logger.info(f"Successfully embedded document {document.id} with {len(chunks)} chunks")
            return True
            
        except Exception as e:
            logger.error(f"Error embedding document {document.id}: {e}")
            raise
    
    async def search_documents(
        self,
        query: str,
        user_id: Optional[int] = None,
        document_ids: Optional[List[int]] = None,
        limit: int = 10,
        min_confidence: float = 0.5
    ) -> List[DocumentSource]:
        """Search for relevant document chunks using vector similarity."""
        try:
            self._ensure_initialized()

            # Check if collection is available
            if not self.collection:
                logger.warning("ChromaDB collection not available - returning empty search results")
                return []
            # Prepare where clause for filtering
            where_clause = {}
            
            if user_id:
                where_clause["user_id"] = str(user_id)
            
            if document_ids:
                where_clause["document_id"] = {"$in": [str(doc_id) for doc_id in document_ids]}
            
            # Use asyncio.run_in_executor for ChromaDB operations
            loop = asyncio.get_event_loop()
            
            results = await loop.run_in_executor(
                None,
                lambda: self.collection.query(
                    query_texts=[query],
                    n_results=min(limit * 2, 50),  # Get extra results for filtering
                    where=where_clause if where_clause else None,
                    include=["documents", "metadatas", "distances"]
                )
            )
            
            # Process results into DocumentSource objects
            sources = []
            
            if results and results.get("documents") and results["documents"][0]:
                documents = results["documents"][0]
                metadatas = results["metadatas"][0]
                distances = results["distances"][0]
                
                for i, (doc_text, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
                    # Convert distance to confidence score (lower distance = higher confidence)
                    confidence_score = max(0.0, 1.0 - distance)
                    
                    if confidence_score >= min_confidence:
                        source = DocumentSource(
                            document_id=int(metadata["document_id"]),
                            document_title=metadata.get("filename", "Unknown"),
                            filename=metadata["filename"],
                            page_number=metadata.get("page_number"),
                            chunk_id=metadata.get("chunk_id"),
                            excerpt=doc_text[:500] + "..." if len(doc_text) > 500 else doc_text,
                            confidence_score=confidence_score,
                            relevance_score=confidence_score
                        )
                        sources.append(source)
            
            # Sort by confidence score and limit results
            sources.sort(key=lambda x: x.confidence_score, reverse=True)
            sources = sources[:limit]
            
            logger.info(f"Vector search returned {len(sources)} relevant sources for query")
            return sources
            
        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            raise
    
    async def get_document_chunks(self, document_id: int) -> List[DocumentChunk]:
        """Get all chunks for a specific document."""
        try:
            self._ensure_initialized()

            # Check if collection is available
            if not self.collection:
                logger.info(f"ChromaDB collection not available - returning empty chunks for document {document_id}")
                return []

            loop = asyncio.get_event_loop()

            results = await loop.run_in_executor(
                None,
                lambda: self.collection.get(
                    where={"document_id": str(document_id)},
                    include=["documents", "metadatas"]
                )
            )

            chunks = []

            if results and results.get("documents"):
                documents = results["documents"]
                metadatas = results["metadatas"]
                ids = results["ids"]

                for doc_id, doc_text, metadata in zip(ids, documents, metadatas):
                    chunk = DocumentChunk(
                        chunk_id=doc_id,
                        document_id=document_id,
                        content=doc_text,
                        chunk_index=metadata.get("chunk_index", 0),
                        token_count=metadata.get("token_count", 0),
                        metadata=metadata
                    )
                    chunks.append(chunk)

            logger.info(f"Retrieved {len(chunks)} chunks for document {document_id}")
            return chunks
            
        except Exception as e:
            logger.error(f"Error getting document chunks for {document_id}: {e}")
            raise
    
    async def delete_document_embeddings(self, document_id: int) -> bool:
        """Delete all embeddings for a specific document."""
        try:
            self._ensure_initialized()

            # Check if collection is available
            if not self.collection:
                logger.info(f"ChromaDB collection not available - skipping deletion for document {document_id}")
                return True

            loop = asyncio.get_event_loop()

            await loop.run_in_executor(
                None,
                lambda: self.collection.delete(
                    where={"document_id": str(document_id)}
                )
            )

            logger.info(f"Deleted embeddings for document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting embeddings for document {document_id}: {e}")
            raise
    
    async def update_document_metadata(self, document_id: int, metadata_updates: Dict[str, Any]) -> bool:
        """Update metadata for all chunks of a document."""
        try:
            self._ensure_initialized()

            # Check if collection is available
            if not self.collection:
                logger.info(f"ChromaDB collection not available - skipping metadata update for document {document_id}")
                return True

            # Get all chunk IDs for the document
            loop = asyncio.get_event_loop()

            results = await loop.run_in_executor(
                None,
                lambda: self.collection.get(
                    where={"document_id": str(document_id)},
                    include=["metadatas"]
                )
            )

            if not results or not results.get("ids"):
                logger.warning(f"No chunks found for document {document_id}")
                return False

            # Update metadata for each chunk
            chunk_ids = results["ids"]
            updated_metadata = []

            for metadata in results["metadatas"]:
                updated_meta = {**metadata, **metadata_updates}
                updated_metadata.append(updated_meta)

            await loop.run_in_executor(
                None,
                lambda: self.collection.update(
                    ids=chunk_ids,
                    metadatas=updated_metadata
                )
            )

            logger.info(f"Updated metadata for {len(chunk_ids)} chunks of document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Error updating metadata for document {document_id}: {e}")
            raise
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector collection."""
        try:
            self._ensure_initialized()

            # Check if collection is available
            if not self.collection:
                logger.info("ChromaDB collection not available - returning basic stats")
                return {
                    "total_chunks": 0,
                    "collection_name": settings.chroma_collection_name,
                    "embedding_model": settings.embedding_model,
                    "unique_documents": 0,
                    "unique_users": 0,
                    "document_types": {},
                    "confidential_documents": 0,
                    "status": "embeddings_disabled"
                }

            loop = asyncio.get_event_loop()

            # Get collection count
            count = await loop.run_in_executor(
                None,
                lambda: self.collection.count()
            )

            # Get sample data for analysis
            sample_results = await loop.run_in_executor(
                None,
                lambda: self.collection.get(
                    limit=1000,
                    include=["metadatas"]
                )
            )

            stats = {
                "total_chunks": count,
                "collection_name": settings.chroma_collection_name,
                "embedding_model": settings.embedding_model,
                "unique_documents": 0,
                "unique_users": 0,
                "document_types": {},
                "confidential_documents": 0
            }

            if sample_results and sample_results.get("metadatas"):
                doc_ids = set()
                user_ids = set()
                doc_types = {}
                confidential_count = 0

                for metadata in sample_results["metadatas"]:
                    doc_ids.add(metadata.get("document_id"))
                    user_ids.add(metadata.get("user_id"))

                    doc_type = metadata.get("document_type", "other")
                    doc_types[doc_type] = doc_types.get(doc_type, 0) + 1

                    if metadata.get("is_confidential"):
                        confidential_count += 1

                stats.update({
                    "unique_documents": len(doc_ids),
                    "unique_users": len(user_ids),
                    "document_types": doc_types,
                    "confidential_documents": confidential_count
                })

            return stats

        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}
    
    async def health_check(self) -> bool:
        """Check if ChromaDB service is healthy."""
        try:
            self._ensure_initialized()

            # If collection is None, embeddings are disabled but service is "healthy"
            if not self.collection:
                logger.info("ChromaDB collection not available - embeddings disabled but service operational")
                return True

            loop = asyncio.get_event_loop()

            # Try to get collection count
            await loop.run_in_executor(
                None,
                lambda: self.collection.count()
            )

            return True

        except Exception as e:
            logger.error(f"ChromaDB health check failed: {e}")
            return False


# Global vector service instance
vector_service = VectorService()