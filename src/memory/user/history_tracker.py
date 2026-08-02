"""
History Tracker - Tracks and manages user interaction history.

Provides comprehensive history tracking for:
- Conversation history
- Story interactions
- Feature usage
- Engagement metrics
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import uuid
import json


class HistoryEventType(str, Enum):
    """Types of history events."""
    CONVERSATION_START = "conversation_start"
    CONVERSATION_END = "conversation_end"
    MESSAGE_SENT = "message_sent"
    MESSAGE_RECEIVED = "message_received"
    STORY_STARTED = "story_started"
    STORY_COMPLETED = "story_completed"
    STORY_SHARED = "story_shared"
    FEATURE_USED = "feature_used"
    SETTING_CHANGED = "setting_changed"
    LOGIN = "login"
    LOGOUT = "logout"
    PROFILE_UPDATED = "profile_updated"


@dataclass
class HistoryEvent:
    """A single history event."""
    
    id: str
    event_type: HistoryEventType
    timestamp: datetime
    data: Dict[str, Any]
    duration_ms: Optional[int] = None
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None
    story_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "id": self.id,
            "event_type": self.event_type.value if isinstance(self.event_type, Enum) else self.event_type,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
            "duration_ms": self.duration_ms,
            "session_id": self.session_id,
            "conversation_id": self.conversation_id,
            "story_id": self.story_id,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "HistoryEvent":
        """Create event from dictionary."""
        event_type = data.get("event_type")
        if isinstance(event_type, str):
            event_type = HistoryEventType(event_type)
        
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            event_type=event_type,
            timestamp=datetime.fromisoformat(data["timestamp"]) if isinstance(data["timestamp"], str) else data["timestamp"],
            data=data.get("data", {}),
            duration_ms=data.get("duration_ms"),
            session_id=data.get("session_id"),
            conversation_id=data.get("conversation_id"),
            story_id=data.get("story_id"),
        )


@dataclass
class SessionSummary:
    """Summary of a user session."""
    
    session_id: str
    start_time: datetime
    end_time: Optional[datetime]
    message_count: int
    conversation_count: int
    stories_started: int
    stories_completed: int
    average_response_time_ms: float
    active_duration_minutes: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert summary to dictionary."""
        return {
            "session_id": self.session_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "message_count": self.message_count,
            "conversation_count": self.conversation_count,
            "stories_started": self.stories_started,
            "stories_completed": self.stories_completed,
            "average_response_time_ms": self.average_response_time_ms,
            "active_duration_minutes": self.active_duration_minutes,
        }


@dataclass
class EngagementMetrics:
    """User engagement metrics."""
    
    user_id: str
    total_sessions: int
    total_conversations: int
    total_messages: int
    total_stories: int
    stories_completed: int
    avg_session_duration_minutes: float
    messages_per_day: float
    stories_per_week: float
    most_active_hour: int
    favorite_features: List[str]
    favorite_topics: List[str]
    period_start: datetime
    period_end: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary."""
        return {
            "user_id": self.user_id,
            "total_sessions": self.total_sessions,
            "total_conversations": self.total_conversations,
            "total_messages": self.total_messages,
            "total_stories": self.total_stories,
            "stories_completed": self.stories_completed,
            "avg_session_duration_minutes": self.avg_session_duration_minutes,
            "messages_per_day": self.messages_per_day,
            "stories_per_week": self.stories_per_week,
            "most_active_hour": self.most_active_hour,
            "favorite_features": self.favorite_features,
            "favorite_topics": self.favorite_topics,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
        }


class HistoryTracker:
    """
    Tracks user interaction history and computes engagement metrics.
    
    Provides:
    - Event tracking
    - Session management
    - Engagement metrics
    - History queries
    """
    
    def __init__(self, max_events_per_user: int = 10000):
        """
        Initialize history tracker.
        
        Args:
            max_events_per_user: Maximum events to store per user
        """
        self._events: Dict[str, List[HistoryEvent]] = {}
        self._sessions: Dict[str, List[SessionSummary]] = {}
        self._max_events = max_events_per_user
        self._event_listeners: List[Callable[[str, HistoryEvent], None]] = []
    
    def track_event(
        self,
        user_id: str,
        event_type: HistoryEventType,
        data: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[int] = None,
        session_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        story_id: Optional[str] = None,
        timestamp: Optional[datetime] = None,
    ) -> str:
        """
        Track a history event.
        
        Args:
            user_id: User identifier
            event_type: Type of event
            data: Event data
            duration_ms: Event duration in milliseconds
            session_id: Optional session identifier
            conversation_id: Optional conversation identifier
            story_id: Optional story identifier
            timestamp: Optional event timestamp
            
        Returns:
            Event ID
        """
        event = HistoryEvent(
            id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=timestamp or datetime.utcnow(),
            data=data or {},
            duration_ms=duration_ms,
            session_id=session_id,
            conversation_id=conversation_id,
            story_id=story_id,
        )
        
        if user_id not in self._events:
            self._events[user_id] = []
        
        self._events[user_id].append(event)
        
        # Trim old events if needed
        if len(self._events[user_id]) > self._max_events:
            self._events[user_id] = self._events[user_id][-self._max_events:]
        
        # Notify listeners
        for listener in self._event_listeners:
            listener(user_id, event)
        
        return event.id
    
    def get_events(
        self,
        user_id: str,
        event_type: Optional[HistoryEventType] = None,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
        conversation_id: Optional[str] = None,
        story_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[HistoryEvent]:
        """
        Get history events.
        
        Args:
            user_id: User identifier
            event_type: Optional filter by event type
            since: Optional start time filter
            until: Optional end time filter
            conversation_id: Optional filter by conversation
            story_id: Optional filter by story
            limit: Maximum number of events to return
            
        Returns:
            List of history events
        """
        if user_id not in self._events:
            return []
        
        events = self._events[user_id]
        
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        
        if since:
            events = [e for e in events if e.timestamp >= since]
        
        if until:
            events = [e for e in events if e.timestamp <= until]
        
        if conversation_id:
            events = [e for e in events if e.conversation_id == conversation_id]
        
        if story_id:
            events = [e for e in events if e.story_id == story_id]
        
        return events[-limit:]
    
    def get_conversation_history(
        self,
        user_id: str,
        conversation_id: str,
        limit: int = 100,
    ) -> List[HistoryEvent]:
        """
        Get conversation history.
        
        Args:
            user_id: User identifier
            conversation_id: Conversation identifier
            limit: Maximum number of events
            
        Returns:
            List of conversation events
        """
        return self.get_events(
            user_id,
            conversation_id=conversation_id,
            limit=limit,
        )
    
    def get_story_history(
        self,
        user_id: str,
        story_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[HistoryEvent]:
        """
        Get story-related history.
        
        Args:
            user_id: User identifier
            story_id: Optional specific story
            limit: Maximum number of events
            
        Returns:
            List of story events
        """
        story_events = [
            HistoryEventType.STORY_STARTED,
            HistoryEventType.STORY_COMPLETED,
            HistoryEventType.STORY_SHARED,
        ]
        
        events = []
        for event_type in story_events:
            events.extend(self.get_events(
                user_id,
                event_type=event_type,
                story_id=story_id,
                limit=limit,
            ))
        
        # Sort by timestamp
        events.sort(key=lambda e: e.timestamp, reverse=True)
        
        return events[:limit]
    
    def compute_engagement_metrics(
        self,
        user_id: str,
        period_days: int = 30,
    ) -> EngagementMetrics:
        """
        Compute user engagement metrics.
        
        Args:
            user_id: User identifier
            period_days: Number of days to analyze
            
        Returns:
            Engagement metrics
        """
        now = datetime.utcnow()
        period_start = now - timedelta(days=period_days)
        
        events = self.get_events(user_id, since=period_start, limit=self._max_events)
        
        # Count events by type
        event_counts: Dict[str, int] = {}
        message_times: List[int] = []
        active_hours: Dict[int, int] = {}
        feature_usage: Dict[str, int] = {}
        topic_mentions: Dict[str, int] = {}
        
        for event in events:
            event_type = event.event_type.value if isinstance(event.event_type, Enum) else str(event.event_type)
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
            
            # Track response times
            if event.duration_ms:
                message_times.append(event.duration_ms)
            
            # Track active hours
            hour = event.timestamp.hour
            active_hours[hour] = active_hours.get(hour, 0) + 1
            
            # Track feature usage
            if event.data.get("feature"):
                feature = event.data["feature"]
                feature_usage[feature] = feature_usage.get(feature, 0) + 1
            
            # Track topic mentions
            if event.data.get("topics"):
                for topic in event.data["topics"]:
                    topic_mentions[topic] = topic_mentions.get(topic, 0) + 1
        
        # Get favorite features and topics
        favorite_features = sorted(
            feature_usage.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        favorite_topics = sorted(
            topic_mentions.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # Calculate most active hour
        most_active_hour = max(active_hours.items(), key=lambda x: x[1])[0] if active_hours else 12
        
        # Calculate metrics
        avg_response_time = sum(message_times) / len(message_times) if message_times else 0
        
        # Calculate session statistics
        sessions = self.get_sessions(user_id, since=period_start)
        total_session_duration = sum(s.active_duration_minutes for s in sessions) if sessions else 0
        avg_session_duration = total_session_duration / len(sessions) if sessions else 0
        
        # Calculate daily/weekly rates
        messages_per_day = event_counts.get(HistoryEventType.MESSAGE_SENT.value, 0) / period_days
        stories_per_week = event_counts.get(HistoryEventType.STORY_COMPLETED.value, 0) / (period_days / 7)
        
        return EngagementMetrics(
            user_id=user_id,
            total_sessions=len(sessions),
            total_conversations=event_counts.get(HistoryEventType.CONVERSATION_END.value, 0),
            total_messages=event_counts.get(HistoryEventType.MESSAGE_SENT.value, 0),
            total_stories=event_counts.get(HistoryEventType.STORY_STARTED.value, 0),
            stories_completed=event_counts.get(HistoryEventType.STORY_COMPLETED.value, 0),
            avg_session_duration_minutes=avg_session_duration,
            messages_per_day=messages_per_day,
            stories_per_week=stories_per_week,
            most_active_hour=most_active_hour,
            favorite_features=[f[0] for f in favorite_features],
            favorite_topics=[t[0] for t in favorite_topics],
            period_start=period_start,
            period_end=now,
        )
    
    def get_sessions(
        self,
        user_id: str,
        since: Optional[datetime] = None,
        limit: int = 50,
    ) -> List[SessionSummary]:
        """
        Get user sessions.
        
        Args:
            user_id: User identifier
            since: Optional start time filter
            limit: Maximum number of sessions
            
        Returns:
            List of session summaries
        """
        if user_id not in self._sessions:
            return []
        
        sessions = self._sessions[user_id]
        
        if since:
            sessions = [s for s in sessions if s.start_time >= since]
        
        return sorted(sessions, key=lambda s: s.start_time, reverse=True)[:limit]
    
    def add_session(self, session: SessionSummary) -> None:
        """
        Add a completed session.
        
        Args:
            session: Session summary
        """
        user_id = getattr(session, 'user_id', None)
        if not user_id:
            return
        
        if user_id not in self._sessions:
            self._sessions[user_id] = []
        
        self._sessions[user_id].append(session)
        
        # Limit stored sessions
        max_sessions = 1000
        if len(self._sessions[user_id]) > max_sessions:
            self._sessions[user_id] = self._sessions[user_id][-max_sessions:]
    
    def add_event_listener(
        self,
        listener: Callable[[str, HistoryEvent], None]
    ) -> None:
        """
        Add an event listener.
        
        Args:
            listener: Callback function
        """
        self._event_listeners.append(listener)
    
    def clear_history(self, user_id: str) -> None:
        """
        Clear all history for a user.
        
        Args:
            user_id: User identifier
        """
        if user_id in self._events:
            self._events[user_id] = []
        
        if user_id in self._sessions:
            self._sessions[user_id] = []
    
    def export_history(self, user_id: str) -> str:
        """
        Export user history as JSON.
        
        Args:
            user_id: User identifier
            
        Returns:
            JSON string of history
        """
        events = [e.to_dict() for e in self.get_events(user_id, limit=self._max_events)]
        sessions = [s.to_dict() for s in self.get_sessions(user_id, limit=1000)]
        
        return json.dumps({
            "events": events,
            "sessions": sessions,
            "exported_at": datetime.utcnow().isoformat(),
        })
    
    def import_history(
        self,
        user_id: str,
        history_json: str,
        merge: bool = True,
    ) -> bool:
        """
        Import user history from JSON.
        
        Args:
            user_id: User identifier
            history_json: JSON string of history
            merge: Whether to merge with existing history
            
        Returns:
            True if import was successful
        """
        try:
            data = json.loads(history_json)
            
            if not merge:
                self.clear_history(user_id)
            
            # Import events
            for event_data in data.get("events", []):
                event = HistoryEvent.from_dict(event_data)
                if user_id not in self._events:
                    self._events[user_id] = []
                self._events[user_id].append(event)
            
            # Trim if over max
            if user_id in self._events and len(self._events[user_id]) > self._max_events:
                self._events[user_id] = self._events[user_id][-self._max_events:]
            
            return True
        except (json.JSONDecodeError, TypeError, KeyError):
            return False
