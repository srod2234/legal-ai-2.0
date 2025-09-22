from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, create_engine, Session, select
from typing import Optional
import os
from datetime import datetime

app = FastAPI(title="Legal AI API - Demo", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://legal_ai_user:dev_password@localhost:5432/legal_ai_db")
engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

# Create tables
@app.on_event("startup")
async def startup():
    SQLModel.metadata.create_all(engine)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Legal AI API is running", "docs": "/docs"}

# Mock auth endpoint
@app.post("/api/auth/login")
async def login(credentials: dict):
    return {
        "access_token": "demo_token",
        "refresh_token": "demo_refresh",
        "token_type": "bearer",
        "expires_in": 3600,
        "user": {
            "id": 1,
            "email": credentials.get("email", "demo@example.com"),
            "full_name": "Demo User",
            "role": "standard",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z",
            "timezone": "America/New_York",
            "language": "en",
            "theme": "light"
        }
    }

# Mock auth me endpoint
@app.get("/api/auth/me")
async def get_current_user():
    return {
        "id": 1,
        "email": "demo@example.com",
        "full_name": "Demo User",
        "role": "standard",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z",
        "timezone": "America/New_York",
        "language": "en",
        "theme": "light"
    }

# Mock documents endpoint
@app.get("/api/documents")
async def get_documents():
    return {
        "documents": [
            {
                "id": 1,
                "filename": "sample-contract.pdf",
                "original_filename": "sample-contract.pdf",
                "file_size": 245760,
                "content_type": "application/pdf",
                "user_id": 1,
                "processing_status": "ready",
                "document_type": "contract",
                "page_count": 5,
                "word_count": 1250,
                "has_ocr": False,
                "chunk_count": 10,
                "is_confidential": False,
                "created_at": "2024-01-01T00:00:00Z",
                "access_count": 3,
                "legal_hold": False,
                "title": "Sample Legal Contract"
            }
        ],
        "total": 1,
        "page": 1,
        "per_page": 20,
        "has_next": False,
        "has_prev": False
    }

# Mock chat sessions endpoint
@app.get("/api/chat/sessions")
async def get_chat_sessions():
    return [
        {
            "id": 1,
            "title": "Contract Analysis Chat",
            "session_type": "document",
            "user_id": 1,
            "document_id": 1,
            "is_active": True,
            "message_count": 3,
            "created_at": "2024-01-01T00:00:00Z",
            "last_message_at": "2024-01-01T01:00:00Z",
            "total_tokens_used": 500,
            "estimated_cost": 0.01,
            "temperature": 0.7,
            "max_tokens": 2000
        }
    ]
