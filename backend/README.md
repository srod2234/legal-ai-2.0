# Legal AI Application Backend

A FastAPI-based backend for the Legal AI Application that provides secure document management, AI-powered chat, and user authentication for law firms.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Document Management**: Secure upload, processing, and vectorization of legal documents
- **AI Chat System**: Real-time chat with document-aware AI responses
- **Admin Dashboard**: User management and system analytics
- **Audit Logging**: Comprehensive logging for legal compliance
- **Security**: Rate limiting, password policies, and secure token handling

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: SQLModel with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT with httpOnly cookies
- **Vector Database**: ChromaDB for document embeddings
- **Document Processing**: PyPDF2, python-docx, Tesseract OCR
- **AI Integration**: OpenAI/LLaMA 3 70B via CoreWeave

## Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv_legal_ai
source venv_legal_ai/bin/activate  # On Windows: venv_legal_ai\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - JWT_SECRET_KEY: Generate a secure secret key
# - LLM_API_KEY: Your OpenAI or CoreWeave API key
```

### 3. Database Setup

```bash
# Initialize database (creates tables and default admin user)
python -m app.core.database
```

### 4. Run Development Server

```bash
# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs (development only)
- **Health Check**: http://localhost:8000/health

## Default Credentials

A default admin user is created during database initialization:
- **Email**: admin@legal-ai.com
- **Password**: admin123

⚠️ **Change these credentials immediately in production!**

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset

### Documents (Coming Soon)

- `POST /api/documents/upload` - Upload document
- `GET /api/documents/` - List documents
- `GET /api/documents/{id}` - Get document details
- `DELETE /api/documents/{id}` - Delete document

### Chat (Coming Soon)

- `GET /api/chat/sessions` - List chat sessions
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/sessions/{id}/messages` - Send message
- `WebSocket /ws/chat` - Real-time chat

### Admin (Coming Soon)

- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/audit-logs` - Audit logs

## Configuration

Key environment variables:

```bash
# Security
JWT_SECRET_KEY=your-super-secret-jwt-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=sqlite:///./legal_ai.db

# LLM Configuration
LLM_PROVIDER=openai
LLM_API_KEY=your-api-key-here
LLM_MODEL=gpt-4
LLM_BASE_URL=https://api.openai.com/v1

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# File Upload
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_FILE_EXTENSIONS=[".pdf", ".docx", ".txt"]
```

## Development

### Code Quality

```bash
# Linting and formatting
ruff check app/ --fix
black app/
mypy app/

# Run tests
pytest tests/ -v --cov=app
```

### Database Operations

```bash
# Reset database (development only)
rm legal_ai.db
python -c "from app.core.database import init_db; init_db()"

# Backup database
python -c "from app.core.database import backup_database; backup_database()"
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **httpOnly Cookies**: Prevents XSS attacks on tokens
- **Rate Limiting**: Prevents brute force attacks
- **Password Policies**: Enforced strong passwords
- **Account Locking**: Automatic lockout after failed attempts
- **CORS Protection**: Configured for frontend origins only
- **Input Validation**: Comprehensive request validation

## Deployment

### Production Configuration

1. **Environment Variables**: Set all required production variables
2. **Database**: Use PostgreSQL instead of SQLite
3. **SSL/TLS**: Enable HTTPS and secure cookies
4. **Rate Limiting**: Configure appropriate limits
5. **Monitoring**: Set up logging and error tracking

### Docker Deployment

```bash
# Build container
docker build -t legal-ai-backend .

# Run container
docker run -p 8000:8000 --env-file .env legal-ai-backend
```

## Project Structure

```
backend/
├── app/
│   ├── core/           # Core configuration and utilities
│   │   ├── config.py   # Application settings
│   │   ├── database.py # Database configuration
│   │   └── security.py # Security utilities
│   ├── api/            # API route handlers
│   │   └── auth.py     # Authentication endpoints
│   ├── models/         # Database models and schemas
│   │   └── user.py     # User models
│   ├── services/       # Business logic services
│   │   └── auth_service.py # Authentication service
│   ├── utils/          # Utility functions
│   └── main.py         # FastAPI application entry point
├── tests/              # Test suite
├── requirements.txt    # Python dependencies
├── .env.example       # Environment template
└── README.md          # This file
```

## Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure all security best practices are followed
5. Test with both SQLite (dev) and PostgreSQL (prod)

## License

This project is proprietary software for legal document processing.