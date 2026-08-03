"""
Expression Router - Routes emotion detection to expression commands.

Handles:
- Emotion detection
- Expression commands
- Transition triggers
- Priority handling
"""
import asyncio
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from ...event_dispatcher import EventDispatcher, Event, EventType, EventPriority
from .types import (
    EmotionType,
    ExpressionCommand,
    ExpressionTransition,
    ExpressionQuery,
    ExpressionResponse,
    ExpressionPriority,
    EmotionDetectionResult,
)

logger = logging.getLogger(__name__)


class ExpressionRouter:
    """
    Routes emotion detection to expression commands.

    Features:
    - Detects emotions in text
    - Generates expression commands
    - Manages expression transitions
    - Handles priority-based queuing
    """

    # Emotion keywords mapping
    EMOTION_KEYWORDS: Dict[EmotionType, List[str]] = {
        EmotionType.HAPPY: ["happy", "joy", "great", "wonderful", "love", "awesome", "yay", "excited", "glad", "pleased", ":-)", ":)", "lol", "haha"],
        EmotionType.SAD: ["sad", "unhappy", "depressed", "upset", "sorry", "unfortunate", "unfortunately", "unfortunately", "cry", "tears", "disappointed", ":(", ":'-("],
        EmotionType.ANGRY: ["angry", "mad", "furious", "annoyed", "frustrated", "irritated", "hate", "stupid", "ugh", "grrr"],
        EmotionType.SURPRISED: ["surprised", "wow", "omg", "oh", "unexpected", "shocked", "astonished", "no way", "really?"],
        EmotionType.THINKING: ["think", "hmm", "wonder", "consider", "maybe", "perhaps", "not sure", "uncertain", "processing"],
        EmotionType.EXCITED: ["excited", "amazing", "incredible", "fantastic", "wow", "awesome", "can't wait", "super", "pumped"],
        EmotionType.SLEEPY: ["tired", "sleepy", "exhausted", "drowsy", "yawn", "sleep", "bed", "nap"],
        EmotionType.CURIOUS: ["curious", "interested", "what", "why", "how", "tell me more", "explain", "wondering", "interested"],
        EmotionType.LOVING: ["love", "adore", "care", "miss", "dear", "sweetheart", "precious", "honey", "romantic"],
        EmotionType.CONFUSED: ["confused", "puzzled", "don't understand", "unclear", "huh", "what do you mean", "lost"],
        EmotionType.WORRIED: ["worried", "concerned", "anxious", "nervous", "fear", "scared", "afraid", "stress"],
        EmotionType.NEUTRAL: ["okay", "ok", "alright", "fine", "sure", "yes", "no", "maybe"],
    }

    # Emotion intensity modifiers
    INTENSITY_PATTERNS = [
        (r"very\s+(.+)", 1.5),
        (r"really\s+(.+)", 1.4),
        (r"so\s+(.+)", 1.3),
        (r"extremely\s+(.+)", 1.6),
        (r"super\s+(.+)", 1.3),
        (r"a\s+little\s+(.+)", 0.6),
        (r"somewhat\s+(.+)", 0.7),
        (r"kind\s+of\s+(.+)", 0.7),
    ]

    # Emotion transition pairs
    EMOTION_TRANSITIONS: Dict[Tuple[EmotionType, EmotionType], float] = {
        (EmotionType.NEUTRAL, EmotionType.HAPPY): 0.3,
        (EmotionType.NEUTRAL, EmotionType.SAD): 0.4,
        (EmotionType.NEUTRAL, EmotionType.SURPRISED): 0.2,
        (EmotionType.HAPPY, EmotionType.SURPRISED): 0.3,
        (EmotionType.SAD, EmotionType.THINKING): 0.5,
        (EmotionType.THINKING, EmotionType.CURIOUS): 0.3,
        (EmotionType.EXCITED, EmotionType.HAPPY): 0.2,
        (EmotionType.SURPRISED, EmotionType.NEUTRAL): 0.4,
    }

    def __init__(
        self,
        dispatcher: Optional[EventDispatcher] = None,
        default_duration: float = 3.0,
        max_queue_size: int = 5,
    ):
        """
        Initialize the Expression Router.

        Args:
            dispatcher: Event dispatcher for expression events
            default_duration: Default expression duration in seconds
            max_queue_size: Maximum queued expressions
        """
        self._dispatcher = dispatcher
        self._default_duration = default_duration
        self._max_queue_size = max_queue_size
        self._expression_queue: List[ExpressionCommand] = []
        self._current_emotion = EmotionType.NEUTRAL

    def detect_emotion(
        self,
        text: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> EmotionDetectionResult:
        """
        Detect emotion in text.

        Args:
            text: Input text
            context: Optional context

        Returns:
            EmotionDetectionResult with detected emotions
        """
        text_lower = text.lower()
        emotion_scores: Dict[EmotionType, float] = {}

        # Check for intensity modifiers
        intensity = 1.0
        for pattern, multiplier in self.INTENSITY_PATTERNS:
            if re.search(pattern, text_lower):
                intensity = multiplier
                break

        # Count emotion keyword matches
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword in text_lower:
                    score += 1
            if score > 0:
                emotion_scores[emotion] = score * intensity

        # Context-based emotion detection
        if context:
            # Adjust based on conversation context
            if context.get("is_question"):
                emotion_scores[EmotionType.CURIOUS] = emotion_scores.get(EmotionType.CURIOUS, 0) + 0.5
            if context.get("is_exclamation"):
                emotion_scores[EmotionType.EXCITED] = emotion_scores.get(EmotionType.EXCITED, 0) + 0.5

        # Normalize scores
        max_score = max(emotion_scores.values()) if emotion_scores else 1
        if max_score > 0:
            emotion_scores = {e: s / max_score for e, s in emotion_scores.items()}

        # Get top emotions
        sorted_emotions = sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)

        if not sorted_emotions:
            return EmotionDetectionResult(
                primary_emotion=EmotionType.NEUTRAL,
                confidence=0.5,
            )

        primary_emotion, primary_confidence = sorted_emotions[0]
        secondary_emotion = sorted_emotions[1][0] if len(sorted_emotions) > 1 else None

        # Create blended emotions list
        blended = [(e, c) for e, c in sorted_emotions[:3] if c > 0.2]

        # Extract triggers
        triggers = []
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    triggers.append(keyword)
                    break

        return EmotionDetectionResult(
            primary_emotion=primary_emotion,
            secondary_emotion=secondary_emotion,
            confidence=primary_confidence,
            blended_emotions=blended,
            triggers=triggers[:5],
        )

    def determine_priority(
        self,
        emotion: EmotionType,
        current_emotion: Optional[EmotionType],
        context: Optional[Dict[str, Any]] = None,
    ) -> ExpressionPriority:
        """
        Determine the priority for an expression change.

        Args:
            emotion: Detected emotion
            current_emotion: Current expression emotion
            context: Optional context

        Returns:
            ExpressionPriority level
        """
        # Strong emotions always get high priority
        strong_emotions = {EmotionType.ANGRY, EmotionType.SURPRISED, EmotionType.SAD}
        if emotion in strong_emotions:
            return ExpressionPriority.HIGH

        # Context-based priority
        if context:
            if context.get("story_mode"):
                return ExpressionPriority.CRITICAL
            if context.get("emotional_moment"):
                return ExpressionPriority.HIGH

        # Transition from neutral to anything
        if current_emotion == EmotionType.NEUTRAL and emotion != EmotionType.NEUTRAL:
            return ExpressionPriority.NORMAL

        # Same emotion detection
        if current_emotion == emotion:
            return ExpressionPriority.LOW

        # Default
        return ExpressionPriority.NORMAL

    def get_transition_duration(
        self,
        from_emotion: EmotionType,
        to_emotion: EmotionType,
    ) -> float:
        """
        Get transition duration between two emotions.

        Args:
            from_emotion: Starting emotion
            to_emotion: Target emotion

        Returns:
            Transition duration in seconds
        """
        # Check for predefined transition
        key = (from_emotion, to_emotion)
        if key in self.EMOTION_TRANSITIONS:
            return self.EMOTION_TRANSITIONS[key]

        # Calculate based on emotion distance
        base_duration = 0.3

        # Extreme transitions take longer
        extreme_emotions = {EmotionType.ANGRY, EmotionType.SAD, EmotionType.EXCITED}
        if from_emotion in extreme_emotions or to_emotion in extreme_emotions:
            base_duration = 0.5

        # Similar emotions transition faster
        similar_pairs = [
            (EmotionType.HAPPY, EmotionType.EXCITED),
            (EmotionType.THINKING, EmotionType.CURIOUS),
            (EmotionType.SURPRISED, EmotionType.CONFUSED),
        ]
        if (from_emotion, to_emotion) in similar_pairs:
            base_duration = 0.2

        return base_duration

    async def route_expression(
        self,
        query: ExpressionQuery,
    ) -> ExpressionResponse:
        """
        Route emotion detection to expression command.

        Args:
            query: Expression query with text and context

        Returns:
            ExpressionResponse with expression commands
        """
        # Detect emotion
        emotion_result = self.detect_emotion(query.text, query.context)

        # Skip if low confidence and not forcing
        if emotion_result.confidence < 0.3 and not query.force_detection:
            return ExpressionResponse(
                should_change_expression=False,
            )

        # Determine priority
        priority = self.determine_priority(
            emotion_result.primary_emotion,
            query.current_emotion,
            query.context,
        )

        # Check if we should queue
        should_queue = (
            priority == ExpressionPriority.LOW and
            query.current_emotion is not None
        )

        if should_queue and len(self._expression_queue) >= self._max_queue_size:
            return ExpressionResponse(
                should_change_expression=False,
            )

        # Create expression command
        command = ExpressionCommand(
            emotion=emotion_result.primary_emotion,
            priority=priority,
            duration=self._default_duration if priority != ExpressionPriority.CRITICAL else None,
            blend=True,
            metadata={"confidence": emotion_result.confidence},
        )

        # Create transition
        if query.current_emotion and query.current_emotion != emotion_result.primary_emotion:
            transition = ExpressionTransition(
                from_emotion=query.current_emotion,
                to_emotion=emotion_result.primary_emotion,
                duration=self.get_transition_duration(
                    query.current_emotion,
                    emotion_result.primary_emotion,
                ),
            )
        else:
            transition = None

        # Handle queueing
        if should_queue:
            self._expression_queue.append(command)
            return ExpressionResponse(
                should_change_expression=False,
                emotion_detected=emotion_result,
                queue_expressions=[command],
            )

        # Update current emotion
        self._current_emotion = emotion_result.primary_emotion

        # Emit expression change event
        if self._dispatcher:
            await self._dispatcher.emit(
                EventType.EXPRESSION_CHANGE.value,
                data={
                    "emotion": emotion_result.primary_emotion.value,
                    "priority": priority.value,
                    "confidence": emotion_result.confidence,
                    "blended": emotion_result.blended_emotions,
                },
                priority=EventPriority.HIGH if priority == ExpressionPriority.HIGH else EventPriority.NORMAL,
                source="expression_router",
            )

        return ExpressionResponse(
            should_change_expression=True,
            command=command,
            transition=transition,
            emotion_detected=emotion_result,
        )

    def get_next_queued(self) -> Optional[ExpressionCommand]:
        """
        Get the next queued expression.

        Returns:
            Next ExpressionCommand or None
        """
        if self._expression_queue:
            return self._expression_queue.pop(0)
        return None

    def clear_queue(self) -> int:
        """
        Clear the expression queue.

        Returns:
            Number of expressions cleared
        """
        count = len(self._expression_queue)
        self._expression_queue.clear()
        return count

    def get_current_emotion(self) -> EmotionType:
        """Get the current emotion."""
        return self._current_emotion

    def set_current_emotion(self, emotion: EmotionType) -> None:
        """Set the current emotion."""
        self._current_emotion = emotion


# Global router instance
_expression_router: Optional[ExpressionRouter] = None


def get_expression_router() -> ExpressionRouter:
    """Get the global expression router instance."""
    global _expression_router
    if _expression_router is None:
        _expression_router = ExpressionRouter()
    return _expression_router


def set_expression_router(router: ExpressionRouter) -> None:
    """Set the global expression router instance."""
    global _expression_router
    _expression_router = router
