"""
M08 AI Engine - Story Routing Module

Routes conversations to story generation and manages story state.
Handles story detection, scene triggering, story state management, and end detection.
"""

from .types import (
    Story,
    StoryScene,
    StoryQuery,
    StoryResponse,
    StoryState,
    StoryTrigger,
)
from .router import (
    StoryRouter,
    get_story_router,
    set_story_router,
)

__all__ = [
    # Types
    "Story",
    "StoryScene",
    "StoryQuery",
    "StoryResponse",
    "StoryState",
    "StoryTrigger",
    # Router
    "StoryRouter",
    "get_story_router",
    "set_story_router",
]
