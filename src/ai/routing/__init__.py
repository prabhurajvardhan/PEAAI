"""
M08 AI Engine - Routing Module

Routes queries to appropriate subsystems.
"""

from .memory import MemoryRouter, get_memory_router, set_memory_router
from .story import StoryRouter, get_story_router, set_story_router
from .expression import ExpressionRouter, get_expression_router, set_expression_router

__all__ = [
    # Memory
    "MemoryRouter",
    "get_memory_router",
    "set_memory_router",
    # Story
    "StoryRouter",
    "get_story_router",
    "set_story_router",
    # Expression
    "ExpressionRouter",
    "get_expression_router",
    "set_expression_router",
]
