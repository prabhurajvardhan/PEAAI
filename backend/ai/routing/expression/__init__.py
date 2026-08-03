"""
M08 AI Engine - Expression Routing Module

Routes emotion detection to expression commands.
Handles emotion detection, expression commands, transition triggers, and priority handling.
"""

from .types import (
    EmotionType,
    ExpressionCommand,
    ExpressionTransition,
    ExpressionQuery,
    ExpressionResponse,
    ExpressionPriority,
    EmotionDetectionResult,
)
from .router import (
    ExpressionRouter,
    get_expression_router,
    set_expression_router,
)

__all__ = [
    # Types
    "EmotionType",
    "ExpressionCommand",
    "ExpressionTransition",
    "ExpressionQuery",
    "ExpressionResponse",
    "ExpressionPriority",
    "EmotionDetectionResult",
    # Router
    "ExpressionRouter",
    "get_expression_router",
    "set_expression_router",
]
