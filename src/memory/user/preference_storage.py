"""
Preference Storage - Handles storage and retrieval of user preferences.

Provides persistent storage for user preferences with support for:
- Categorized preferences
- Default values
- Preference validation
- Preference migration
"""

from typing import Dict, List, Optional, Any, Callable, Type
from dataclasses import dataclass
from datetime import datetime
import json
import uuid


@dataclass
class PreferenceDefinition:
    """Definition of a preference including metadata."""
    
    key: str
    preference_type: Type
    default_value: Any
    category: str
    description: str = ""
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    choices: Optional[List[Any]] = None
    validator: Optional[Callable[[Any], bool]] = None


class PreferenceStorage:
    """
    Storage engine for user preferences.
    
    Provides:
    - Type-safe preference storage
    - Default value handling
    - Validation
    - Change tracking
    - Export/Import functionality
    """
    
    # Built-in preference definitions
    BUILTIN_PREFERENCES: List[PreferenceDefinition] = [
        PreferenceDefinition(
            key="conversation_style",
            preference_type=str,
            default_value="friendly",
            category="conversation",
            choices=["friendly", "formal", "playful"],
            description="Preferred conversation style"
        ),
        PreferenceDefinition(
            key="response_length",
            preference_type=str,
            default_value="medium",
            category="conversation",
            choices=["short", "medium", "long"],
            description="Preferred response length"
        ),
        PreferenceDefinition(
            key="humor_level",
            preference_type=float,
            default_value=0.5,
            category="conversation",
            min_value=0.0,
            max_value=1.0,
            description="Amount of humor in responses (0-1)"
        ),
        PreferenceDefinition(
            key="theme_mode",
            preference_type=str,
            default_value="system",
            category="visual",
            choices=["light", "dark", "system"],
            description="Theme mode"
        ),
        PreferenceDefinition(
            key="animation_speed",
            preference_type=float,
            default_value=1.0,
            category="visual",
            min_value=0.5,
            max_value=2.0,
            description="Animation speed multiplier"
        ),
        PreferenceDefinition(
            key="sound_enabled",
            preference_type=bool,
            default_value=True,
            category="audio",
            description="Enable sound effects"
        ),
        PreferenceDefinition(
            key="sound_volume",
            preference_type=float,
            default_value=0.7,
            category="audio",
            min_value=0.0,
            max_value=1.0,
            description="Sound volume level"
        ),
        PreferenceDefinition(
            key="notifications_enabled",
            preference_type=bool,
            default_value=True,
            category="notification",
            description="Enable notifications"
        ),
        PreferenceDefinition(
            key="share_stories_publicly",
            preference_type=bool,
            default_value=False,
            category="privacy",
            description="Share stories publicly"
        ),
        PreferenceDefinition(
            key="companion_personality",
            preference_type=str,
            default_value="caring",
            category="personality",
            choices=["caring", "witty", "adventurous"],
            description="Companion personality type"
        ),
        PreferenceDefinition(
            key="emotional_expressiveness",
            preference_type=float,
            default_value=0.7,
            category="personality",
            min_value=0.0,
            max_value=1.0,
            description="Emotional expressiveness level"
        ),
    ]
    
    def __init__(self):
        """Initialize preference storage."""
        self._definitions: Dict[str, PreferenceDefinition] = {
            p.key: p for p in self.BUILTIN_PREFERENCES
        }
        self._preferences: Dict[str, Dict[str, Any]] = {}
        self._change_listeners: Dict[str, List[Callable[[str, Any], None]]] = {}
        self._history: Dict[str, List[Dict]] = {}
    
    def register_preference(self, definition: PreferenceDefinition) -> None:
        """
        Register a new preference definition.
        
        Args:
            definition: Preference definition
        """
        self._definitions[definition.key] = definition
    
    def get_preference(
        self,
        user_id: str,
        key: str,
        default: Optional[Any] = None
    ) -> Any:
        """
        Get a preference value.
        
        Args:
            user_id: User identifier
            key: Preference key
            default: Default value if not found
            
        Returns:
            Preference value
        """
        if user_id not in self._preferences:
            self._preferences[user_id] = {}
        
        if key in self._preferences[user_id]:
            return self._preferences[user_id][key]
        
        # Return default from definition or provided default
        if key in self._definitions:
            return self._definitions[key].default_value
        
        return default
    
    def set_preference(
        self,
        user_id: str,
        key: str,
        value: Any,
        track_change: bool = True
    ) -> bool:
        """
        Set a preference value.
        
        Args:
            user_id: User identifier
            key: Preference key
            value: New value
            track_change: Whether to track the change in history
            
        Returns:
            True if value was set, False if validation failed
        """
        # Validate the value
        if not self._validate_preference(key, value):
            return False
        
        if user_id not in self._preferences:
            self._preferences[user_id] = {}
        
        old_value = self._preferences[user_id].get(key)
        self._preferences[user_id][key] = value
        
        # Track change in history
        if track_change:
            self._track_change(user_id, key, old_value, value)
        
        # Notify listeners
        self._notify_change(user_id, key, value)
        
        return True
    
    def get_all_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Get all preferences for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dictionary of all preferences with defaults applied
        """
        result = {}
        
        for key, definition in self._definitions.items():
            result[key] = self.get_preference(user_id, key)
        
        # Add any custom preferences
        if user_id in self._preferences:
            for key, value in self._preferences[user_id].items():
                if key not in result:
                    result[key] = value
        
        return result
    
    def set_all_preferences(
        self,
        user_id: str,
        preferences: Dict[str, Any]
    ) -> Dict[str, bool]:
        """
        Set multiple preferences at once.
        
        Args:
            user_id: User identifier
            preferences: Dictionary of preferences to set
            
        Returns:
            Dictionary of keys to success/failure status
        """
        results = {}
        
        for key, value in preferences.items():
            results[key] = self.set_preference(user_id, key, value)
        
        return results
    
    def reset_preference(self, user_id: str, key: str) -> bool:
        """
        Reset a preference to its default value.
        
        Args:
            user_id: User identifier
            key: Preference key
            
        Returns:
            True if reset was successful
        """
        if key not in self._definitions:
            return False
        
        default_value = self._definitions[key].default_value
        return self.set_preference(user_id, key, default_value)
    
    def reset_all_preferences(self, user_id: str) -> None:
        """
        Reset all preferences to defaults.
        
        Args:
            user_id: User identifier
        """
        if user_id in self._preferences:
            del self._preferences[user_id]
    
    def get_preference_history(
        self,
        user_id: str,
        key: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Get preference change history.
        
        Args:
            user_id: User identifier
            key: Optional specific preference key
            limit: Maximum number of entries
            
        Returns:
            List of history entries
        """
        if user_id not in self._history:
            return []
        
        history = self._history[user_id]
        
        if key:
            history = [h for h in history if h["key"] == key]
        
        return history[-limit:]
    
    def add_change_listener(
        self,
        key: str,
        listener: Callable[[str, Any], None]
    ) -> None:
        """
        Add a listener for preference changes.
        
        Args:
            key: Preference key to listen to (use "*" for all)
            listener: Callback function
        """
        if key not in self._change_listeners:
            self._change_listeners[key] = []
        
        self._change_listeners[key].append(listener)
    
    def export_preferences(self, user_id: str) -> str:
        """
        Export preferences as JSON string.
        
        Args:
            user_id: User identifier
            
        Returns:
            JSON string of preferences
        """
        return json.dumps(self.get_all_preferences(user_id))
    
    def import_preferences(
        self,
        user_id: str,
        preferences_json: str,
        merge: bool = True
    ) -> bool:
        """
        Import preferences from JSON string.
        
        Args:
            user_id: User identifier
            preferences_json: JSON string of preferences
            merge: Whether to merge with existing or replace
            
        Returns:
            True if import was successful
        """
        try:
            imported = json.loads(preferences_json)
            
            if not merge:
                self.reset_all_preferences(user_id)
            
            return all(
                self.set_preference(user_id, key, value, track_change=False)
                for key, value in imported.items()
            )
        except (json.JSONDecodeError, TypeError):
            return False
    
    def _validate_preference(self, key: str, value: Any) -> bool:
        """
        Validate a preference value.
        
        Args:
            key: Preference key
            value: Value to validate
            
        Returns:
            True if valid
        """
        if key not in self._definitions:
            # Allow custom preferences
            return True
        
        definition = self._definitions[key]
        
        # Check type
        if definition.preference_type != Any and not isinstance(value, definition.preference_type):
            return False
        
        # Check choices
        if definition.choices and value not in definition.choices:
            return False
        
        # Check range for numeric types
        if definition.min_value is not None and value < definition.min_value:
            return False
        
        if definition.max_value is not None and value > definition.max_value:
            return False
        
        # Check custom validator
        if definition.validator and not definition.validator(value):
            return False
        
        return True
    
    def _track_change(
        self,
        user_id: str,
        key: str,
        old_value: Any,
        new_value: Any
    ) -> None:
        """Track a preference change in history."""
        if user_id not in self._history:
            self._history[user_id] = []
        
        self._history[user_id].append({
            "key": key,
            "old_value": old_value,
            "new_value": new_value,
            "timestamp": datetime.utcnow().isoformat(),
            "id": str(uuid.uuid4()),
        })
        
        # Limit history size
        max_history = 500
        if len(self._history[user_id]) > max_history:
            self._history[user_id] = self._history[user_id][-max_history:]
    
    def _notify_change(self, user_id: str, key: str, value: Any) -> None:
        """Notify listeners of a preference change."""
        # Notify key-specific listeners
        if key in self._change_listeners:
            for listener in self._change_listeners[key]:
                listener(user_id, value)
        
        # Notify wildcard listeners
        if "*" in self._change_listeners:
            for listener in self._change_listeners["*"]:
                listener(user_id, value)
