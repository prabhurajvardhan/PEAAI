"""Pydantic schemas for API request/response models."""
from .common import (
    PaginationParams,
    PaginatedResponse,
    MessageResponse,
    ErrorResponse,
)
from .user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
)
from .conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationListResponse,
    MessageCreate,
    MessageResponse as MessageResponseSchema,
    MessageListResponse,
)
from .memory import (
    MemoryCreate,
    MemoryUpdate,
    MemoryResponse,
    MemoryListResponse,
)

__all__ = [
    # Common
    "PaginationParams",
    "PaginatedResponse",
    "MessageResponse",
    "ErrorResponse",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserListResponse",
    # Conversation
    "ConversationCreate",
    "ConversationUpdate",
    "ConversationResponse",
    "ConversationListResponse",
    "MessageCreate",
    "MessageResponseSchema",
    "MessageListResponse",
    # Memory
    "MemoryCreate",
    "MemoryUpdate",
    "MemoryResponse",
    "MemoryListResponse",
]
