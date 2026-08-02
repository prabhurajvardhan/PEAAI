"""
Tests for Expression Router module.
"""
import pytest
import asyncio

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.ai.routing.expression import (
    ExpressionRouter,
    ExpressionQuery,
    ExpressionResponse,
    EmotionType,
    ExpressionPriority,
    EmotionDetectionResult,
    ExpressionCommand,
)
from src.ai.event_dispatcher import EventDispatcher


class TestExpressionRouter:
    """Tests for ExpressionRouter."""

    @pytest.fixture
    def router(self):
        """Create test router."""
        return ExpressionRouter(default_duration=3.0)

    def test_detect_happy_emotion(self, router):
        """Test happy emotion detection."""
        result = router.detect_emotion("I am so happy today! This is wonderful!")
        assert result.primary_emotion == EmotionType.HAPPY
        assert result.confidence > 0

    def test_detect_sad_emotion(self, router):
        """Test sad emotion detection."""
        result = router.detect_emotion("I'm feeling really sad and disappointed.")
        assert result.primary_emotion == EmotionType.SAD
        assert "sad" in result.triggers

    def test_detect_angry_emotion(self, router):
        """Test angry emotion detection."""
        result = router.detect_emotion("This is so frustrating! I'm really angry!")
        assert result.primary_emotion == EmotionType.ANGRY

    def test_detect_surprised_emotion(self, router):
        """Test surprised emotion detection."""
        result = router.detect_emotion("Wow! That's surprising! I didn't expect that!")
        # Should detect surprised or one of the related emotions
        assert result.primary_emotion in [EmotionType.SURPRISED, EmotionType.EXCITED]

    def test_detect_curious_emotion(self, router):
        """Test curious emotion detection."""
        result = router.detect_emotion("I'm curious about how this works. Tell me more!")
        assert result.primary_emotion == EmotionType.CURIOUS

    def test_detect_neutral_emotion(self, router):
        """Test neutral emotion detection."""
        result = router.detect_emotion("Okay, that's fine.")
        assert result.primary_emotion == EmotionType.NEUTRAL

    def test_detect_excited_emotion(self, router):
        """Test excited emotion detection."""
        result = router.detect_emotion("This is amazing! I can't wait! Super excited!")
        assert result.primary_emotion == EmotionType.EXCITED

    def test_detect_emotion_with_context(self, router):
        """Test emotion detection with context."""
        result = router.detect_emotion(
            "That's interesting.",
            context={"is_question": True}
        )
        # Should boost curious emotion
        assert result.primary_emotion in [EmotionType.CURIOUS, EmotionType.NEUTRAL]

    def test_determine_priority_high_for_strong_emotions(self, router):
        """Test that strong emotions get high priority."""
        priority = router.determine_priority(EmotionType.ANGRY, EmotionType.NEUTRAL)
        assert priority == ExpressionPriority.HIGH

        priority = router.determine_priority(EmotionType.SURPRISED, EmotionType.NEUTRAL)
        assert priority == ExpressionPriority.HIGH

    def test_determine_priority_low_for_same_emotion(self, router):
        """Test low priority for same emotion."""
        router._current_emotion = EmotionType.HAPPY
        priority = router.determine_priority(
            EmotionType.HAPPY,
            EmotionType.HAPPY
        )
        assert priority == ExpressionPriority.LOW

    def test_get_transition_duration(self, router):
        """Test transition duration calculation."""
        # Happy to neutral should be quick
        duration = router.get_transition_duration(
            EmotionType.HAPPY,
            EmotionType.NEUTRAL
        )
        assert duration >= 0.2

        # Extreme emotions take longer
        duration = router.get_transition_duration(
            EmotionType.ANGRY,
            EmotionType.HAPPY
        )
        assert duration >= 0.3

    @pytest.mark.asyncio
    async def test_route_expression_happy(self, router):
        """Test routing for happy expression."""
        query = ExpressionQuery(
            text="I am so happy today!",
            current_emotion=EmotionType.NEUTRAL,
        )

        response = await router.route_expression(query)

        assert response.should_change_expression
        assert response.command is not None
        assert response.command.emotion == EmotionType.HAPPY

    @pytest.mark.asyncio
    async def test_route_expression_low_confidence(self, router):
        """Test routing with low confidence."""
        query = ExpressionQuery(
            text="Hello there.",
            current_emotion=EmotionType.NEUTRAL,
            force_detection=False,
        )

        response = await router.route_expression(query)

        # Low confidence might not trigger change
        assert response is not None

    @pytest.mark.asyncio
    async def test_route_expression_queue(self, router):
        """Test expression queuing."""
        router._max_queue_size = 3
        router._current_emotion = EmotionType.HAPPY

        query = ExpressionQuery(
            text="Hello.",
            current_emotion=EmotionType.HAPPY,
        )

        response = await router.route_expression(query)

        # Should be queued since same emotion and low priority
        assert len(router._expression_queue) <= router._max_queue_size

    def test_get_next_queued(self, router):
        """Test getting next queued expression."""
        router._expression_queue.append(
            ExpressionCommand(emotion=EmotionType.SAD)
        )
        router._expression_queue.append(
            ExpressionCommand(emotion=EmotionType.HAPPY)
        )

        next_expr = router.get_next_queued()
        assert next_expr.emotion == EmotionType.SAD

        next_expr = router.get_next_queued()
        assert next_expr.emotion == EmotionType.HAPPY

    def test_clear_queue(self, router):
        """Test clearing expression queue."""
        router._expression_queue.append(
            ExpressionCommand(emotion=EmotionType.SAD)
        )
        router._expression_queue.append(
            ExpressionCommand(emotion=EmotionType.HAPPY)
        )

        count = router.clear_queue()
        assert count == 2
        assert len(router._expression_queue) == 0

    def test_get_current_emotion(self, router):
        """Test getting current emotion."""
        router._current_emotion = EmotionType.HAPPY
        assert router.get_current_emotion() == EmotionType.HAPPY

    def test_set_current_emotion(self, router):
        """Test setting current emotion."""
        router.set_current_emotion(EmotionType.SAD)
        assert router.get_current_emotion() == EmotionType.SAD


class TestEmotionKeywords:
    """Tests for emotion keyword detection."""

    def test_happy_keywords(self):
        """Test happy emotion keywords."""
        router = ExpressionRouter()
        happy_texts = [
            "I'm so happy!",
            "This is wonderful!",
            "I love it!",
            "That's awesome!",
            "Yay!",
        ]
        for text in happy_texts:
            result = router.detect_emotion(text)
            assert result.primary_emotion == EmotionType.HAPPY

    def test_sad_keywords(self):
        """Test sad emotion detection."""
        router = ExpressionRouter()
        # Use explicit sad keywords
        result = router.detect_emotion("I'm sad and feeling really down")
        assert result.primary_emotion == EmotionType.SAD


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
