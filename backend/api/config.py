"""Configuration settings for the API."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "PEAAI API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/peaai"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # CORS
    ALLOWED_ORIGINS: list[str] = ["*"]

    # WebSocket
    WEBSOCKET_HEARTBEAT_INTERVAL: int = 30
    WEBSOCKET_HEARTBEAT_TIMEOUT: int = 60
    WEBSOCKET_MAX_MISSED_HEARTBEATS: int = 3

    # Session Management
    SESSION_MAX_CONCURRENT: int = 5
    SESSION_TTL_HOURS: int = 24

    # Storage
    CDN_BASE_URL: str = ""
    STORAGE_PATH: str = "./storage"
    STORAGE_MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10 MB
    STORAGE_MAX_VIDEO_SIZE: int = 100 * 1024 * 1024  # 100 MB
    STORAGE_MAX_AUDIO_SIZE: int = 50 * 1024 * 1024  # 50 MB
    STORAGE_MAX_DOCUMENT_SIZE: int = 5 * 1024 * 1024  # 5 MB

    # Redis (for session storage)
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
