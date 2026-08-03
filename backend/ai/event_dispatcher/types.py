"""
Type definitions for Event Dispatcher.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set
from datetime import datetime


class EventPriority(Enum):
    """Event priority levels."""
    CRITICAL = 0  # Must be processed first
    HIGH = 1
    NORMAL = 2
    LOW = 3


class EventType(Enum):
    """System event types."""
    # AI Engine Events
    AI_MESSAGE = "ai.message"
    AI_STREAM_START = "ai.stream.start"
    AI_STREAM_CHUNK = "ai.stream.chunk"
    AI_STREAM_END = "ai.stream.end"
    AI_ERROR = "ai.error"

    # Memory Events
    MEMORY_QUERY = "memory.query"
    MEMORY_RETRIEVED = "memory.retrieved"
    MEMORY_STORE = "memory.store"

    # Expression Events
    EXPRESSION_CHANGE = "expression.change"
    EXPRESSION_QUEUE = "expression.queue"
    EXPRESSION_TRANSITION = "expression.transition"

    # Story Events
    STORY_START = "story.start"
    STORY_SCENE = "story.scene"
    STORY_END = "story.end"
    STORY_DETECTED = "story.detected"

    # System Events
    SESSION_START = "session.start"
    SESSION_END = "session.end"
    USER_MESSAGE = "user.message"
    CONNECTION_OPEN = "connection.open"
    CONNECTION_CLOSE = "connection.close"


@dataclass
class Event:
    """Base event class."""
    type: str
    data: Any = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    priority: EventPriority = EventPriority.NORMAL
    source: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __lt__(self, other: "Event") -> bool:
        """Compare events by priority."""
        if self.priority == other.priority:
            return self.timestamp < other.timestamp
        return self.priority.value < other.priority.value


@dataclass
class DeadLetterEvent:
    """Event that failed to process."""
    event: Event
    error: str
    attempts: int = 0
    last_attempt: Optional[datetime] = None


# Type for event handlers
EventHandler = Callable[[Event], Any]
