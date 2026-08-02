"""
Time Decay - Manages time-based memory decay.

Provides:
- Exponential decay
- Linear decay
- Custom decay functions
- Decay schedule management
"""

from typing import Dict, Callable, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import math

from .retrieval_system import MemoryItem, ImportanceLevel


@dataclass
class DecayConfig:
    """Configuration for time decay."""
    
    # Half-life for each importance level (in days)
    half_life_critical: float = 365.0  # 1 year
    half_life_high: float = 90.0  # 3 months
    half_life_medium: float = 30.0  # 1 month
    half_life_low: float = 7.0  # 1 week
    
    # Decay function
    decay_function: str = "exponential"  # exponential, linear, step
    
    # Step decay config
    step_size_days: float = 7.0  # For step decay
    step_decay_amount: float = 0.1  # Decay per step
    
    # Minimum decay factor (memory never decays below this)
    min_decay: float = 0.1
    
    # Boost for recent access
    recent_access_boost: float = 0.2
    recent_access_hours: float = 24.0  # Within this many hours
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "half_life_critical": self.half_life_critical,
            "half_life_high": self.half_life_high,
            "half_life_medium": self.half_life_medium,
            "half_life_low": self.half_life_low,
            "decay_function": self.decay_function,
            "step_size_days": self.step_size_days,
            "step_decay_amount": self.step_decay_amount,
            "min_decay": self.min_decay,
            "recent_access_boost": self.recent_access_boost,
            "recent_access_hours": self.recent_access_hours,
        }


class TimeDecay:
    """
    Manages time-based decay for memory items.
    
    Provides:
    - Configurable decay functions
    - Importance-based half-life
    - Recent access boosting
    - Decay schedule management
    """
    
    def __init__(self, config: Optional[DecayConfig] = None):
        """
        Initialize time decay.
        
        Args:
            config: Optional decay configuration
        """
        self._config = config or DecayConfig()
        self._custom_decay: Optional[Callable[[MemoryItem, datetime], float]] = None
    
    def set_config(self, config: DecayConfig) -> None:
        """
        Set decay configuration.
        
        Args:
            config: Decay configuration
        """
        self._config = config
    
    def set_custom_decay(
        self,
        decay_func: Callable[[MemoryItem, datetime], float]
    ) -> None:
        """
        Set a custom decay function.
        
        Args:
            decay_func: Function that takes item and current time, returns decay factor
        """
        self._custom_decay = decay_func
    
    def calculate_decay(
        self,
        item: MemoryItem,
        now: Optional[datetime] = None,
    ) -> float:
        """
        Calculate decay factor for an item.
        
        Args:
            item: Memory item
            now: Current time (defaults to now)
            
        Returns:
            Decay factor 0-1
        """
        if now is None:
            now = datetime.utcnow()
        
        # Use custom decay if set
        if self._custom_decay:
            return max(self._config.min_decay, self._custom_decay(item, now))
        
        # Calculate age in seconds
        age = (now - item.updated_at).total_seconds()
        age_days = age / (24 * 60 * 60)
        
        # Get half-life based on importance
        half_life_days = self._get_half_life(item.importance)
        
        # Calculate decay
        if self._config.decay_function == "exponential":
            decay = self._exponential_decay(age_days, half_life_days)
        elif self._config.decay_function == "linear":
            decay = self._linear_decay(age_days, half_life_days)
        elif self._config.decay_function == "step":
            decay = self._step_decay(age_days, half_life_days)
        else:
            decay = self._exponential_decay(age_days, half_life_days)
        
        # Apply minimum decay
        decay = max(self._config.min_decay, decay)
        
        # Apply recent access boost
        if item.last_accessed:
            hours_since_access = (now - item.last_accessed).total_seconds() / 3600
            if hours_since_access <= self._config.recent_access_hours:
                boost = self._config.recent_access_boost * (
                    1 - hours_since_access / self._config.recent_access_hours
                )
                decay = min(1.0, decay + boost)
        
        return decay
    
    def get_decay_info(
        self,
        item: MemoryItem,
        now: Optional[datetime] = None,
    ) -> Dict:
        """
        Get detailed decay information.
        
        Args:
            item: Memory item
            now: Current time
            
        Returns:
            Dictionary with decay details
        """
        if now is None:
            now = datetime.utcnow()
        
        age = (now - item.updated_at).total_seconds()
        age_days = age / (24 * 60 * 60)
        half_life_days = self._get_half_life(item.importance)
        
        return {
            "item_id": item.id,
            "age_days": age_days,
            "half_life_days": half_life_days,
            "percent_half_life": (age_days / half_life_days) * 100 if half_life_days > 0 else 0,
            "current_decay": self.calculate_decay(item, now),
            "decay_function": self._config.decay_function,
            "importance": item.importance.value,
            "last_accessed_hours_ago": (
                (now - item.last_accessed).total_seconds() / 3600
                if item.last_accessed else None
            ),
        }
    
    def get_refresh_recommendation(
        self,
        item: MemoryItem,
        target_decay: float = 0.5,
        now: Optional[datetime] = None,
    ) -> Optional[timedelta]:
        """
        Recommend when an item should be refreshed to maintain target decay.
        
        Args:
            item: Memory item
            target_decay: Target decay factor
            now: Current time
            
        Returns:
            Recommended refresh time or None if already below target
        """
        if now is None:
            now = datetime.utcnow()
        
        half_life_days = self._get_half_life(item.importance)
        half_life_seconds = half_life_days * 24 * 60 * 60
        
        # For exponential decay: decay = 0.5^(age/half_life)
        # Solve for age when decay = target_decay
        # age = half_life * log(target_decay) / log(0.5)
        
        if self._config.decay_function == "exponential":
            if math.log(target_decay) == 0:
                return None
            target_age = half_life_seconds * math.log(target_decay) / math.log(0.5)
            current_age = (now - item.updated_at).total_seconds()
            remaining = target_age - current_age
            
            if remaining <= 0:
                return None
            
            return timedelta(seconds=remaining)
        
        # For other decay functions, return None (simplified)
        return None
    
    def _get_half_life(self, importance: ImportanceLevel) -> float:
        """Get half-life in days for importance level."""
        half_lives = {
            ImportanceLevel.CRITICAL: self._config.half_life_critical,
            ImportanceLevel.HIGH: self._config.half_life_high,
            ImportanceLevel.MEDIUM: self._config.half_life_medium,
            ImportanceLevel.LOW: self._config.half_life_low,
        }
        return half_lives.get(importance, self._config.half_life_medium)
    
    def _exponential_decay(self, age_days: float, half_life_days: float) -> float:
        """
        Calculate exponential decay.
        
        decay = 0.5^(age/half_life)
        """
        if half_life_days <= 0:
            return 1.0
        return math.exp(-0.693 * age_days / half_life_days)
    
    def _linear_decay(self, age_days: float, half_life_days: float) -> float:
        """
        Calculate linear decay.
        
        decay = max(min_decay, 1 - age/(2*half_life))
        """
        if half_life_days <= 0:
            return 1.0
        
        decay = 1 - (age_days / (2 * half_life_days))
        return max(self._config.min_decay, decay)
    
    def _step_decay(self, age_days: float, half_life_days: float) -> float:
        """
        Calculate step decay.
        
        decay = max(min_decay, 1 - steps * step_decay)
        """
        steps = int(age_days / self._config.step_size_days)
        decay = 1 - (steps * self._config.step_decay_amount)
        return max(self._config.min_decay, decay)


class DecayScheduler:
    """
    Manages decay schedules for memory items.
    
    Provides:
    - Batch decay calculation
    - Scheduled decay
    - Decay event tracking
    """
    
    def __init__(self, time_decay: Optional[TimeDecay] = None):
        """
        Initialize decay scheduler.
        
        Args:
            time_decay: Optional TimeDecay instance
        """
        self._time_decay = time_decay or TimeDecay()
        self._scheduled_items: Dict[str, datetime] = {}  # item_id -> scheduled decay time
    
    def schedule_decay(
        self,
        item_id: str,
        decay_time: datetime,
    ) -> None:
        """
        Schedule a decay event.
        
        Args:
            item_id: Item identifier
            decay_time: When to apply decay
        """
        self._scheduled_items[item_id] = decay_time
    
    def get_due_items(
        self,
        now: Optional[datetime] = None,
    ) -> list:
        """
        Get items due for decay.
        
        Args:
            now: Current time
            
        Returns:
            List of item IDs due for decay
        """
        if now is None:
            now = datetime.utcnow()
        
        return [
            item_id for item_id, decay_time in self._scheduled_items.items()
            if decay_time <= now
        ]
    
    def cancel_scheduled(self, item_id: str) -> bool:
        """
        Cancel a scheduled decay.
        
        Args:
            item_id: Item identifier
            
        Returns:
            True if cancelled
        """
        if item_id in self._scheduled_items:
            del self._scheduled_items[item_id]
            return True
        return False
    
    def clear_all(self) -> None:
        """Clear all scheduled decays."""
        self._scheduled_items.clear()
