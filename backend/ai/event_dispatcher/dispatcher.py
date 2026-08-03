"""
Event Dispatcher for AI Engine.

Handles event registration, emission, prioritization, and dead letter queue.
"""
import asyncio
import logging
import heapq
from collections import defaultdict
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set
from contextlib import asynccontextmanager

from .types import (
    Event,
    EventType,
    EventPriority,
    EventHandler,
    DeadLetterEvent,
)

logger = logging.getLogger(__name__)


class EventDispatcher:
    """
    Central event dispatcher for the AI Engine.

    Features:
    - Event registration with wildcards
    - Event emission with prioritization
    - Async event handling
    - Dead letter queue for failed events
    - Event filtering
    """

    def __init__(
        self,
        max_dlq_size: int = 1000,
        max_retry_attempts: int = 3,
        default_priority: EventPriority = EventPriority.NORMAL,
    ):
        """
        Initialize the Event Dispatcher.

        Args:
            max_dlq_size: Maximum size of dead letter queue
            max_retry_attempts: Maximum retry attempts for failed events
            default_priority: Default priority for events
        """
        self._handlers: Dict[str, List[tuple[EventHandler, EventPriority]]] = defaultdict(list)
        self._wildcard_handlers: Dict[str, List[tuple[EventHandler, EventPriority]]] = defaultdict(list)
        self._dlq: List[DeadLetterEvent] = []
        self._max_dlq_size = max_dlq_size
        self._max_retry_attempts = max_retry_attempts
        self._default_priority = default_priority
        self._event_queue: List[Event] = []
        self._processing = False
        self._lock = asyncio.Lock()
        self._event_filters: Dict[str, Callable[[Event], bool]] = {}

    def register(
        self,
        event_type: str,
        handler: EventHandler,
        priority: EventPriority = EventPriority.NORMAL,
    ) -> Callable[[], None]:
        """
        Register an event handler.

        Args:
            event_type: Event type to listen for (supports wildcards like "ai.*")
            handler: Handler function
            priority: Handler priority (higher = runs first)

        Returns:
            Unregister function
        """
        if "*" in event_type:
            # Wildcard handler
            pattern = event_type.replace("*", "")
            handlers = self._wildcard_handlers[pattern]
            handlers.append((priority.value, handler))
            handlers.sort(key=lambda x: x[0])  # Sort by priority
        else:
            # Exact match handler
            handlers = self._handlers[event_type]
            handlers.append((priority.value, handler))
            handlers.sort(key=lambda x: x[0])  # Sort by priority

        logger.debug(f"Registered handler for event type: {event_type}")

        def unregister():
            self.unregister(event_type, handler)

        return unregister

    def unregister(self, event_type: str, handler: EventHandler) -> bool:
        """
        Unregister an event handler.

        Args:
            event_type: Event type
            handler: Handler to remove

        Returns:
            True if handler was removed
        """
        if "*" in event_type:
            pattern = event_type.replace("*", "")
            handlers = self._wildcard_handlers.get(pattern, [])
            new_handlers = [(p, h) for p, h in handlers if h != handler]
            self._wildcard_handlers[pattern] = new_handlers
            heapq.heapify(new_handlers)
            return len(new_handlers) < len(handlers)
        else:
            handlers = self._handlers.get(event_type, [])
            new_handlers = [(p, h) for p, h in handlers if h != handler]
            self._handlers[event_type] = new_handlers
            heapq.heapify(new_handlers)
            return len(new_handlers) < len(handlers)

    def unregister_all(self, event_type: Optional[str] = None) -> None:
        """
        Unregister all handlers for an event type or all handlers.

        Args:
            event_type: Event type to clear, or None for all
        """
        if event_type is None:
            self._handlers.clear()
            self._wildcard_handlers.clear()
        elif "*" in event_type:
            self._wildcard_handlers.pop(event_type.replace("*", ""), None)
        else:
            self._handlers.pop(event_type, None)

    def add_filter(self, event_type: str, filter_func: Callable[[Event], bool]) -> None:
        """
        Add a filter for an event type.

        Args:
            event_type: Event type to filter
            filter_func: Function that returns True to allow the event
        """
        self._event_filters[event_type] = filter_func

    def remove_filter(self, event_type: str) -> None:
        """Remove filter for an event type."""
        self._event_filters.pop(event_type, None)

    def _matches_wildcard(self, event_type: str, pattern: str) -> bool:
        """Check if event type matches wildcard pattern."""
        return event_type.startswith(pattern.rstrip("*"))

    def _get_matching_handlers(
        self,
        event_type: str
    ) -> List[tuple[int, EventHandler]]:
        """Get all handlers matching an event type."""
        handlers = []

        # Get exact match handlers
        for priority, handler in self._handlers.get(event_type, []):
            handlers.append((priority, handler))

        # Get wildcard handlers
        for pattern, wildcard_handlers in self._wildcard_handlers.items():
            if self._matches_wildcard(event_type, pattern):
                handlers.extend(wildcard_handlers)

        # Sort by priority (lower value = higher priority)
        handlers.sort(key=lambda x: x[0])
        return handlers

    async def emit(
        self,
        event_type: str,
        data: Any = None,
        priority: Optional[EventPriority] = None,
        source: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        immediate: bool = False,
    ) -> List[Any]:
        """
        Emit an event to all registered handlers.

        Args:
            event_type: Type of event to emit
            data: Event data
            priority: Event priority
            source: Event source identifier
            metadata: Additional metadata
            immediate: If True, process immediately instead of queuing

        Returns:
            List of handler results
        """
        event = Event(
            type=event_type,
            data=data,
            priority=priority or self._default_priority,
            source=source,
            metadata=metadata or {},
        )

        # Apply filters
        if event_type in self._event_filters:
            if not self._event_filters[event_type](event):
                logger.debug(f"Event filtered: {event_type}")
                return []

        if immediate:
            return await self._process_event(event)
        else:
            async with self._lock:
                heapq.heappush(self._event_queue, event)
            return []

    async def emit_batch(
        self,
        events: List[Event],
        immediate: bool = False,
    ) -> List[List[Any]]:
        """
        Emit multiple events.

        Args:
            events: List of events to emit
            immediate: If True, process immediately

        Returns:
            List of handler results for each event
        """
        results = []
        for event in events:
            result = await self.emit(
                event.type,
                event.data,
                event.priority,
                event.source,
                event.metadata,
                immediate=immediate,
            )
            results.append(result)
        return results

    async def _process_event(self, event: Event) -> List[Any]:
        """
        Process a single event.

        Args:
            event: Event to process

        Returns:
            List of handler results
        """
        handlers = self._get_matching_handlers(event.type)

        if not handlers:
            logger.debug(f"No handlers for event: {event.type}")
            return []

        results = []
        for priority, handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    result = await handler(event)
                else:
                    result = handler(event)
                results.append(result)
            except Exception as e:
                logger.error(f"Handler error for {event.type}: {e}")
                await self._handle_handler_error(event, e)

        return results

    async def _handle_handler_error(self, event: Event, error: Exception) -> None:
        """
        Handle a handler error by adding to dead letter queue.

        Args:
            event: The event that caused the error
            error: The exception that occurred
        """
        dlq_entry = DeadLetterEvent(
            event=event,
            error=str(error),
            attempts=1,
            last_attempt=datetime.utcnow(),
        )

        self._dlq.append(dlq_entry)

        # Trim DLQ if too large
        if len(self._dlq) > self._max_dlq_size:
            self._dlq = self._dlq[-self._max_dlq_size:]

        logger.warning(f"Event added to DLQ: {event.type}")

    async def retry_dlq(self, max_attempts: Optional[int] = None) -> Dict[str, int]:
        """
        Retry events in the dead letter queue.

        Args:
            max_attempts: Maximum attempts (uses default if not specified)

        Returns:
            Statistics on retry results
        """
        stats = {"retried": 0, "succeeded": 0, "failed": 0, "removed": 0}
        max_retry = max_attempts or self._max_retry_attempts

        new_dlq = []
        for dlq_entry in self._dlq:
            if dlq_entry.attempts >= max_retry:
                stats["removed"] += 1
                continue

            dlq_entry.attempts += 1
            dlq_entry.last_attempt = datetime.utcnow()

            try:
                await self._process_event(dlq_entry.event)
                stats["succeeded"] += 1
                stats["retried"] += 1
            except Exception as e:
                logger.error(f"DLQ retry failed: {e}")
                new_dlq.append(dlq_entry)
                stats["failed"] += 1

        self._dlq = new_dlq
        return stats

    def get_dlq(self) -> List[DeadLetterEvent]:
        """Get all events in the dead letter queue."""
        return list(self._dlq)

    def clear_dlq(self) -> int:
        """
        Clear the dead letter queue.

        Returns:
            Number of events cleared
        """
        count = len(self._dlq)
        self._dlq.clear()
        return count

    def get_dlq_size(self) -> int:
        """Get the current size of the dead letter queue."""
        return len(self._dlq)

    async def process_queue(self, max_events: Optional[int] = None) -> int:
        """
        Process queued events.

        Args:
            max_events: Maximum events to process (None for all)

        Returns:
            Number of events processed
        """
        if self._processing:
            return 0

        self._processing = True
        processed = 0

        try:
            while self._event_queue:
                if max_events is not None and processed >= max_events:
                    break

                async with self._lock:
                    if not self._event_queue:
                        break
                    event = heapq.heappop(self._event_queue)

                await self._process_event(event)
                processed += 1
        finally:
            self._processing = False

        return processed

    def get_queue_size(self) -> int:
        """Get the current event queue size."""
        return len(self._event_queue)

    def get_handler_count(self, event_type: Optional[str] = None) -> int:
        """
        Get the number of registered handlers.

        Args:
            event_type: Event type to count, or None for all

        Returns:
            Number of handlers
        """
        if event_type:
            count = len(self._handlers.get(event_type, []))
            for pattern in self._wildcard_handlers:
                if self._matches_wildcard(event_type, pattern):
                    count += len(self._wildcard_handlers[pattern])
            return count
        else:
            return sum(len(h) for h in self._handlers.values()) + sum(
                len(h) for h in self._wildcard_handlers.values()
            )


# Global event dispatcher instance
_event_dispatcher: Optional[EventDispatcher] = None


def get_dispatcher() -> EventDispatcher:
    """Get the global event dispatcher instance."""
    global _event_dispatcher
    if _event_dispatcher is None:
        _event_dispatcher = EventDispatcher()
    return _event_dispatcher


def set_dispatcher(dispatcher: EventDispatcher) -> None:
    """Set the global event dispatcher instance."""
    global _event_dispatcher
    _event_dispatcher = dispatcher


@asynccontextmanager
async def event_scope():
    """
    Context manager for event processing scope.

    Yields the global dispatcher and processes queue on exit.
    """
    dispatcher = get_dispatcher()
    yield dispatcher
    await dispatcher.process_queue()
