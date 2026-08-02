"""
PEAAI Backend API

Main FastAPI application for the PEAAI Backend Infrastructure Module.
Provides REST API endpoints for users, conversations, memories, and authentication.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.api.config import get_settings
from backend.api.routers import (
    users_router,
    conversations_router,
    memories_router,
    auth_router,
    websocket_router,
    session_router,
    storage_router,
)
from backend.api.middleware import limiter

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    # Shutdown
    print("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    PEAAI Backend API for the AI Companion application.
    
    ## Features
    
    * **Authentication** - JWT-based authentication with registration, login, and password reset
    * **Users** - User profile management
    * **Conversations** - Chat conversation and message management
    * **Memories** - AI memory storage and retrieval
    * **Sessions** - Session management with concurrent session support
    * **Storage** - File upload, download, and CDN integration
    * **WebSocket** - Real-time communication
    
    ## Authentication
    
    Most endpoints require authentication. Use the `/api/v1/auth/login` endpoint
    to obtain access and refresh tokens, then include the access token in the
    `Authorization` header as `Bearer <token>`.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={
        "error": "rate_limit_exceeded",
        "detail": str(exc.detail),
    }
))
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(conversations_router)
app.include_router(memories_router)
app.include_router(session_router)
app.include_router(storage_router)
app.include_router(websocket_router)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API health check."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }


@app.get("/api/v1", tags=["API"])
async def api_info():
    """API version information."""
    return {
        "version": "v1",
        "endpoints": {
            "auth": "/api/v1/auth",
            "users": "/api/v1/users",
            "conversations": "/api/v1/conversations",
            "memories": "/api/v1/memories",
            "sessions": "/api/v1/sessions",
            "storage": "/api/v1/storage",
            "websocket": "/ws",
        }
    }
