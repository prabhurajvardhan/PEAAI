"""
M10: Memory Engine

Long-term memory management for PEAAI AI companion.
Handles user preferences, story memory, relationship context, and semantic search.
"""

from .user.user_memory import UserMemory, UserPreferences, UserSettings
from .story.story_memory import StoryMemory, StorySummary
from .relationship.relationship_memory import RelationshipMemory, RelationshipState, EmotionalContext
from .retrieval.retrieval_system import RetrievalSystem, MemoryItem, RetrievalQuery, RetrievalResult
from .search.search_system import SearchSystem, SearchQuery, SearchResult

__all__ = [
    # User Memory
    "UserMemory",
    "UserPreferences",
    "UserSettings",
    # Story Memory
    "StoryMemory",
    "StorySummary",
    # Relationship Memory
    "RelationshipMemory",
    "RelationshipState",
    "EmotionalContext",
    # Retrieval System
    "RetrievalSystem",
    "MemoryItem",
    "RetrievalQuery",
    "RetrievalResult",
    # Search System
    "SearchSystem",
    "SearchQuery",
    "SearchResult",
]
