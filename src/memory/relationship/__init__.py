"""Relationship Memory module - tracks user-companion relationship."""

from .relationship_memory import (
    RelationshipMemory,
    RelationshipState,
    EmotionalContext,
    InteractionRecord,
    TrustMetrics,
)
from .trust_tracker import TrustTracker

__all__ = [
    "RelationshipMemory",
    "RelationshipState",
    "EmotionalContext",
    "InteractionRecord",
    "TrustMetrics",
    "TrustTracker",
]
