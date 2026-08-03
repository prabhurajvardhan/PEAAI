"""
M08 AI Engine - LLM Integration Module

Main LLM Integration for PEAAI AI companion.
Handles request formatting, response parsing, error handling, and token management.
"""

from .types import (
    Message,
    MessageRole,
    LLMProvider,
    LLMRequest,
    LLMResponse,
    StreamChunk,
    TokenUsage,
)
from .config import LLMConfig, default_config
from .client import (
    LLMClient,
    LLMError,
    RateLimitError,
    AuthenticationError,
    InvalidRequestError,
    TokenLimitError,
    TokenManager,
    get_llm_client,
    set_llm_client,
)

__all__ = [
    # Types
    "Message",
    "MessageRole",
    "LLMProvider",
    "LLMRequest",
    "LLMResponse",
    "StreamChunk",
    "TokenUsage",
    # Config
    "LLMConfig",
    "default_config",
    # Client
    "LLMClient",
    "LLMError",
    "RateLimitError",
    "AuthenticationError",
    "InvalidRequestError",
    "TokenLimitError",
    "TokenManager",
    "get_llm_client",
    "set_llm_client",
]
