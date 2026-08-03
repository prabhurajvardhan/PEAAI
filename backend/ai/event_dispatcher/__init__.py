"""
M08 AI Engine - Event Dispatcher Module

Event-driven architecture for AI Engine subsystems.
Handles event registration, emission, prioritization, and dead letter queue.
"""

from .types import (
    Event,
    EventType,
    EventPriority,
    EventHandler,
    DeadLetterEvent,
)
from .dispatcher import (
    EventDispatcher,
    get_dispatcher,
    set_dispatcher,
    event_scope,
)

__all__ = [
    # Types
    "Event",
    "EventType",
    "EventPriority",
    "EventHandler",
    "DeadLetterEvent",
    # Dispatcher
    "EventDispatcher",
    "get_dispatcher",
    "set_dispatcher",
    "event_scope",
]
