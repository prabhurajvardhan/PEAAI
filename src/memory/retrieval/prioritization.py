"""
Memory Prioritizer - Prioritizes memory items for retrieval.

Provides:
- Multi-factor prioritization
- Dynamic weight adjustment
- Priority queue management
"""

from typing import List, Dict, Callable, Optional
from dataclasses import dataclass, field
from datetime import datetime
from .retrieval_system import MemoryItem, RetrievalStrategy, ImportanceLevel
import math


@dataclass
class PriorityFactors:
    """
    Weight factors for priority calculation.
    """
    
    recency: float = 0.25  # Weight for recency
    relevance: float = 0.35  # Weight for relevance score
    importance: float = 0.25  # Weight for importance
    access_frequency: float = 0.15  # Weight for access frequency
    
    # Adjustments
    pinned_boost: float = 0.2  # Boost for pinned items
    decaying_access_weight: float = 0.5  # How much access frequency decays
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary."""
        return {
            "recency": self.recency,
            "relevance": self.relevance,
            "importance": self.importance,
            "access_frequency": self.access_frequency,
            "pinned_boost": self.pinned_boost,
            "decaying_access_weight": self.decaying_access_weight,
        }


class MemoryPrioritizer:
    """
    Prioritizes memory items based on multiple factors.
    
    Provides:
    - Configurable priority weights
    - Strategy-based prioritization
    - Priority recalculation
    """
    
    def __init__(self):
        """Initialize memory prioritizer."""
        self._factors = PriorityFactors()
        self._custom_scorers: List[Callable[[MemoryItem], float]] = []
    
    def set_factors(self, factors: PriorityFactors) -> None:
        """
        Set priority factors.
        
        Args:
            factors: Priority factors
        """
        self._factors = factors
    
    def add_custom_scorer(self, scorer: Callable[[MemoryItem], float]) -> None:
        """
        Add a custom scorer function.
        
        Args:
            scorer: Function that takes MemoryItem and returns score
        """
        self._custom_scorers.append(scorer)
    
    def calculate_priority(
        self,
        item: MemoryItem,
        context: Optional[Dict] = None,
    ) -> float:
        """
        Calculate priority score for an item.
        
        Args:
            item: Memory item
            context: Optional context data
            
        Returns:
            Priority score 0-1
        """
        factors = self._factors
        
        # Calculate component scores
        recency_score = self._calculate_recency(item)
        relevance_score = item.relevance_score
        importance_score = self._calculate_importance(item)
        access_score = self._calculate_access(item)
        
        # Apply weights
        priority = (
            factors.recency * recency_score +
            factors.relevance * relevance_score +
            factors.importance * importance_score +
            factors.access_frequency * access_score
        )
        
        # Apply pinned boost
        if item.is_pinned:
            priority = min(1.0, priority + factors.pinned_boost)
        
        # Apply custom scorers
        for scorer in self._custom_scorers:
            custom_score = scorer(item)
            priority = (priority + custom_score) / 2
        
        return max(0.0, min(1.0, priority))
    
    def prioritize(
        self,
        items: List[MemoryItem],
        limit: Optional[int] = None,
        strategy: RetrievalStrategy = RetrievalStrategy.HYBRID,
    ) -> List[MemoryItem]:
        """
        Prioritize a list of items.
        
        Args:
            items: List of memory items
            limit: Optional limit on results
            strategy: Retrieval strategy
            
        Returns:
            Prioritized list of items
        """
        # Adjust factors based on strategy
        self._adjust_for_strategy(strategy)
        
        # Calculate priorities
        scored_items = [
            (item, self.calculate_priority(item))
            for item in items
        ]
        
        # Sort by priority (descending)
        scored_items.sort(key=lambda x: x[1], reverse=True)
        
        # Return sorted items
        result = [item for item, _ in scored_items]
        
        if limit:
            result = result[:limit]
        
        return result
    
    def get_priority_breakdown(
        self,
        item: MemoryItem,
    ) -> Dict[str, float]:
        """
        Get breakdown of priority components.
        
        Args:
            item: Memory item
            
        Returns:
            Dictionary of component scores
        """
        return {
            "recency": self._calculate_recency(item),
            "relevance": item.relevance_score,
            "importance": self._calculate_importance(item),
            "access_frequency": self._calculate_access(item),
            "final": self.calculate_priority(item),
        }
    
    def _calculate_recency(self, item: MemoryItem) -> float:
        """Calculate recency score with half-life decay."""
        now = datetime.utcnow()
        age = (now - item.updated_at).total_seconds()
        
        # Half-life of 7 days
        half_life_seconds = 7 * 24 * 60 * 60
        return math.exp(-0.693 * age / half_life_seconds)
    
    def _calculate_importance(self, item: MemoryItem) -> float:
        """Calculate importance score."""
        importance_scores = {
            ImportanceLevel.LOW: 0.25,
            ImportanceLevel.MEDIUM: 0.5,
            ImportanceLevel.HIGH: 0.75,
            ImportanceLevel.CRITICAL: 1.0,
        }
        return importance_scores.get(item.importance, 0.5)
    
    def _calculate_access(self, item: MemoryItem) -> float:
        """
        Calculate access frequency score with decay.
        """
        if item.access_count == 0:
            return 0.0
        
        # Logarithmic scale with decay
        base_score = math.log(1 + item.access_count) / math.log(101)
        
        # Decay based on time since last access
        if item.last_accessed:
            now = datetime.utcnow()
            age = (now - item.last_accessed).total_seconds()
            half_life = 3 * 24 * 60 * 60  # 3 days
            decay = math.exp(-0.693 * age / half_life)
            return base_score * (1 - self._factors.decaying_access_weight * (1 - decay))
        
        return base_score
    
    def _adjust_for_strategy(self, strategy: RetrievalStrategy) -> None:
        """Adjust factors based on retrieval strategy."""
        factors = PriorityFactors()  # Reset to defaults
        
        if strategy == RetrievalStrategy.RECENCY:
            factors.recency = 0.7
            factors.relevance = 0.15
            factors.importance = 0.1
            factors.access_frequency = 0.05
        elif strategy == RetrievalStrategy.RELEVANCE:
            factors.recency = 0.1
            factors.relevance = 0.6
            factors.importance = 0.2
            factors.access_frequency = 0.1
        elif strategy == RetrievalStrategy.IMPORTANCE:
            factors.recency = 0.1
            factors.relevance = 0.2
            factors.importance = 0.6
            factors.access_frequency = 0.1
        # HYBRID uses default weights
        
        self._factors = factors


class PriorityQueue:
    """
    Priority queue for memory items.
    
    Provides efficient retrieval of highest priority items.
    """
    
    def __init__(self, prioritizer: Optional[MemoryPrioritizer] = None):
        """
        Initialize priority queue.
        
        Args:
            prioritizer: Optional MemoryPrioritizer instance
        """
        self._prioritizer = prioritizer or MemoryPrioritizer()
        self._items: List[MemoryItem] = []
        self._item_scores: Dict[str, float] = {}
    
    def add(self, item: MemoryItem) -> None:
        """
        Add an item to the queue.
        
        Args:
            item: Memory item to add
        """
        score = self._prioritizer.calculate_priority(item)
        self._items.append(item)
        self._item_scores[item.id] = score
    
    def add_batch(self, items: List[MemoryItem]) -> None:
        """
        Add multiple items to the queue.
        
        Args:
            items: List of memory items
        """
        for item in items:
            self.add(item)
    
    def pop(self) -> Optional[MemoryItem]:
        """
        Remove and return highest priority item.
        
        Returns:
            Highest priority item or None
        """
        if not self._items:
            return None
        
        # Find and remove highest priority
        self._recalculate_scores()
        max_item = max(self._items, key=lambda x: self._item_scores.get(x.id, 0))
        self._items.remove(max_item)
        del self._item_scores[max_item.id]
        
        return max_item
    
    def peek(self) -> Optional[MemoryItem]:
        """
        Get highest priority item without removing.
        
        Returns:
            Highest priority item or None
        """
        if not self._items:
            return None
        
        self._recalculate_scores()
        return max(self._items, key=lambda x: self._item_scores.get(x.id, 0))
    
    def get_top_n(self, n: int) -> List[MemoryItem]:
        """
        Get top N items without removing.
        
        Args:
            n: Number of items
            
        Returns:
            List of top N items
        """
        self._recalculate_scores()
        sorted_items = sorted(
            self._items,
            key=lambda x: self._item_scores.get(x.id, 0),
            reverse=True
        )
        return sorted_items[:n]
    
    def remove(self, item_id: str) -> bool:
        """
        Remove an item by ID.
        
        Args:
            item_id: Item identifier
            
        Returns:
            True if removed
        """
        for item in self._items:
            if item.id == item_id:
                self._items.remove(item)
                del self._item_scores[item_id]
                return True
        return False
    
    def clear(self) -> None:
        """Clear the queue."""
        self._items.clear()
        self._item_scores.clear()
    
    def __len__(self) -> int:
        """Get number of items in queue."""
        return len(self._items)
    
    def _recalculate_scores(self) -> None:
        """Recalculate all priority scores."""
        for item in self._items:
            self._item_scores[item.id] = self._prioritizer.calculate_priority(item)
