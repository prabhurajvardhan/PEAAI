"""
Type definitions for Memory Routing.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class MemoryQueryType(Enum):
    """Types of memory queries."""
    USER_CONTEXT = "user_context"
    CONVERSATION_HISTORY = "conversation_history"
    STORY_CONTEXT = "story_context"
    RELATIONSHIP_INFO = "relationship_info"
    PREFERENCES = "preferences"
    FACTS = "facts"
    GENERAL = "general"


class MemoryPriority(Enum):
    """Priority levels for memory retrieval."""
    CRITICAL = 3  # Always include
    HIGH = 2
    NORMAL = 1
    LOW = 0


@dataclass
class MemoryQuery:
    """Query for memory routing."""
    user_id: str
    query_text: str
    query_type: MemoryQueryType = MemoryQueryType.GENERAL
    conversation_id: Optional[str] = None
    story_id: Optional[str] = None
    max_context_tokens: int = 2000
    include_pinned: bool = True
    include_relationship: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MemoryContext:
    """Context retrieved from memory."""
    user_id: str
    query_type: MemoryQueryType
    system_prompt: str
    conversation_history: List[str] = field(default_factory=list)
    relevant_memories: List[Dict[str, Any]] = field(default_factory=list)
    pinned_items: List[str] = field(default_factory=list)
    relationship_info: Optional[Dict[str, Any]] = None
    token_estimate: int = 0
    max_context_tokens: int = 2000
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MemoryInjectionResult:
    """Result of memory injection into LLM request."""
    context: MemoryContext
    messages: List[Dict[str, str]]  # Formatted messages for LLM
    tokens_used: int
    tokens_saved: int
