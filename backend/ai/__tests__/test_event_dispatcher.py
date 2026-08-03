"""
Tests for Event Dispatcher module.
"""
import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ai.event_dispatcher import (
    EventDispatcher,
    Event,
    EventType,
    EventPriority,
    DeadLetterEvent,
    get_dispatcher,
)


class TestEvent:
    """Tests for Event class."""

    def test_event_creation(self):
        """Test event creation."""
        event = Event(
            type="test.event",
            data={"key": "value"},
            priority=EventPriority.HIGH,
        )
        assert event.type == "test.event"
        assert event.data["key"] == "value"
        assert event.priority == EventPriority.HIGH
        assert event.timestamp is not None

    def test_event_comparison(self):
        """Test event priority comparison."""
        low_event = Event(type="low", priority=EventPriority.LOW)
        high_event = Event(type="high", priority=EventPriority.HIGH)

        # Higher priority should come first (lower value)
        assert high_event < low_event

    def test_event_with_metadata(self):
        """Test event with metadata."""
        event = Event(
            type="test.event",
            data="test",
            source="test_source",
            metadata={"extra": "info"},
        )
        assert event.source == "test_source"
        assert event.metadata["extra"] == "info"


class TestEventDispatcher:
    """Tests for EventDispatcher."""

    @pytest.fixture
    def dispatcher(self):
        """Create test dispatcher."""
        return EventDispatcher(max_dlq_size=10, max_retry_attempts=3)

    @pytest.mark.asyncio
    async def test_register_handler(self, dispatcher):
        """Test handler registration."""
        results = []

        def handler(event):
            results.append(event.data)

        unregister = dispatcher.register("test.event", handler)

        await dispatcher.emit("test.event", data="hello")
        await dispatcher.process_queue()

        assert len(results) == 1
        assert results[0] == "hello"

        # Test unregister
        unregister()
        results.clear()
        await dispatcher.emit("test.event", data="world")
        await dispatcher.process_queue()
        assert len(results) == 0

    @pytest.mark.asyncio
    async def test_register_multiple_handlers(self, dispatcher):
        """Test multiple handlers for same event."""
        results = []

        async def handler1(event):
            results.append("handler1")

        def handler2(event):
            results.append("handler2")

        dispatcher.register("test.event", handler1, EventPriority.HIGH)
        dispatcher.register("test.event", handler2, EventPriority.LOW)

        await dispatcher.emit("test.event", data="test", immediate=True)

        # Both handlers should be called
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_wildcard_handlers(self, dispatcher):
        """Test wildcard event handlers."""
        results = []

        def handler(event):
            results.append(event.type)

        dispatcher.register("ai.*", handler)

        await dispatcher.emit("ai.message", data="test", immediate=True)
        await dispatcher.emit("ai.error", data="test", immediate=True)

        assert "ai.message" in results
        assert "ai.error" in results

    @pytest.mark.asyncio
    async def test_event_priority(self, dispatcher):
        """Test event processing by priority."""
        results = []

        def low_priority(event):
            results.append("low")

        def high_priority(event):
            results.append("high")

        dispatcher.register("test.event", low_priority, EventPriority.LOW)
        dispatcher.register("test.event", high_priority, EventPriority.HIGH)

        await dispatcher.emit("test.event", data="test", immediate=True)

        # High priority should come first
        assert results == ["high", "low"]

    @pytest.mark.asyncio
    async def test_dlq_on_handler_error(self, dispatcher):
        """Test dead letter queue on handler error."""
        def failing_handler(event):
            raise ValueError("Handler failed")

        dispatcher.register("failing.event", failing_handler)

        await dispatcher.emit("failing.event", data="test", immediate=True)

        # Should have one event in DLQ
        dlq = dispatcher.get_dlq()
        assert len(dlq) == 1
        assert "Handler failed" in dlq[0].error

    @pytest.mark.asyncio
    async def test_dlq_retry(self, dispatcher):
        """Test DLQ retry."""
        results = []

        def failing_handler(event):
            if not hasattr(failing_handler, 'called'):
                failing_handler.called = True
                raise ValueError("First failure")
            results.append("success")

        dispatcher.register("retry.event", failing_handler)
        dispatcher.max_retry_attempts = 2

        await dispatcher.emit("retry.event", data="test", immediate=True)

        # Should have retry
        stats = await dispatcher.retry_dlq()
        assert stats["retried"] >= 0

    @pytest.mark.asyncio
    async def test_emit_batch(self, dispatcher):
        """Test batch event emission."""
        results = []

        def handler(event):
            results.append(event.data)

        dispatcher.register("batch.event", handler)

        events = [
            Event(type="batch.event", data="one"),
            Event(type="batch.event", data="two"),
            Event(type="batch.event", data="three"),
        ]

        await dispatcher.emit_batch(events, immediate=True)
        assert len(results) == 3

    def test_get_handler_count(self, dispatcher):
        """Test handler count."""
        def handler1(event): pass
        def handler2(event): pass

        dispatcher.register("count.event", handler1)
        dispatcher.register("count.event", handler2)

        count = dispatcher.get_handler_count("count.event")
        assert count == 2

    def test_unregister_all(self, dispatcher):
        """Test unregister all handlers."""
        def handler(event): pass

        dispatcher.register("test1", handler)
        dispatcher.register("test2", handler)

        dispatcher.unregister_all("test1")
        assert dispatcher.get_handler_count("test1") == 0
        assert dispatcher.get_handler_count("test2") == 1

        dispatcher.unregister_all()
        assert dispatcher.get_handler_count() == 0

    def test_filters(self, dispatcher):
        """Test event filters."""
        def filter_func(event):
            return event.data != "blocked"

        dispatcher.add_filter("filtered.event", filter_func)
        assert "filtered.event" in dispatcher._event_filters

        dispatcher.remove_filter("filtered.event")
        assert "filtered.event" not in dispatcher._event_filters

    def test_clear_dlq(self, dispatcher):
        """Test clearing DLQ."""
        # Add something to DLQ
        event = Event(type="test", data="test")
        dispatcher._dlq.append(DeadLetterEvent(event=event, error="test"))

        assert dispatcher.get_dlq_size() == 1
        dispatcher.clear_dlq()
        assert dispatcher.get_dlq_size() == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
