"""
M08 AI Engine - Memory Routing Module

Routes queries to memory and injects context into LLM requests.
Handles query analysis, context retrieval, memory injection, and fallback handling.
"""

from .types import (
    MemoryQuery,
    MemoryQueryType,
    MemoryContext,
    MemoryInjectionResult,
    MemoryPriority,
)
from .router import (
    MemoryRouter,
    get_memory_router,
    set_memory_router,
)

__all__ = [
    # Types
    "MemoryQuery",
    "MemoryQueryType",
    "MemoryContext",
    "MemoryInjectionResult",
    "MemoryPriority",
    # Router
    "MemoryRouter",
    "get_memory_router",
    "set_memory_router",
]
