#!/bin/bash

# Legal AI Application Deployment Script
# This script helps deploy the Legal AI application in different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
BUILD_IMAGES=true
PULL_IMAGES=false
RUN_MIGRATIONS=true
SEED_DATA=false
BACKUP_DB=false
SERVICES="all"

# Functions
print_usage() {
    cat << EOF
Legal AI Application Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment   Environment (development|staging|production) [default: development]
    -b, --build         Build Docker images [default: true]
    -p, --pull          Pull latest images instead of building [default: false]
    -m, --migrate       Run database migrations [default: true]
    -s, --seed          Seed database with sample data [default: false]
    --backup            Backup database before deployment [default: false]
    --services          Services to deploy (all|backend|frontend|nginx) [default: all]
    -h, --help          Show this help message

EXAMPLES:
    $0                                      # Deploy development environment
    $0 -e production -b -m                 # Deploy production with build and migrations
    $0 -e staging --pull --backup          # Deploy staging with pulled images and backup
    $0 --services backend -e production    # Deploy only backend service to production

EOF
}

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
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

check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    success "All dependencies are installed."
}

check_environment_file() {
    log "Checking environment configuration..."
    
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            warning ".env file not found. Copying from .env.example..."
            cp .env.example .env
            warning "Please edit .env file with your configuration before continuing."
            warning "Pay special attention to passwords, API keys, and database settings."
            read -p "Press Enter to continue after editing .env file..."
        else
            error ".env file not found and .env.example doesn't exist."
            exit 1
        fi
    fi
    
    # Check for required variables in production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        required_vars=(
            "SECRET_KEY"
            "JWT_SECRET_KEY"
            "POSTGRES_PASSWORD"
            "REDIS_PASSWORD"
            "CHROMADB_PASSWORD"
            "LLM_API_KEY"
        )
        
        for var in "${required_vars[@]}"; do
            if ! grep -q "^${var}=" .env || grep -q "^${var}=.*change_in_production" .env; then
                error "Please set a secure value for ${var} in .env file for production deployment."
                exit 1
            fi
        done
    fi
    
    success "Environment configuration is ready."
}

backup_database() {
    if [[ "$BACKUP_DB" == "true" ]]; then
        log "Creating database backup..."
        
        # Create backup directory
        mkdir -p backups
        
        # Generate backup filename with timestamp
        backup_file="backups/legal_ai_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        # Create database backup
        docker-compose exec postgres pg_dump -U "${POSTGRES_USER:-legal_ai_user}" "${POSTGRES_DB:-legal_ai_db}" > "$backup_file"
        
        if [[ $? -eq 0 ]]; then
            success "Database backup created: $backup_file"
        else
            error "Failed to create database backup"
            exit 1
        fi
    fi
}

pull_or_build_images() {
    if [[ "$PULL_IMAGES" == "true" ]]; then
        log "Pulling latest Docker images..."
        docker-compose pull
    elif [[ "$BUILD_IMAGES" == "true" ]]; then
        log "Building Docker images..."
        docker-compose build --no-cache
    fi
}

start_services() {
    log "Starting services..."
    
    case "$SERVICES" in
        "all")
            docker-compose up -d
            ;;
        "backend")
            docker-compose up -d postgres redis chromadb backend
            ;;
        "frontend")
            docker-compose up -d frontend
            ;;
        "nginx")
            docker-compose up -d nginx
            ;;
        *)
            docker-compose up -d $SERVICES
            ;;
    esac
    
    success "Services started successfully."
}

run_migrations() {
    if [[ "$RUN_MIGRATIONS" == "true" ]]; then
        log "Waiting for database to be ready..."
        sleep 10
        
        log "Running database migrations..."
        docker-compose exec backend python -m alembic upgrade head
        
        if [[ $? -eq 0 ]]; then
            success "Database migrations completed."
        else
            error "Database migrations failed."
            exit 1
        fi
    fi
}

seed_database() {
    if [[ "$SEED_DATA" == "true" ]]; then
        log "Seeding database with sample data..."
        docker-compose exec backend python -m app.scripts.seed_data
        
        if [[ $? -eq 0 ]]; then
            success "Database seeding completed."
        else
            warning "Database seeding failed or not implemented."
        fi
    fi
}

check_health() {
    log "Checking service health..."
    
    sleep 30  # Wait for services to start
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "Backend service is healthy."
    else
        warning "Backend service health check failed."
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend service is healthy."
    else
        warning "Frontend service health check failed."
    fi
    
    # Check nginx health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        success "Nginx service is healthy."
    else
        warning "Nginx service health check failed."
    fi
}

cleanup() {
    log "Cleaning up unused Docker resources..."
    docker system prune -f
    success "Cleanup completed."
}

show_info() {
    cat << EOF

${GREEN}=== Legal AI Application Deployed Successfully ===${NC}

${BLUE}Environment:${NC} $ENVIRONMENT
${BLUE}Services:${NC} $SERVICES

${BLUE}Application URLs:${NC}
  Frontend: http://localhost:3000
  Backend API: http://localhost:8000
  API Documentation: http://localhost:8000/docs

${BLUE}Admin Commands:${NC}
  View logs: docker-compose logs -f [service_name]
  Stop services: docker-compose down
  Update services: docker-compose pull && docker-compose up -d
  Database backup: docker-compose exec postgres pg_dump -U legal_ai_user legal_ai_db > backup.sql

${BLUE}Monitoring:${NC}
  Check status: docker-compose ps
  Service health: curl http://localhost:8000/health

${YELLOW}Note: Please secure your deployment by:${NC}
  1. Changing default passwords in .env file
  2. Setting up SSL certificates for production
  3. Configuring firewall rules
  4. Setting up monitoring and alerting
  5. Implementing regular backups

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_IMAGES=true
            shift
            ;;
        --no-build)
            BUILD_IMAGES=false
            shift
            ;;
        -p|--pull)
            PULL_IMAGES=true
            BUILD_IMAGES=false
            shift
            ;;
        -m|--migrate)
            RUN_MIGRATIONS=true
            shift
            ;;
        --no-migrate)
            RUN_MIGRATIONS=false
            shift
            ;;
        -s|--seed)
            SEED_DATA=true
            shift
            ;;
        --backup)
            BACKUP_DB=true
            shift
            ;;
        --services)
            SERVICES="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
    exit 1
fi

# Main deployment process
main() {
    log "Starting Legal AI Application deployment..."
    log "Environment: $ENVIRONMENT"
    
    check_dependencies
    check_environment_file
    backup_database
    pull_or_build_images
    start_services
    run_migrations
    seed_database
    check_health
    cleanup
    show_info
    
    success "Deployment completed successfully!"
}

# Run main function
main