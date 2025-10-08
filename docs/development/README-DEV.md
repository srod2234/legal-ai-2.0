# Legal AI Application - Development Setup

This README provides instructions for running the Legal AI Application locally for development and demonstration.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Python 3.11+ installed
- Node.js 18+ installed
- Git installed

### Launch the Application

1. **Clone or navigate to the project directory:**
   ```bash
   cd "Legal Ai App 2.0"
   ```

2. **Start the development environment:**
   ```bash
   ./start-dev.sh
   ```

3. **Access the application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

4. **Stop the application:**
   ```bash
   ./stop-dev.sh
   ```

## 🏗️ What Gets Started

The development launcher will:

1. ✅ Check Docker availability and port conflicts
2. 🗄️ Start PostgreSQL, ChromaDB, and Redis databases
3. 🐍 Set up Python virtual environment and install backend dependencies
4. 📦 Install Node.js frontend dependencies
5. 🔧 Run database migrations
6. 🚀 Start FastAPI backend server (port 8000)
7. 🌐 Start Next.js frontend server (port 3000)

## 🎯 Application Features

### Core Features Available:
- **User Authentication**: Register, login, profile management
- **Document Management**: Upload, view, search documents
- **AI Chat Interface**: Chat with AI about documents (mock responses in dev)
- **Admin Dashboard**: System monitoring and user management
- **Real-time Features**: WebSocket-based chat updates

### Development Features:
- **Hot Reload**: Both frontend and backend support hot reloading
- **API Documentation**: Swagger UI at http://localhost:8000/docs
- **Database Admin**: Direct PostgreSQL access on localhost:5432
- **Vector Database**: ChromaDB interface on localhost:8001

## 🔧 Development Configuration

### Default Credentials:
- **Database**: `legal_ai_user` / `dev_password`
- **Redis**: Password `dev_redis_password`
- **ChromaDB**: No authentication in dev mode

### Environment Variables:
- Development settings are in `.env.dev`
- Automatically copied to `.env` on first run
- Safe defaults for local development

## 📁 Project Structure

```
Legal Ai App 2.0/
├── backend/                 # FastAPI backend
│   ├── app/                 # Application code
│   ├── tests/               # Backend tests
│   ├── venv/                # Python virtual environment
│   └── uploads/             # Uploaded files
├── frontend/                # Next.js frontend
│   ├── src/                 # Source code
│   ├── public/              # Static files
│   └── node_modules/        # Dependencies
├── docker-compose.dev.yml   # Development services
├── start-dev.sh            # Development launcher
└── stop-dev.sh             # Stop development services
```

## 🐛 Troubleshooting

### Common Issues:

1. **Port conflicts**: Stop other services using ports 3000, 8000, 5432, 6379, 8001
2. **Docker not running**: Start Docker Desktop before running the script
3. **Permission denied**: Make sure scripts are executable with `chmod +x *.sh`
4. **Backend fails to start**: Check if Python 3.11+ is installed and accessible
5. **Frontend fails to start**: Ensure Node.js 18+ is installed

### Logs:
- Backend logs appear in the terminal where you ran `start-dev.sh`
- Frontend logs also appear in the same terminal
- Database logs: `docker logs legal-ai-postgres-dev`

### Clean Reset:
```bash
./stop-dev.sh
docker-compose -f docker-compose.dev.yml down -v
rm -rf backend/venv frontend/node_modules
./start-dev.sh
```

## 🧪 Testing the Application

1. **Create a user account** at http://localhost:3000
2. **Upload a document** (PDF, DOCX, or TXT)
3. **Try the chat feature** to ask questions about your documents
4. **Check the admin dashboard** for system metrics
5. **Test file downloads and document management**

## ⚠️ Development Limitations

- **Mock LLM**: AI responses are simulated (configure real API key for actual AI)
- **OCR disabled**: Document text extraction may be limited
- **Email disabled**: Password reset emails won't be sent
- **Basic security**: Uses development-only security keys

## 🔗 Useful URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **ChromaDB**: http://localhost:8001

Happy coding! 🎉