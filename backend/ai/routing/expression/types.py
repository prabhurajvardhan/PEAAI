"""
Type definitions for Expression Routing.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class EmotionType(Enum):
    """Emotion types for expression routing."""
    NEUTRAL = "neutral"
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    SURPRISED = "surprised"
    THINKING = "thinking"
    EXCITED = "excited"
    SLEEPY = "sleepy"
    CURIOUS = "curious"
    LOVING = "loving"
    CONFUSED = "confused"
    WORRIED = "worried"


class ExpressionPriority(Enum):
    """Priority levels for expression changes."""
    CRITICAL = 3  # Override current expression
    HIGH = 2  # Interrupt current expression
    NORMAL = 1  # Queue after current expression
    LOW = 0  # Only if idle


@dataclass
class ExpressionCommand:
    """Command to change the AI's expression."""
    emotion: EmotionType
    priority: ExpressionPriority = ExpressionPriority.NORMAL
    duration: Optional[float] = None  # None = until next command
    blend: bool = True  # Blend with current expression
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExpressionTransition:
    """Transition between expressions."""
    from_emotion: EmotionType
    to_emotion: EmotionType
    duration: float = 0.5  # Transition duration in seconds
    easing: str = "ease-in-out"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EmotionDetectionResult:
    """Result of emotion detection in text."""
    primary_emotion: EmotionType
    secondary_emotion: Optional[EmotionType] = None
    confidence: float = 0.0
    blended_emotions: List[tuple[EmotionType, float]] = field(default_factory=list)
    triggers: List[str] = field(default_factory=list)


@dataclass
class ExpressionQuery:
    """Query for expression routing."""
    text: str
    context: Optional[Dict[str, Any]] = None
    current_emotion: Optional[EmotionType] = None
    force_detection: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExpressionResponse:
    """Response from expression routing."""
    should_change_expression: bool
    command: Optional[ExpressionCommand] = None
    transition: Optional[ExpressionTransition] = None
    emotion_detected: Optional[EmotionDetectionResult] = None
    queue_expressions: List[ExpressionCommand] = field(default_factory=list)
