"""
User Memory - Main module for user preference and profile management.

This module handles:
- Preference storage
- History tracking
- Profile data
- Settings management
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
import uuid


class PreferenceCategory(str, Enum):
    """Categories for user preferences."""
    CONVERSATION = "conversation"
    VISUAL = "visual"
    AUDIO = "audio"
    NOTIFICATION = "notification"
    PRIVACY = "privacy"
    STORYTELLING = "storytelling"
    PERSONALITY = "personality"


class ThemeMode(str, Enum):
    """Theme mode options."""
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


@dataclass
class UserPreferences:
    """User preferences container."""
    
    # Conversation preferences
    conversation_style: str = "friendly"  # friendly, formal, playful
    response_length: str = "medium"  # short, medium, long
    humor_level: float = 0.5  # 0-1 scale
    topics_interest: List[str] = field(default_factory=list)
    topics_avoid: List[str] = field(default_factory=list)
    
    # Visual preferences
    theme_mode: ThemeMode = ThemeMode.SYSTEM
    animation_speed: float = 1.0  # 0.5-2.0 multiplier
    show_expressions: bool = True
    
    # Audio preferences
    sound_enabled: bool = True
    sound_volume: float = 0.7  # 0-1
    typing_sounds: bool = True
    
    # Notification preferences
    notifications_enabled: bool = True
    notification_sound: bool = True
    message_preview: bool = True
    
    # Privacy preferences
    share_stories_publicly: bool = False
    allow_analytics: bool = True
    
    # Storytelling preferences
    story_genre_preferences: List[str] = field(default_factory=list)
    story_length_preference: str = "medium"  # short, medium, long
    story_pacing: str = "balanced"  # fast, balanced, slow
    
    # Personality preferences
    companion_personality: str = "caring"  # caring, witty, adventurous
    emotional_expressiveness: float = 0.7  # 0-1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert preferences to dictionary."""
        return {
            "conversation_style": self.conversation_style,
            "response_length": self.response_length,
            "humor_level": self.humor_level,
            "topics_interest": self.topics_interest,
            "topics_avoid": self.topics_avoid,
            "theme_mode": self.theme_mode.value if isinstance(self.theme_mode, Enum) else self.theme_mode,
            "animation_speed": self.animation_speed,
            "show_expressions": self.show_expressions,
            "sound_enabled": self.sound_enabled,
            "sound_volume": self.sound_volume,
            "typing_sounds": self.typing_sounds,
            "notifications_enabled": self.notifications_enabled,
            "notification_sound": self.notification_sound,
            "message_preview": self.message_preview,
            "share_stories_publicly": self.share_stories_publicly,
            "allow_analytics": self.allow_analytics,
            "story_genre_preferences": self.story_genre_preferences,
            "story_length_preference": self.story_length_preference,
            "story_pacing": self.story_pacing,
            "companion_personality": self.companion_personality,
            "emotional_expressiveness": self.emotional_expressiveness,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserPreferences":
        """Create preferences from dictionary."""
        if data is None:
            return cls()
        
        theme_mode = data.get("theme_mode", "system")
        if isinstance(theme_mode, str):
            theme_mode = ThemeMode(theme_mode.lower())
        
        return cls(
            conversation_style=data.get("conversation_style", "friendly"),
            response_length=data.get("response_length", "medium"),
            humor_level=data.get("humor_level", 0.5),
            topics_interest=data.get("topics_interest", []),
            topics_avoid=data.get("topics_avoid", []),
            theme_mode=theme_mode,
            animation_speed=data.get("animation_speed", 1.0),
            show_expressions=data.get("show_expressions", True),
            sound_enabled=data.get("sound_enabled", True),
            sound_volume=data.get("sound_volume", 0.7),
            typing_sounds=data.get("typing_sounds", True),
            notifications_enabled=data.get("notifications_enabled", True),
            notification_sound=data.get("notification_sound", True),
            message_preview=data.get("message_preview", True),
            share_stories_publicly=data.get("share_stories_publicly", False),
            allow_analytics=data.get("allow_analytics", True),
            story_genre_preferences=data.get("story_genre_preferences", []),
            story_length_preference=data.get("story_length_preference", "medium"),
            story_pacing=data.get("story_pacing", "balanced"),
            companion_personality=data.get("companion_personality", "caring"),
            emotional_expressiveness=data.get("emotional_expressiveness", 0.7),
        )


@dataclass
class UserSettings:
    """User settings container."""
    
    # Account settings
    email_notifications: bool = True
    language: str = "en"
    timezone: str = "UTC"
    
    # Display settings
    font_size: str = "medium"  # small, medium, large
    compact_mode: bool = False
    show_avatars: bool = True
    
    # Privacy settings
    read_receipts: bool = True
    online_status: bool = True
    data_retention_days: int = 365
    
    # Accessibility settings
    screen_reader_mode: bool = False
    high_contrast: bool = False
    reduced_motion: bool = False
    
    # Advanced settings
    max_context_messages: int = 50
    auto_save_conversations: bool = True
    experimental_features: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert settings to dictionary."""
        return {
            "email_notifications": self.email_notifications,
            "language": self.language,
            "timezone": self.timezone,
            "font_size": self.font_size,
            "compact_mode": self.compact_mode,
            "show_avatars": self.show_avatars,
            "read_receipts": self.read_receipts,
            "online_status": self.online_status,
            "data_retention_days": self.data_retention_days,
            "screen_reader_mode": self.screen_reader_mode,
            "high_contrast": self.high_contrast,
            "reduced_motion": self.reduced_motion,
            "max_context_messages": self.max_context_messages,
            "auto_save_conversations": self.auto_save_conversations,
            "experimental_features": self.experimental_features,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserSettings":
        """Create settings from dictionary."""
        if data is None:
            return cls()
        
        return cls(
            email_notifications=data.get("email_notifications", True),
            language=data.get("language", "en"),
            timezone=data.get("timezone", "UTC"),
            font_size=data.get("font_size", "medium"),
            compact_mode=data.get("compact_mode", False),
            show_avatars=data.get("show_avatars", True),
            read_receipts=data.get("read_receipts", True),
            online_status=data.get("online_status", True),
            data_retention_days=data.get("data_retention_days", 365),
            screen_reader_mode=data.get("screen_reader_mode", False),
            high_contrast=data.get("high_contrast", False),
            reduced_motion=data.get("reduced_motion", False),
            max_context_messages=data.get("max_context_messages", 50),
            auto_save_conversations=data.get("auto_save_conversations", True),
            experimental_features=data.get("experimental_features", False),
        )


@dataclass
class UserProfile:
    """User profile data."""
    
    user_id: uuid.UUID
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Computed profile data
    total_conversations: int = 0
    total_stories: int = 0
    favorite_stories: int = 0
    member_since: Optional[datetime] = None
    last_active: Optional[datetime] = None
    
    # Engagement metrics
    avg_session_duration_minutes: float = 0.0
    messages_per_day: float = 0.0
    stories_per_week: float = 0.0
    
    # Interaction patterns
    favorite_topics: List[str] = field(default_factory=list)
    most_used_features: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to dictionary."""
        return {
            "user_id": str(self.user_id),
            "display_name": self.display_name,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "total_conversations": self.total_conversations,
            "total_stories": self.total_stories,
            "favorite_stories": self.favorite_stories,
            "member_since": self.member_since.isoformat() if self.member_since else None,
            "last_active": self.last_active.isoformat() if self.last_active else None,
            "avg_session_duration_minutes": self.avg_session_duration_minutes,
            "messages_per_day": self.messages_per_day,
            "stories_per_week": self.stories_per_week,
            "favorite_topics": self.favorite_topics,
            "most_used_features": self.most_used_features,
        }


class UserMemory:
    """
    User Memory manager for storing and retrieving user preferences and profile data.
    
    This class provides a high-level interface for:
    - Preference storage and retrieval
    - History tracking
    - Profile data management
    - Settings management
    """
    
    def __init__(
        self,
        db_session=None,  # Optional database session for persistence
    ):
        """
        Initialize User Memory.
        
        Args:
            db_session: Optional database session for persistence
        """
        self._db_session = db_session
        self._preferences: Dict[str, UserPreferences] = {}
        self._settings: Dict[str, UserSettings] = {}
        self._profiles: Dict[str, UserProfile] = {}
        self._history: Dict[str, List[Dict]] = {}
    
    def get_preferences(self, user_id: str) -> UserPreferences:
        """
        Get user preferences.
        
        Args:
            user_id: User identifier
            
        Returns:
            UserPreferences object
        """
        if user_id not in self._preferences:
            self._preferences[user_id] = UserPreferences()
            
            # Load from database if session available
            if self._db_session:
                self._load_preferences_from_db(user_id)
        
        return self._preferences[user_id]
    
    def set_preferences(self, user_id: str, preferences: UserPreferences) -> None:
        """
        Set user preferences.
        
        Args:
            user_id: User identifier
            preferences: UserPreferences object
        """
        self._preferences[user_id] = preferences
        
        # Persist to database if session available
        if self._db_session:
            self._save_preferences_to_db(user_id, preferences)
    
    def update_preference(
        self,
        user_id: str,
        key: str,
        value: Any,
        category: Optional[PreferenceCategory] = None
    ) -> None:
        """
        Update a single preference.
        
        Args:
            user_id: User identifier
            key: Preference key
            value: New value
            category: Optional preference category
        """
        preferences = self.get_preferences(user_id)
        
        if hasattr(preferences, key):
            setattr(preferences, key, value)
            self.set_preferences(user_id, preferences)
    
    def get_settings(self, user_id: str) -> UserSettings:
        """
        Get user settings.
        
        Args:
            user_id: User identifier
            
        Returns:
            UserSettings object
        """
        if user_id not in self._settings:
            self._settings[user_id] = UserSettings()
            
            # Load from database if session available
            if self._db_session:
                self._load_settings_from_db(user_id)
        
        return self._settings[user_id]
    
    def set_settings(self, user_id: str, settings: UserSettings) -> None:
        """
        Set user settings.
        
        Args:
            user_id: User identifier
            settings: UserSettings object
        """
        self._settings[user_id] = settings
        
        # Persist to database if session available
        if self._db_session:
            self._save_settings_to_db(user_id, settings)
    
    def get_profile(self, user_id: str) -> UserProfile:
        """
        Get user profile.
        
        Args:
            user_id: User identifier
            
        Returns:
            UserProfile object
        """
        if user_id not in self._profiles:
            profile = UserProfile(user_id=uuid.UUID(user_id))
            
            # Load from database if session available
            if self._db_session:
                self._load_profile_from_db(user_id)
            else:
                self._profiles[user_id] = profile
        
        return self._profiles.get(user_id, UserProfile(user_id=uuid.UUID(user_id)))
    
    def update_profile(self, user_id: str, profile: UserProfile) -> None:
        """
        Update user profile.
        
        Args:
            user_id: User identifier
            profile: UserProfile object
        """
        profile.user_id = uuid.UUID(user_id)
        self._profiles[user_id] = profile
        
        # Persist to database if session available
        if self._db_session:
            self._save_profile_to_db(user_id, profile)
    
    def add_history_entry(
        self,
        user_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        timestamp: Optional[datetime] = None
    ) -> None:
        """
        Add a history entry.
        
        Args:
            user_id: User identifier
            event_type: Type of event
            event_data: Event data
            timestamp: Optional timestamp (defaults to now)
        """
        if user_id not in self._history:
            self._history[user_id] = []
        
        entry = {
            "type": event_type,
            "data": event_data,
            "timestamp": timestamp or datetime.utcnow(),
            "id": str(uuid.uuid4()),
        }
        
        self._history[user_id].append(entry)
        
        # Limit history size
        max_history = 1000
        if len(self._history[user_id]) > max_history:
            self._history[user_id] = self._history[user_id][-max_history:]
        
        # Persist to database if session available
        if self._db_session:
            self._save_history_to_db(user_id, entry)
    
    def get_history(
        self,
        user_id: str,
        event_type: Optional[str] = None,
        limit: int = 100,
        since: Optional[datetime] = None
    ) -> List[Dict]:
        """
        Get user history.
        
        Args:
            user_id: User identifier
            event_type: Optional filter by event type
            limit: Maximum number of entries to return
            since: Optional filter by timestamp
            
        Returns:
            List of history entries
        """
        history = self._history.get(user_id, [])
        
        if event_type:
            history = [h for h in history if h["type"] == event_type]
        
        if since:
            history = [h for h in history if h["timestamp"] >= since]
        
        return history[-limit:]
    
    def clear_history(self, user_id: str) -> None:
        """
        Clear user history.
        
        Args:
            user_id: User identifier
        """
        self._history[user_id] = []
        
        if self._db_session:
            self._clear_history_in_db(user_id)
    
    # Database integration methods (optional)
    
    def _load_preferences_from_db(self, user_id: str) -> None:
        """Load preferences from database."""
        # This would load from the Memory model in the database
        pass
    
    def _save_preferences_to_db(self, user_id: str, preferences: UserPreferences) -> None:
        """Save preferences to database."""
        # This would save to the Memory model in the database
        pass
    
    def _load_settings_from_db(self, user_id: str) -> None:
        """Load settings from database."""
        pass
    
    def _save_settings_to_db(self, user_id: str, settings: UserSettings) -> None:
        """Save settings to database."""
        pass
    
    def _load_profile_from_db(self, user_id: str) -> None:
        """Load profile from database."""
        pass
    
    def _save_profile_to_db(self, user_id: str, profile: UserProfile) -> None:
        """Save profile to database."""
        pass
    
    def _save_history_to_db(self, user_id: str, entry: Dict) -> None:
        """Save history entry to database."""
        pass
    
    def _clear_history_in_db(self, user_id: str) -> None:
        """Clear history in database."""
        pass
