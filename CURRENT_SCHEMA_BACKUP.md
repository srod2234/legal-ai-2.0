# CURRENT DATABASE SCHEMA BACKUP
## Legal AI App - Original Schema (Pre-LEGAL 3.0)

**Date**: 2025-09-30
**Branch**: main (before feature/legal-3.0-enterprise)
**Purpose**: Backup documentation of original schema before LEGAL 3.0 modifications

---

## EXISTING TABLES

### 1. User Table
**File**: `backend/app/models/user.py`

```sql
CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'standard',  -- 'standard' or 'admin'
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,

    -- Profile information
    phone VARCHAR(20),
    department VARCHAR(100),
    job_title VARCHAR(100),

    -- Security settings
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,

    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light'
);

CREATE INDEX idx_user_email ON user(email);
```

**Enums**:
- `UserRole`: STANDARD, ADMIN

---

### 2. Document Table
**File**: `backend/app/models/document.py`

```sql
CREATE TABLE document (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,

    -- User relationship
    user_id INTEGER REFERENCES user(id),

    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'uploading',
    processing_error VARCHAR(1000),
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,

    -- Content extraction
    extracted_text TEXT,
    page_count INTEGER,
    word_count INTEGER,
    language VARCHAR(10),

    -- Document classification
    document_type VARCHAR(50),
    confidence_score FLOAT,

    -- Vector database
    chroma_collection_id VARCHAR(100),
    embedding_status VARCHAR(50),
    chunk_count INTEGER,

    -- OCR information
    has_ocr BOOLEAN DEFAULT FALSE,
    ocr_confidence FLOAT,
    ocr_language VARCHAR(10),

    -- Metadata
    title VARCHAR(500),
    description VARCHAR(1000),
    tags VARCHAR(500),  -- JSON string

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_accessed TIMESTAMP,
    access_count INTEGER DEFAULT 0,

    -- Security and compliance
    is_confidential BOOLEAN DEFAULT TRUE,
    retention_date TIMESTAMP,
    legal_hold BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_document_filename ON document(filename);
CREATE INDEX idx_document_user_id ON document(user_id);
CREATE INDEX idx_document_file_hash ON document(file_hash);
CREATE INDEX idx_document_status ON document(processing_status);
CREATE INDEX idx_document_created ON document(created_at);
```

**Enums**:
- `ProcessingStatus`: UPLOADING, UPLOADED, PROCESSING, OCR_PROCESSING, EMBEDDING, READY, FAILED, DELETED
- `DocumentType`: CONTRACT, LEGAL_BRIEF, COURT_FILING, MEMO, RESEARCH, OTHER

---

## EXISTING API ENDPOINTS

### Authentication (`/api/auth`)
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- POST `/api/auth/refresh` - Refresh access token
- GET `/api/auth/me` - Get current user info

### Documents (`/api/documents`)
- GET `/api/documents` - List user's documents
- POST `/api/documents/upload` - Upload new document
- GET `/api/documents/{id}` - Get document details
- PUT `/api/documents/{id}` - Update document metadata
- DELETE `/api/documents/{id}` - Delete document
- GET `/api/documents/{id}/download` - Download document
- GET `/api/documents/{id}/status` - Get processing status

### Chat (`/api/chat`)
- POST `/api/chat/message` - Send chat message
- GET `/api/chat/history` - Get chat history
- DELETE `/api/chat/history` - Clear chat history
- WebSocket `/ws/chat` - Real-time chat connection

### Admin (`/api/admin`)
- GET `/api/admin/users` - List all users
- POST `/api/admin/users` - Create new user
- PUT `/api/admin/users/{id}` - Update user
- DELETE `/api/admin/users/{id}` - Delete user
- GET `/api/admin/stats` - System statistics
- GET `/api/admin/documents` - All documents (admin view)
- GET `/api/admin/logs` - System logs

---

## EXISTING SERVICES

### Core Services
1. **Authentication Service** (`backend/app/core/security.py`)
   - JWT token generation and validation
   - Password hashing (bcrypt)
   - User authentication

2. **Database Service** (`backend/app/core/database.py`)
   - SQLModel database connection
   - Session management

3. **Configuration** (`backend/app/core/config.py`)
   - Environment-based settings
   - Pydantic Settings management

### Application Services
1. **Document Processing Service** (if exists in `backend/app/services/`)
   - File upload handling
   - OCR processing
   - Text extraction
   - Vector embedding (ChromaDB)
   - Document classification

2. **Chat Service** (if exists)
   - Message handling
   - Context retrieval
   - AI response generation
   - WebSocket management

---

## CURRENT TECHNOLOGY STACK

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLModel
- **Authentication**: JWT (HTTP-only cookies)
- **Vector DB**: ChromaDB
- **Caching**: Redis
- **AI**: OpenAI API / Anthropic Claude

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation

### Infrastructure
- **Container**: Docker & Docker Compose
- **Development**: docker-compose.dev.yml
- **Services**: PostgreSQL, ChromaDB, Redis

---

## CURRENT DIRECTORY STRUCTURE

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── documents.py
│   │   ├── chat.py
│   │   └── admin.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── document.py
│   ├── services/
│   │   └── __init__.py
│   └── utils/
│       └── __init__.py
├── tests/
├── requirements.txt
└── venv/

frontend/
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── DocumentPicker.tsx
│   │   └── admin/ (admin components)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── useDocuments.ts
│   ├── pages/
│   │   ├── Index.tsx (Chat)
│   │   ├── Login.tsx
│   │   ├── Documents.tsx
│   │   ├── Admin.tsx
│   │   ├── Analytics.tsx
│   │   └── Profile.tsx
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── node_modules/
```

---

## NOTES FOR LEGAL 3.0 MIGRATION

### What Will Change
1. **User model**: Add `firm_id`, `role` (expanded), `permissions`
2. **Document model**: Add risk analysis fields, practice area classification
3. **New tables**: firms, contract_clauses, case_precedents, risk_assessments, etc.
4. **New services**: CaseLawService, RiskAnalysisService, PredictiveAnalyticsService
5. **New API endpoints**: /api/risk/*, /api/cases/*, /api/analytics/*, /api/firms/*
6. **New frontend pages**: Dashboard, ContractAnalysis, CaseResearch, PredictiveAnalytics

### What Will NOT Change
- Existing API endpoints remain functional
- Current authentication system (enhanced, not replaced)
- Document upload and processing flow (enhanced with additional analysis)
- Chat functionality (enhanced with case law context)
- Existing database tables (only extended, not modified)

### Migration Safety
- All changes are additive
- Existing functionality remains intact
- Rollback possible at any phase
- Backward compatibility maintained

---

**This backup serves as a reference point for the entire LEGAL 3.0 transformation.**
