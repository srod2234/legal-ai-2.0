name: "Legal AI Application - Complete Private Legal AI System"
description: |

## Goal
Build a fully private, in-house AI system for a mid-sized law firm, powered by LLaMA 3 70B and hosted on dual A100 GPUs via CoreWeave. The system will use ChromaDB and LlamaIndex to enable real-time Q&A and document summarization over legal files, all without exposing any data to third-party APIs. The system will be automated using n8n to handle everything from document ingestion and processing to Slack/email routing and compliance logging. Staff will interact with the AI through a secure, JWT-authenticated React UI that allows them to ask questions, upload files, chat, and receive instant summaries—all within a legally compliant, cost-effective, and scalable setup.

## Why
- **Data Privacy**: Complete control over legal documents and client information without third-party exposure
- **Cost Efficiency**: Reduce dozens of hours per week of manual document review and research
- **Compliance**: Built-in audit logging and security controls for legal industry requirements
- **Professional Efficiency**: Real-time AI assistance for legal research, document summarization, and Q&A
- **Scalability**: Enterprise-grade infrastructure that grows with the firm

## What
A complete legal AI platform consisting of:

### Core Components
1. **Secure Authentication System** - JWT-based with role-based access control
2. **Real-Time AI Chat Interface** - WebSocket-powered chat with document context awareness
3. **Document Upload & Processing** - OCR, vectorization, and ChromaDB storage
4. **Document-Aware Chat** - AI answers questions using uploaded legal documents with source attribution
5. **Chat History & Session Management** - Persistent chat sessions with export capabilities
6. **Document Library** - Grid/list view with search, filtering, and management
7. **User Roles & Permissions** - Standard users and admin users with appropriate access levels
8. **Admin Dashboard** - Analytics, user management, audit logging, and system monitoring

### Success Criteria
- [ ] Secure user authentication and authorization system functional
- [ ] Users can upload legal documents (PDF, DOCX, TXT) with OCR support
- [ ] Documents are processed and vectorized into ChromaDB for retrieval
- [ ] AI chat interface provides real-time responses with source attribution
- [ ] Chat sessions are persistent and exportable
- [ ] Document library allows full CRUD operations with search/filtering
- [ ] Admin dashboard provides user management and system analytics
- [ ] All operations are logged for compliance and audit purposes
- [ ] System is responsive and works on desktop and mobile devices
- [ ] Performance targets: <2s document upload processing, <500ms chat response time

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://nextjs.org/docs/app
  why: Modern React framework with App Router for SSR and client-side routing
  
- url: https://tanstack.com/query/v5/docs/framework/react/overview
  why: Server state management, caching, and API integration patterns
  
- url: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
  why: JWT authentication patterns and OAuth2 implementation in FastAPI
  critical: Proper token validation and refresh mechanisms for security
  
- url: https://docs.trychroma.com/getting-started
  why: Vector database setup, document embedding, and similarity search
  section: Python client API and collection management
  
- url: https://tailwindcss.com/docs/installation/framework-guides
  why: CSS framework integration with React components
  
- url: https://medium.com/@ancilartech/bulletproof-jwt-authentication-in-fastapi-a-complete-guide-2c5602a38b4f
  why: Complete JWT implementation patterns for FastAPI + React integration
  critical: httpOnly cookie handling and CORS configuration

- file: use-cases/agent-factory-with-subagents/agents/rag_agent/settings.py
  why: Pydantic settings pattern with environment variable management
  
- file: use-cases/agent-factory-with-subagents/agents/rag_agent/tools.py
  why: Database integration patterns and async operations
  
- docfile: CLAUDE.md
  why: Project coding standards, testing requirements, and file structure conventions
```

### Current Codebase Tree
```bash
Legal Ai App 2.0/
├── CLAUDE.md                    # Project standards and conventions
├── INITIAL.md                   # Feature specification
├── README.md                    # Project documentation
├── PRPs/                        # Project Requirements and Patterns
│   ├── templates/
│   │   └── prp_base.md         # PRP template
│   └── legal-ai-application.md  # This PRP
├── use-cases/                   # Reference patterns and examples
│   ├── agent-factory-with-subagents/
│   │   └── agents/rag_agent/    # RAG implementation patterns
│   └── mcp-server/             # TypeScript/Node.js patterns
└── examples/                    # Currently empty, will contain backend examples
```

### Desired Codebase Tree
```bash
Legal Ai App 2.0/
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── core/               # Core configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py       # Settings and environment variables
│   │   │   ├── security.py     # JWT token handling
│   │   │   └── database.py     # Database configuration
│   │   ├── api/                # API routes
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── documents.py    # Document management endpoints
│   │   │   ├── chat.py         # Chat endpoints and WebSocket handlers
│   │   │   ├── users.py        # User management endpoints
│   │   │   └── admin.py        # Admin dashboard endpoints
│   │   ├── models/             # SQLModel database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py         # User and authentication models
│   │   │   ├── document.py     # Document models
│   │   │   ├── chat.py         # Chat and message models
│   │   │   └── admin.py        # Admin and audit models
│   │   ├── services/           # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py # Authentication business logic
│   │   │   ├── document_service.py # Document processing
│   │   │   ├── vector_service.py   # ChromaDB integration
│   │   │   ├── chat_service.py     # AI chat logic
│   │   │   └── llm_service.py      # LLM integration
│   │   └── utils/              # Utility functions
│   │       ├── __init__.py
│   │       ├── ocr.py          # OCR processing utilities
│   │       ├── embeddings.py   # Text embedding utilities
│   │       └── validators.py   # Input validation utilities
│   ├── tests/                  # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_documents.py
│   │   ├── test_chat.py
│   │   └── test_admin.py
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment template
│   └── README.md              # Backend documentation
├── frontend/                   # Next.js React frontend
│   ├── src/
│   │   ├── app/                # Next.js 15 App Router
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── login/
│   │   │   │   └── page.tsx    # Login page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx    # Main dashboard
│   │   │   ├── documents/
│   │   │   │   └── page.tsx    # Document library
│   │   │   ├── chat/
│   │   │   │   └── page.tsx    # Chat interface
│   │   │   └── admin/
│   │   │       └── page.tsx    # Admin dashboard
│   │   ├── components/         # Reusable React components
│   │   │   ├── ui/             # Base UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── auth/           # Authentication components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── documents/      # Document-related components
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   └── DocumentCard.tsx
│   │   │   ├── chat/           # Chat interface components
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── SourceAttribution.tsx
│   │   │   └── admin/          # Admin interface components
│   │   │       ├── UserManagement.tsx
│   │   │       ├── Analytics.tsx
│   │   │       └── AuditLog.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAuth.ts      # Authentication hook
│   │   │   ├── useChat.ts      # Chat functionality hook
│   │   │   ├── useDocuments.ts # Document management hook
│   │   │   └── useWebSocket.ts # WebSocket connection hook
│   │   ├── lib/                # Utility libraries
│   │   │   ├── api.ts          # API client configuration
│   │   │   ├── auth.ts         # Authentication utilities
│   │   │   ├── websocket.ts    # WebSocket utilities
│   │   │   └── utils.ts        # General utilities
│   │   ├── types/              # TypeScript type definitions
│   │   │   ├── auth.ts         # Authentication types
│   │   │   ├── document.ts     # Document types
│   │   │   ├── chat.ts         # Chat types
│   │   │   └── api.ts          # API response types
│   │   └── stores/             # State management
│   │       ├── authStore.ts    # Authentication state
│   │       ├── chatStore.ts    # Chat state
│   │       └── documentStore.ts # Document state
│   ├── public/                 # Static assets
│   │   ├── images/
│   │   └── icons/
│   ├── package.json           # Node.js dependencies
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── next.config.js         # Next.js configuration
│   ├── tsconfig.json          # TypeScript configuration
│   └── .env.local.example     # Environment template
├── docker/                    # Docker configuration
│   ├── Dockerfile.backend     # Backend container
│   ├── Dockerfile.frontend    # Frontend container
│   └── docker-compose.yml     # Development environment
└── docs/                      # Project documentation
    ├── API.md                 # API documentation
    ├── DEPLOYMENT.md          # Deployment guide
    └── ARCHITECTURE.md        # System architecture
```

### Known Gotchas & Library Quirks
```python
# CRITICAL: Next.js 15 App Router requires React 19 RC
# Cannot use React 18 with App Router - use Pages Router for React 18 compatibility
# Recommendation: Use Next.js 15 with React 19 RC for this project

# CRITICAL: TanStack Query v5 requires React 18+
# Use useSuspenseQuery for data fetching in App Router components
# Status renamed: isLoading -> isPending in v5

# CRITICAL: JWT Security
# NEVER store JWT tokens in localStorage/sessionStorage
# Use httpOnly cookies for token storage
# Implement proper CORS configuration for cookie handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# CRITICAL: ChromaDB Collection Management
# Collections cannot be renamed - must delete and recreate
# Embedding dimensions must match across all documents in collection
# Use consistent metadata schema for filtering capabilities

# CRITICAL: FastAPI + ChromaDB Async Patterns
# ChromaDB Python client is sync - wrap in asyncio.run_in_executor
async def vector_search(query: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, 
        lambda: collection.query(query_texts=[query])
    )

# CRITICAL: File Upload Security
# Validate file types on both client and server
# Implement virus scanning before processing
# Limit file sizes to prevent DoS attacks
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# CRITICAL: OCR Processing
# Tesseract OCR requires system installation
# Fallback gracefully when OCR fails
# Show processing status to users for large documents

# CRITICAL: WebSocket Authentication
# Validate JWT tokens in WebSocket connections
# Handle connection drops and reconnection
# Implement rate limiting for chat messages
```

## Implementation Blueprint

### Data Models and Structure

Create the core data models to ensure type safety and consistency across backend and frontend:

```python
# Backend Models (SQLModel)
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: UserRole = Field(default=UserRole.STANDARD)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    file_path: str
    file_size: int
    content_type: str
    user_id: int = Field(foreign_key="user.id")
    processing_status: ProcessingStatus = Field(default=ProcessingStatus.UPLOADING)
    chroma_collection_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    document_id: Optional[int] = Field(foreign_key="document.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Pydantic Schemas for API
class DocumentUploadResponse(BaseModel):
    document_id: int
    filename: str
    processing_status: ProcessingStatus
    
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    sources: List[DocumentSource] = []
    confidence_score: Optional[float] = None
    timestamp: datetime
```

### List of Tasks to be Completed

```yaml
Task 1: Backend Foundation Setup
MODIFY backend/app/core/config.py:
  - CREATE settings class using pydantic-settings
  - IMPLEMENT environment variable validation
  - ADD security configuration (JWT secrets, CORS origins)
  - INCLUDE database and ChromaDB connection strings

CREATE backend/app/core/database.py:
  - IMPLEMENT SQLModel database setup with SQLite/PostgreSQL
  - ADD database session dependency
  - CREATE database migration utilities

CREATE backend/app/core/security.py:
  - IMPLEMENT JWT token creation and validation
  - ADD password hashing utilities using bcrypt
  - CREATE authentication dependencies for FastAPI

Task 2: User Authentication System
CREATE backend/app/models/user.py:
  - IMPLEMENT User and UserRole models using SQLModel
  - ADD user creation and authentication schemas
  - INCLUDE audit fields (created_at, updated_at)

CREATE backend/app/api/auth.py:
  - IMPLEMENT login/logout endpoints with JWT tokens
  - ADD user registration and profile management
  - CREATE password reset functionality
  - IMPLEMENT refresh token logic

CREATE backend/app/services/auth_service.py:
  - ADD business logic for user authentication
  - IMPLEMENT user validation and password verification
  - CREATE token refresh and revocation logic

Task 3: Document Management Backend
CREATE backend/app/models/document.py:
  - IMPLEMENT Document model with file metadata
  - ADD processing status tracking
  - INCLUDE relationship to User model

CREATE backend/app/services/document_service.py:
  - IMPLEMENT file upload validation and storage
  - ADD OCR processing for scanned PDFs
  - CREATE text extraction from various formats

CREATE backend/app/services/vector_service.py:
  - IMPLEMENT ChromaDB integration
  - ADD document embedding and storage
  - CREATE similarity search functionality

CREATE backend/app/api/documents.py:
  - ADD document upload endpoints
  - IMPLEMENT document listing and filtering
  - CREATE document deletion and management

Task 4: AI Chat System Backend
CREATE backend/app/models/chat.py:
  - IMPLEMENT ChatSession and ChatMessage models
  - ADD relationship to Document and User models
  - INCLUDE message history and metadata

CREATE backend/app/services/chat_service.py:
  - IMPLEMENT AI chat logic with document context
  - ADD source attribution and confidence scoring
  - CREATE streaming response handling

CREATE backend/app/services/llm_service.py:
  - IMPLEMENT LLaMA 3 70B integration via API
  - ADD context window management
  - CREATE response formatting and validation

CREATE backend/app/api/chat.py:
  - ADD chat endpoints for session management
  - IMPLEMENT WebSocket handler for real-time chat
  - CREATE chat history and export functionality

Task 5: Admin Dashboard Backend
CREATE backend/app/models/admin.py:
  - IMPLEMENT AuditLog model for compliance tracking
  - ADD system analytics and usage models
  - INCLUDE user activity tracking

CREATE backend/app/api/admin.py:
  - ADD user management endpoints for admins
  - IMPLEMENT system analytics and reporting
  - CREATE audit log viewing and export

CREATE backend/app/api/users.py:
  - IMPLEMENT user profile management
  - ADD user activity tracking
  - CREATE user deactivation and role management

Task 6: Frontend Foundation Setup
CREATE frontend/src/lib/api.ts:
  - IMPLEMENT TanStack Query configuration
  - ADD axios/fetch API client setup
  - CREATE error handling and retry logic

CREATE frontend/src/types/:
  - MIRROR backend Pydantic models in TypeScript
  - ADD API response type definitions
  - INCLUDE form validation schemas using Zod

CREATE frontend/src/stores/:
  - IMPLEMENT Zustand stores for state management
  - ADD authentication state management
  - CREATE document and chat state stores

Task 7: Authentication Frontend
CREATE frontend/src/components/auth/LoginForm.tsx:
  - IMPLEMENT login form with React Hook Form
  - ADD client-side validation with Zod
  - CREATE loading states and error handling

CREATE frontend/src/components/auth/ProtectedRoute.tsx:
  - IMPLEMENT route protection based on authentication
  - ADD role-based access control
  - CREATE redirect logic for unauthorized users

CREATE frontend/src/hooks/useAuth.ts:
  - IMPLEMENT authentication hook with TanStack Query
  - ADD automatic token refresh logic
  - CREATE logout and session management

Task 8: Document Management Frontend
CREATE frontend/src/components/documents/DocumentUpload.tsx:
  - IMPLEMENT drag-and-drop file upload with progress
  - ADD file type validation and size limits
  - CREATE upload status visualization

CREATE frontend/src/components/documents/DocumentList.tsx:
  - IMPLEMENT document grid and list views
  - ADD search, filtering, and sorting functionality
  - CREATE document actions (view, delete, rename)

CREATE frontend/src/hooks/useDocuments.ts:
  - IMPLEMENT document management with TanStack Query
  - ADD optimistic updates for UI responsiveness
  - CREATE document processing status polling

Task 9: Chat Interface Frontend
CREATE frontend/src/components/chat/ChatInterface.tsx:
  - IMPLEMENT real-time chat with WebSocket
  - ADD message streaming and typing indicators
  - CREATE source attribution display

CREATE frontend/src/components/chat/MessageBubble.tsx:
  - IMPLEMENT message rendering with confidence scores
  - ADD expandable source references
  - CREATE message actions (copy, bookmark, export)

CREATE frontend/src/hooks/useChat.ts:
  - IMPLEMENT chat functionality with WebSocket
  - ADD message history management
  - CREATE chat session persistence

CREATE frontend/src/hooks/useWebSocket.ts:
  - IMPLEMENT WebSocket connection management
  - ADD reconnection logic and error handling
  - CREATE authentication for WebSocket connections

Task 10: Admin Dashboard Frontend
CREATE frontend/src/components/admin/UserManagement.tsx:
  - IMPLEMENT user listing and management interface
  - ADD user creation and role assignment
  - CREATE user activity monitoring

CREATE frontend/src/components/admin/Analytics.tsx:
  - IMPLEMENT system usage analytics dashboard
  - ADD charts for document processing and chat usage
  - CREATE export functionality for reports

CREATE frontend/src/app/admin/page.tsx:
  - IMPLEMENT admin dashboard layout
  - ADD navigation for admin functions
  - CREATE role-based component rendering

Task 11: UI/UX Polish and Responsive Design
CREATE frontend/src/components/ui/:
  - IMPLEMENT base UI components with Tailwind
  - ADD dark/light mode toggle
  - CREATE consistent loading and error states

MODIFY all frontend components:
  - ADD responsive design for mobile devices
  - IMPLEMENT proper accessibility (ARIA labels, keyboard nav)
  - CREATE smooth animations with Framer Motion

Task 12: Testing and Quality Assurance
CREATE backend/tests/:
  - IMPLEMENT unit tests for all services and endpoints
  - ADD integration tests for API workflows
  - CREATE authentication and authorization tests

CREATE frontend/tests/ (if required):
  - IMPLEMENT component testing with React Testing Library
  - ADD end-to-end tests for critical user flows
  - CREATE accessibility tests

Task 13: Production Configuration
CREATE docker/:
  - IMPLEMENT Docker containers for backend and frontend
  - ADD docker-compose for development environment
  - CREATE production deployment configuration

CREATE deployment documentation:
  - ADD environment setup instructions
  - IMPLEMENT security hardening guidelines
  - CREATE monitoring and logging configuration
```

### Integration Points
```yaml
DATABASE:
  - migration: "Create users, documents, chat_sessions, chat_messages, audit_logs tables"
  - indexes: "CREATE INDEX ON documents(user_id, processing_status)"
  - indexes: "CREATE INDEX ON chat_messages(session_id, created_at)"
  
CONFIG:
  - add to: backend/app/core/config.py
  - pattern: "JWT_SECRET_KEY = str(os.getenv('JWT_SECRET_KEY'))"
  - pattern: "CHROMA_HOST = str(os.getenv('CHROMA_HOST', 'localhost'))"
  
ROUTES:
  - add to: backend/app/main.py
  - pattern: "app.include_router(auth_router, prefix='/api/auth', tags=['auth'])"
  - pattern: "app.include_router(documents_router, prefix='/api/documents', tags=['documents'])"
  
FRONTEND_CONFIG:
  - add to: frontend/next.config.js
  - pattern: "env: { API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL }"
  
WEBSOCKET:
  - add to: backend/app/main.py
  - pattern: "app.websocket_route('/ws/chat')(websocket_endpoint)"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Backend validation
cd backend
uv run ruff check app/ --fix
uv run mypy app/
uv run black app/

# Frontend validation  
cd frontend
npm run lint
npm run type-check
npm run format

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```python
# Backend tests - CREATE test files with these patterns:
def test_user_authentication():
    """Test JWT token creation and validation"""
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_document_upload():
    """Test document upload and processing"""
    with open("test_document.pdf", "rb") as f:
        response = authenticated_client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", f, "application/pdf")}
        )
    assert response.status_code == 201
    assert response.json()["processing_status"] == "uploading"

def test_chat_with_document():
    """Test AI chat with document context"""
    response = authenticated_client.post(
        "/api/chat/sessions/1/messages",
        json={"content": "What is the main topic of this document?"}
    )
    assert response.status_code == 200
    assert response.json()["sources"] != []
    assert response.json()["confidence_score"] > 0.5
```

```bash
# Run backend tests
cd backend
uv run pytest tests/ -v --cov=app --cov-report=html

# Run frontend tests (if implemented)
cd frontend  
npm test
npm run test:e2e

# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start the services
cd backend && uv run uvicorn app.main:app --reload &
cd frontend && npm run dev &

# Test authentication flow
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Test document upload
curl -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@test_document.pdf"

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat/sessions/1/messages \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Summarize this document"}'

# Expected: All endpoints return successful responses with proper data
# If error: Check logs at backend/logs/ for stack trace
```

### Level 4: Frontend Integration Test
```bash
# Test frontend application
open http://localhost:3000

# Manual testing checklist:
# 1. Login page loads and authentication works
# 2. Document upload shows progress and completes successfully  
# 3. Chat interface connects via WebSocket and responds
# 4. Document library shows uploaded files with proper status
# 5. Admin dashboard accessible to admin users only
# 6. Responsive design works on mobile viewport
# 7. All error states display properly
```

## Final Validation Checklist
- [ ] All backend tests pass: `uv run pytest tests/ -v`
- [ ] No linting errors: `uv run ruff check app/`
- [ ] No type errors: `uv run mypy app/`
- [ ] Frontend builds successfully: `npm run build`
- [ ] Authentication flow works end-to-end
- [ ] Document upload and processing completes
- [ ] AI chat provides responses with sources
- [ ] WebSocket connections establish and maintain
- [ ] Admin dashboard shows proper analytics
- [ ] Error cases handled gracefully
- [ ] Logs are informative but not verbose
- [ ] All environment variables documented in .env.example
- [ ] Docker containers build and run successfully
- [ ] Security audit passes (no hardcoded secrets)
- [ ] Performance targets met (<2s upload, <500ms chat response)

---

## Anti-Patterns to Avoid
- ❌ Don't store JWT tokens in localStorage - use httpOnly cookies
- ❌ Don't skip file validation on server - validate both client and server
- ❌ Don't ignore OCR failures - provide fallback handling
- ❌ Don't hardcode LLM endpoints - use environment configuration
- ❌ Don't skip authentication on WebSocket - validate tokens
- ❌ Don't create large monolithic components - keep components focused
- ❌ Don't ignore error boundaries - implement proper error handling
- ❌ Don't skip responsive design - ensure mobile compatibility
- ❌ Don't ignore accessibility - implement ARIA labels and keyboard navigation
- ❌ Don't commit secrets or API keys - use environment variables only

---

## PRP Confidence Score: 9/10

This PRP provides comprehensive context including:
✅ Complete external documentation links with specific sections
✅ Detailed file structure and implementation patterns
✅ Critical gotchas and security considerations from research
✅ Step-by-step implementation tasks with clear dependencies
✅ Executable validation gates for quality assurance
✅ Real code examples from existing codebase patterns
✅ Performance targets and success criteria
✅ Anti-patterns to prevent common mistakes

The high confidence score reflects the thorough research conducted, integration of current best practices for 2025, and detailed implementation blueprint that should enable one-pass implementation success.