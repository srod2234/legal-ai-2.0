#!/bin/bash

# Legal AI Application - Quick Start (No ChromaDB)
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

cat << EOF
${BLUE}
╔══════════════════════════════════════════════╗
║       Legal AI Application - Quick Demo     ║
║           (Simplified Version)              ║
╚══════════════════════════════════════════════╝
${NC}

EOF

log "Starting simplified Legal AI demo..."

# Stop any existing services
log "Stopping existing services..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Kill existing backend/frontend processes
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Start simple database services
log "Starting database services..."
docker-compose -f docker-compose.simple.yml up -d

# Wait for databases
log "Waiting for databases..."
sleep 10

# Setup environment
if [[ ! -f ".env" ]]; then
    cp .env.dev .env
    success "Environment file created."
fi

# Create necessary directories
mkdir -p backend/uploads backend/logs backend/temp frontend/.next

cd backend

# Check Python and create venv
if ! command -v python3 &> /dev/null; then
    error "Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi

if [[ ! -d "venv" ]]; then
    log "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Install dependencies
source venv/bin/activate
pip install --upgrade pip

# Install minimal dependencies without ChromaDB
log "Installing backend dependencies..."
pip install fastapi uvicorn sqlmodel psycopg2-binary redis python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv

# Create a simple main.py without ChromaDB dependencies
cat > app/main_simple.py << 'EOPY'
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
EOPY

# Start backend with simple version
log "Starting backend server..."
uvicorn app.main_simple:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ../frontend

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Install frontend dependencies
if [[ ! -d "node_modules" ]]; then
    log "Installing frontend dependencies..."
    npm install
fi

# Start frontend
log "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait for services to start
log "Waiting for services to start..."
sleep 15

# Check if services are running
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    success "Backend is running!"
else
    warning "Backend may not be ready yet..."
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    success "Frontend is running!"
else
    warning "Frontend may not be ready yet..."
fi

cat << EOF

${GREEN}🎉 Legal AI Demo is Ready! 🎉${NC}

${BLUE}Access the application:${NC}
🌐 Frontend: http://localhost:3000
🔧 Backend API: http://localhost:8000
📚 API Docs: http://localhost:8000/docs

${BLUE}Demo Features Available:${NC}
✅ Mock Authentication (any email/password works)
✅ Basic UI Navigation
✅ Mock Document List
✅ Mock Chat Sessions
✅ Responsive Design

${YELLOW}Note: This is a simplified demo without:${NC}
- ChromaDB vector database
- Real document processing
- AI chat responses
- File uploads

${BLUE}To stop the demo:${NC}
- Press Ctrl+C
- Or run: pkill -f uvicorn && pkill -f "npm run dev" && docker-compose -f docker-compose.simple.yml down

${GREEN}Enjoy exploring the Legal AI interface! 🚀${NC}

EOF

# Keep running and wait for interrupt
trap 'log "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose -f docker-compose.simple.yml down; exit 0' INT

wait