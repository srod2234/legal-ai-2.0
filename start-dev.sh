#!/bin/bash

# Legal AI Application - Local Development Launcher
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    success "Docker is running."
}

# Check if ports are available
check_ports() {
    local ports=(5173 8000 5432 8001 6379)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -i :$port > /dev/null 2>&1; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -ne 0 ]; then
        warning "The following ports are already in use: ${occupied_ports[*]}"
        warning "You may need to stop other services or the application might not work properly."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Setup development environment
setup_dev_env() {
    log "Setting up development environment..."
    
    # Copy development environment file
    if [[ ! -f ".env" ]]; then
        cp .env.dev .env
        success "Copied .env.dev to .env"
    else
        warning ".env file already exists. Using existing configuration."
    fi
    
    # Create necessary directories
    mkdir -p backend/uploads backend/logs backend/temp
    mkdir -p frontend/.next
    success "Created necessary directories."
}

# Start database services
start_databases() {
    log "Starting database services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for databases to be ready
    log "Waiting for databases to be ready..."
    sleep 15
    
    # Check if PostgreSQL is ready
    if docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U legal_ai_user > /dev/null 2>&1; then
        success "PostgreSQL is ready."
    else
        error "PostgreSQL failed to start properly."
        exit 1
    fi
    
    success "Database services are running."
}

# Install backend dependencies
setup_backend() {
    log "Setting up backend..."
    
    cd backend
    
    # Check if Python virtual environment exists
    if [[ ! -d "venv" ]]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
        success "Virtual environment created."
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate

    # Upgrade pip
    pip install --upgrade pip

    # Install dependencies with pip
    log "Installing backend dependencies..."
    pip install -r requirements.txt
    
    success "Backend dependencies installed."
    cd ..
}

# Install frontend dependencies
setup_frontend() {
    log "Setting up frontend..."
    
    cd frontend
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log "Installing frontend dependencies..."
        npm install
        success "Frontend dependencies installed."
    else
        log "Frontend dependencies already installed."
    fi
    
    cd ..
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd backend
    source venv/bin/activate
    
    # Wait a bit more for PostgreSQL to be fully ready
    sleep 5
    
    # Create database tables
    python -c "
from app.core.database import engine
from app.models import *
import sqlmodel
sqlmodel.SQLModel.metadata.create_all(engine)
print('Database tables created successfully.')
"
    
    success "Database migrations completed."
    cd ..
}

# Start backend server
start_backend() {
    log "Starting backend server..."
    
    cd backend
    source venv/bin/activate
    
    # Start the FastAPI server in background
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    success "Backend server starting on http://localhost:8000"
    cd ..
    
    # Wait for backend to be ready
    sleep 10
    
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "Backend server is running and healthy."
    else
        warning "Backend server may not be fully ready yet."
    fi
}

# Start frontend server
start_frontend() {
    log "Starting frontend server..."
    
    cd frontend
    
    # Start the Next.js development server in background
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    success "Frontend server starting on http://localhost:5173"
    cd ..

    # Wait for frontend to be ready
    sleep 15

    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        success "Frontend server is running."
    else
        warning "Frontend server may not be fully ready yet."
    fi
}

# Show application info
show_info() {
    cat << EOF

${GREEN}🎉 Legal AI Application is now running locally! 🎉${NC}

${BLUE}📱 Application URLs:${NC}
  🌐 Frontend: http://localhost:5173
  🔧 Backend API: http://localhost:8000
  📚 API Documentation: http://localhost:8000/docs
  📊 ChromaDB: http://localhost:8001

${BLUE}🛠️  Development Tools:${NC}
  📋 View backend logs: tail -f backend.log (if created)
  🔍 View frontend logs: Check terminal where you ran this script
  🗄️  Database: PostgreSQL on localhost:5432
  📝 Redis: localhost:6379

${BLUE}⚡ Quick Commands:${NC}
  🛑 Stop all services: ./stop-dev.sh
  🔄 Restart services: ./restart-dev.sh
  🧹 Clean up: docker-compose -f docker-compose.dev.yml down -v

${BLUE}👤 Getting Started:${NC}
  1. Open http://localhost:5173 in your browser
  2. The application will start with a clean database
  3. You can create a new user account or use the admin interface
  4. Upload some test documents and try the AI chat features

${YELLOW}⚠️  Note:${NC}
  - This is a development setup with mock LLM integration
  - For full AI functionality, configure a real LLM API key in .env
  - Some features may require additional setup (OCR, email, etc.)

${GREEN}Happy coding! 🚀${NC}

EOF
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    if [[ -f "backend.pid" ]]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
    fi
    if [[ -f "frontend.pid" ]]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm frontend.pid
    fi
}

# Main execution
main() {
    cat << EOF
${BLUE}
╔══════════════════════════════════════════════╗
║          Legal AI Application                ║
║          Development Launcher                ║
╚══════════════════════════════════════════════╝
${NC}

EOF
    
    log "Starting Legal AI Application in development mode..."
    
    check_docker
    check_ports
    setup_dev_env
    start_databases
    setup_backend
    setup_frontend
    run_migrations
    start_backend
    start_frontend
    show_info
    
    # Keep the script running
    log "Application is running. Press Ctrl+C to stop all services."
    
    # Trap Ctrl+C to cleanup
    trap cleanup EXIT
    
    # Wait indefinitely
    while true; do
        sleep 30
        # Check if services are still running
        if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
            warning "Backend service appears to be down."
        fi
        if ! curl -f http://localhost:5173 > /dev/null 2>&1; then
            warning "Frontend service appears to be down."
        fi
    done
}

# Run main function
main