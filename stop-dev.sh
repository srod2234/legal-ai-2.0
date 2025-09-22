#!/bin/bash

# Legal AI Application - Stop Development Services
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log "Stopping Legal AI Application development services..."

# Stop backend server
if [[ -f "backend.pid" ]]; then
    log "Stopping backend server..."
    kill $(cat backend.pid) 2>/dev/null || true
    rm backend.pid
    success "Backend server stopped."
fi

# Stop frontend server
if [[ -f "frontend.pid" ]]; then
    log "Stopping frontend server..."
    kill $(cat frontend.pid) 2>/dev/null || true
    rm frontend.pid
    success "Frontend server stopped."
fi

# Stop database services
log "Stopping database services..."
docker-compose -f docker-compose.dev.yml down

success "All development services stopped."

echo -e "\n${GREEN}✨ Legal AI Application development environment stopped successfully!${NC}"
echo -e "${BLUE}To start again, run: ./start-dev.sh${NC}"