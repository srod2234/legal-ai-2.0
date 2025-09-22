"""Settings configuration for Legal AI Application."""

from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict
from dotenv import load_dotenv
from typing import Optional, List
from pathlib import Path

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application Configuration
    app_name: str = Field(
        default="Legal AI Application",
        description="Application name"
    )
    
    debug: bool = Field(
        default=False,
        description="Debug mode"
    )
    
    # Security Configuration
    jwt_secret_key: str = Field(
        ...,
        description="JWT secret key for token signing"
    )
    
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )
    
    access_token_expire_minutes: int = Field(
        default=30,
        description="Access token expiration time in minutes"
    )
    
    refresh_token_expire_days: int = Field(
        default=7,
        description="Refresh token expiration time in days"
    )
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082"],
        description="Allowed CORS origins"
    )
    
    # Database Configuration
    database_url: str = Field(
        default="sqlite:///./legal_ai.db",
        description="Database connection URL"
    )
    
    # ChromaDB Configuration
    chroma_host: str = Field(
        default="localhost",
        description="ChromaDB host"
    )
    
    chroma_port: int = Field(
        default=8001,
        description="ChromaDB port"
    )
    
    chroma_collection_name: str = Field(
        default="legal_documents",
        description="Default ChromaDB collection name"
    )
    
    # LLM Configuration (LLaMA 3 70B)
    llm_provider: str = Field(
        default="ollama",  # Updated for Ollama local development
        description="LLM provider (openai, anthropic, coreweave, ollama, etc.)"
    )
    
    llm_api_key: str = Field(
        ...,
        description="API key for the LLM provider"
    )
    
    llm_model: str = Field(
        default="llama3.2:3b",
        description="LLM model to use (defaults to Ollama llama3.2:3b for local development)"
    )
    
    llm_base_url: Optional[str] = Field(
        default="http://localhost:11434/v1",
        description="Base URL for the LLM API (Ollama local endpoint for development)"
    )
    
    llm_max_tokens: int = Field(
        default=4096,
        description="Maximum tokens for LLM responses"
    )
    
    llm_temperature: float = Field(
        default=0.1,
        description="LLM temperature for responses (low for legal accuracy)"
    )
    
    # Embedding Configuration
    embedding_provider: str = Field(
        default="sentence-transformers",
        description="Embedding provider (openai, sentence-transformers)"
    )

    embedding_api_key: Optional[str] = Field(
        default=None,
        description="API key for embedding provider (uses llm_api_key if None)"
    )
    
    embedding_model: str = Field(
        default="all-MiniLM-L6-v2",
        description="Embedding model for document vectorization"
    )
    
    embedding_dimension: int = Field(
        default=384,
        description="Embedding vector dimension"
    )
    
    # File Upload Configuration
    upload_directory: str = Field(
        default="./uploads",
        description="Directory for uploaded files"
    )
    
    max_file_size: int = Field(
        default=50 * 1024 * 1024,  # 50MB
        description="Maximum file size in bytes"
    )
    
    allowed_file_extensions: List[str] = Field(
        default=[".pdf", ".docx", ".txt"],
        description="Allowed file extensions"
    )
    
    # OCR Configuration
    enable_ocr: bool = Field(
        default=True,
        description="Enable OCR for scanned documents"
    )
    
    tesseract_cmd: Optional[str] = Field(
        default=None,
        description="Path to Tesseract OCR command (auto-detect if None)"
    )
    
    # Performance Configuration
    max_concurrent_uploads: int = Field(
        default=5,
        description="Maximum concurrent file uploads"
    )
    
    chat_response_timeout: int = Field(
        default=30,
        description="Chat response timeout in seconds"
    )
    
    # Logging Configuration
    log_level: str = Field(
        default="INFO",
        description="Logging level"
    )
    
    log_file: Optional[str] = Field(
        default="./logs/app.log",
        description="Log file path"
    )
    
    # WebSocket Configuration
    websocket_heartbeat_interval: int = Field(
        default=30,
        description="WebSocket heartbeat interval in seconds"
    )
    
    # Rate Limiting Configuration
    rate_limit_requests: int = Field(
        default=100,
        description="Rate limit requests per minute"
    )
    
    # Audit Configuration
    enable_audit_logging: bool = Field(
        default=True,
        description="Enable audit logging for compliance"
    )
    
    audit_log_retention_days: int = Field(
        default=2555,  # 7 years for legal compliance
        description="Audit log retention period in days"
    )


def load_settings() -> Settings:
    """Load settings with proper error handling and validation."""
    try:
        settings = Settings()
        
        # Validate critical settings
        if not settings.jwt_secret_key:
            raise ValueError("JWT_SECRET_KEY must be set")
        
        if not settings.llm_api_key:
            raise ValueError("LLM_API_KEY must be set")
        
        # Create required directories
        Path(settings.upload_directory).mkdir(parents=True, exist_ok=True)
        if settings.log_file:
            Path(settings.log_file).parent.mkdir(parents=True, exist_ok=True)
        
        return settings
        
    except Exception as e:
        error_msg = f"Failed to load settings: {e}"
        if "jwt_secret_key" in str(e).lower():
            error_msg += "\nMake sure to set JWT_SECRET_KEY in your .env file"
        if "llm_api_key" in str(e).lower():
            error_msg += "\nMake sure to set LLM_API_KEY in your .env file"
        raise ValueError(error_msg) from e


# Global settings instance
settings = load_settings()