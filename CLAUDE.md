# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting the Application
```bash
./start-dev.sh          # Full development environment (preferred)
./stop-dev.sh           # Stop all development services
```

### Backend Development
```bash
cd backend
source venv/bin/activate  # Always activate the virtual environment
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # Start backend only
```

### Frontend Development
```bash
cd frontend
npm run dev             # Start Vite development server
npm run build           # Build for production
npm run lint            # ESLint checks
npm run preview         # Preview production build
```

### Backend Testing & Quality
```bash
cd backend
source venv/bin/activate
pytest                  # Run all tests
pytest tests/test_specific.py  # Run specific test file
ruff check .           # Linting
black .                # Code formatting
mypy .                 # Type checking
```

### Database Operations
```bash
# Database is automatically started via docker-compose.dev.yml
# Access PostgreSQL: localhost:5432 (user: legal_ai_user, password: dev_password)
# ChromaDB: localhost:8001
# Redis: localhost:6379
```

## Architecture Overview

### Full-Stack Legal AI Application
This is a comprehensive legal AI application with the following key components:

**Backend (FastAPI + Python)**
- FastAPI web framework with async support
- SQLModel/SQLAlchemy for database ORM
- JWT authentication with secure token handling
- ChromaDB for vector storage and embeddings
- Document processing pipeline (PDF, DOCX, TXT)
- WebSocket support for real-time chat
- Structured around domain models: User, Document, Chat, Admin

**Frontend (Vite + React)**
- Vite with React 18 and TypeScript
- React Query for server state management
- React Router DOM for navigation
- Tailwind CSS with shadcn/ui components
- React Hook Form with Zod validation
- Real-time chat interface with WebSocket
- Secure authentication with HTTP-only cookies

**Infrastructure**
- Docker Compose for development services
- PostgreSQL for primary data storage
- ChromaDB for vector embeddings
- Redis for caching/sessions
- Nginx for production reverse proxy

### Key Backend Modules

**Core (`backend/app/core/`)**
- `config.py` - Pydantic settings and environment configuration
- `database.py` - SQLModel database connection and session management
- `security.py` - JWT token generation, password hashing, authentication

**Models (`backend/app/models/`)**
- `user.py` - User authentication and profile models
- `chat.py` - Chat sessions, messages, and AI responses
- `admin.py` - Administrative functions and monitoring
- SQLModel-based with relationships and validation

**API Routes (`backend/app/api/`)**
- RESTful endpoints following FastAPI conventions
- JWT middleware for protected routes
- Request/response models with Pydantic validation
- WebSocket endpoints for real-time features

### Key Frontend Structure

**App Structure (`frontend/src/`)**
- Vite + React Router DOM structure
- Component-based architecture with TypeScript
- Route-based authentication guards

**Components (`frontend/src/components/`)**
- Reusable UI components with TypeScript props
- Authentication forms and guards
- Chat interface components
- Document upload and management
- Admin dashboard components

**Hooks (`frontend/src/hooks/`)**
- Custom React hooks for API integration
- Authentication, documents, and chat hooks
- React Query for server state and caching

**Services (`frontend/src/services/`)**
- API service layer for backend communication
- TypeScript interfaces for API contracts
- WebSocket management for real-time features

## Project-Specific Conventions

### Backend Development Patterns
- **Always use the `venv` virtual environment** when running Python commands
- **Follow SQLModel patterns** for database models with proper relationships
- **Use FastAPI dependency injection** for database sessions and authentication
- **JWT tokens are handled via HTTP-only cookies** - never localStorage
- **Document processing pipeline** uses ChromaDB for embeddings storage
- **WebSocket connections** require JWT authentication before upgrading

### Frontend Development Patterns
- **Use React Query** for all server state management and API calls
- **Custom hooks** for complex state logic (useAuth, useDocuments, useChat)
- **Tailwind CSS + shadcn/ui** for all styling - avoid custom CSS files
- **React Hook Form + Zod** for all form validation
- **TypeScript strict mode** - all components must be properly typed
- **React Router DOM** - component-based routing with protected routes

### File Organization Rules
- **Backend**: Keep files under 500 lines, split by domain (user, chat, document, admin)
- **Frontend**: Organize by feature/domain (pages, components, hooks, services)
- **API Integration**: Use TypeScript interfaces matching backend models
- **Environment**: Configuration via `.env.development` for Vite

### Authentication & Security
- **JWT tokens** stored in secure HTTP-only cookies with proper expiration
- **IP allowlisting** configurable via environment variables
- **File uploads** must be validated and virus-scanned before processing
- **Database credentials** stored in environment variables only
- **API keys** (OpenAI, Anthropic) configured via environment

### AI Integration Patterns
- **ChromaDB** for document embeddings and similarity search
- **LlamaIndex** for RAG pipeline and document chunking
- **Streaming responses** via WebSocket for real-time chat experience
- **Source attribution** with confidence scores and page references
- **Context separation** between general chat and document-specific queries

### Development Environment
- **Docker Compose** manages all services (PostgreSQL, ChromaDB, Redis)
- **Hot reload** enabled for both frontend and backend
- **Environment variables** use `.env.dev` for development defaults
- **Database migrations** run automatically via SQLModel metadata
- **API documentation** available at http://localhost:8000/docs

### Error Handling
- **Backend**: Use FastAPI HTTPException with proper status codes
- **Frontend**: React Query error boundaries and toast notifications
- **Validation**: Pydantic (backend) and Zod (frontend) for data validation
- **Logging**: Structured logging with proper levels and context

## Important Constraints

### Development Workflow
1. **Always start with `./start-dev.sh`** to ensure all services are running
2. **Use the virtual environment** for all Python operations
3. **Run type checking** before committing (both `tsc --noEmit` and `mypy`)
4. **Test both authentication flows** when modifying auth-related code
5. **Verify WebSocket functionality** when changing real-time features

### Testing Requirements
- **Backend**: Pytest with async support, database fixtures, auth mocking
- **Frontend**: Jest with React Testing Library, WebSocket mocking
- **Integration**: Test authentication flows end-to-end
- **Document processing**: Test with various file formats and edge cases

### Performance Considerations
- **Frontend**: Use React.memo for chat components to prevent re-renders
- **Backend**: Async/await for all database operations and file processing
- **WebSocket**: Proper connection cleanup and reconnection logic
- **Database**: Use proper indexes for chat history and document searches
- **Vector search**: Optimize ChromaDB queries for document similarity

### Security Requirements
- **File uploads**: Validate file types, scan for malware, limit sizes
- **Authentication**: Secure token storage, proper session management
- **API endpoints**: Rate limiting, input validation, SQL injection prevention
- **Environment**: Never commit secrets, use proper environment separation
- **CORS**: Configure properly for development and production environments