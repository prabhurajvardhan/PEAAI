"""
Context Window - Manages the context window for memory retrieval.

Provides:
- Dynamic context window sizing
- Memory coalescing
- Context quality assessment
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
from .retrieval_system import MemoryItem


@dataclass
class ContextWindow:
    """
    Represents a context window for memory retrieval.
    
    Manages:
    - Selected memory items
    - Total token budget
    - Quality metrics
    """
    
    items: List[MemoryItem] = field(default_factory=list)
    max_tokens: int = 4000  # Approximate token limit
    current_tokens: int = 0
    
    # Quality metrics
    coverage_score: float = 0.0  # How well topics are covered
    coherence_score: float = 0.0  # How coherent the context is
    recency_weight: float = 0.3  # Weight for recency
    
    def add_item(self, item: MemoryItem) -> bool:
        """
        Add an item to the context window.
        
        Args:
            item: Memory item to add
            
        Returns:
            True if added successfully
        """
        item_tokens = self._estimate_tokens(item)
        
        if self.current_tokens + item_tokens > self.max_tokens:
            return False
        
        self.items.append(item)
        self.current_tokens += item_tokens
        return True
    
    def can_add(self, item: MemoryItem) -> bool:
        """Check if item can be added."""
        return self._estimate_tokens(item) <= (self.max_tokens - self.current_tokens)
    
    def remove_least_important(self) -> Optional[MemoryItem]:
        """
        Remove the least important item.
        
        Returns:
            Removed item or None
        """
        if not self.items:
            return None
        
        # Find item with lowest priority
        priorities = [(i, self._calculate_priority(self.items[i])) for i in range(len(self.items))]
        priorities.sort(key=lambda x: x[1])
        
        removed = self.items.pop(priorities[0][0])
        self.current_tokens -= self._estimate_tokens(removed)
        return removed
    
    def optimize(self) -> None:
        """
        Optimize the context window for quality and size.
        """
        # Sort by priority
        self.items.sort(key=lambda x: self._calculate_priority(x), reverse=True)
        
        # Remove low priority items until we fit
        while self.current_tokens > self.max_tokens and len(self.items) > 1:
            self.remove_least_important()
        
        # Recalculate quality
        self._calculate_quality()
    
    def _calculate_priority(self, item: MemoryItem) -> float:
        """
        Calculate item priority.
        
        Args:
            item: Memory item
            
        Returns:
            Priority score
        """
        # Base priority from importance
        importance_map = {
            "critical": 1.0,
            "high": 0.8,
            "medium": 0.5,
            "low": 0.3,
        }
        priority = importance_map.get(item.importance.value, 0.5)
        
        # Boost for pinned
        if item.is_pinned:
            priority += 0.2
        
        # Boost for recency (within last hour)
        now = datetime.utcnow()
        age_hours = (now - item.updated_at).total_seconds() / 3600
        if age_hours < 1:
            priority += 0.2 * (1 - age_hours)
        
        # Boost for access count
        priority += min(0.1, item.access_count / 100)
        
        return min(1.0, priority)
    
    def _estimate_tokens(self, item: MemoryItem) -> int:
        """
        Estimate token count for an item.
        
        Args:
            item: Memory item
            
        Returns:
            Estimated token count
        """
        # Rough estimate: 4 chars per token
        text = f"{item.content} {item.summary or ''}"
        return len(text) // 4
    
    def _calculate_quality(self) -> None:
        """Calculate context window quality metrics."""
        if not self.items:
            self.coverage_score = 0.0
            self.coherence_score = 0.0
            return
        
        # Coverage: how many unique tags/types covered
        unique_tags = set()
        unique_types = set()
        for item in self.items:
            unique_tags.update(item.tags)
            unique_types.add(item.memory_type.value)
        
        # Normalize coverage (assuming ~20 tags, ~7 types is good)
        self.coverage_score = min(1.0, (len(unique_tags) / 20 + len(unique_types) / 7) / 2)
        
        # Coherence: based on related memory connections
        total_connections = 0
        for item in self.items:
            related_in_window = sum(
                1 for rid in item.related_memory_ids
                if any(i.id == rid for i in self.items)
            )
            total_connections += related_in_window
        
        max_connections = len(self.items) * 3  # Assume 3 connections is good
        self.coherence_score = min(1.0, total_connections / max_connections)
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get context window summary.
        
        Returns:
            Summary dictionary
        """
        return {
            "item_count": len(self.items),
            "total_tokens": self.current_tokens,
            "max_tokens": self.max_tokens,
            "utilization": self.current_tokens / self.max_tokens if self.max_tokens > 0 else 0,
            "coverage_score": self.coverage_score,
            "coherence_score": self.coherence_score,
            "types": list(set(item.memory_type.value for item in self.items)),
            "tags": list(set(tag for item in self.items for tag in item.tags))[:20],
        }


class ContextWindowManager:
    """
    Manages context windows for multiple queries.
    
    Provides:
    - Window pooling
    - Size optimization
    - Quality tracking
    """
    
    def __init__(self, default_max_tokens: int = 4000):
        """
        Initialize context window manager.
        
        Args:
            default_max_tokens: Default token limit per window
        """
        self._default_max_tokens = default_max_tokens
        self._windows: Dict[str, ContextWindow] = {}
        self._quality_history: Dict[str, List[float]] = {}
    
    def create_window(
        self,
        query_id: str,
        max_tokens: Optional[int] = None,
    ) -> ContextWindow:
        """
        Create a new context window.
        
        Args:
            query_id: Query identifier
            max_tokens: Optional token limit
            
        Returns:
            New ContextWindow
        """
        window = ContextWindow(
            max_tokens=max_tokens or self._default_max_tokens
        )
        self._windows[query_id] = window
        self._quality_history[query_id] = []
        return window
    
    def get_window(self, query_id: str) -> Optional[ContextWindow]:
        """
        Get existing context window.
        
        Args:
            query_id: Query identifier
            
        Returns:
            ContextWindow or None
        """
        return self._windows.get(query_id)
    
    def optimize_window(self, query_id: str) -> bool:
        """
        Optimize a context window.
        
        Args:
            query_id: Query identifier
            
        Returns:
            True if optimized
        """
        window = self._windows.get(query_id)
        if not window:
            return False
        
        window.optimize()
        
        # Track quality history
        quality = (window.coverage_score + window.coherence_score) / 2
        self._quality_history[query_id].append(quality)
        
        # Keep only recent history
        if len(self._quality_history[query_id]) > 100:
            self._quality_history[query_id] = self._quality_history[query_id][-100:]
        
        return True
    
    def get_average_quality(self, query_id: str) -> float:
        """
        Get average context quality.
        
        Args:
            query_id: Query identifier
            
        Returns:
            Average quality score
        """
        history = self._quality_history.get(query_id, [])
        if not history:
            return 0.0
        return sum(history) / len(history)
    
    def close_window(self, query_id: str) -> None:
        """
        Close and cleanup a context window.
        
        Args:
            query_id: Query identifier
        """
        self._windows.pop(query_id, None)
        self._quality_history.pop(query_id, None)
    
    def close_all(self) -> None:
        """Close all context windows."""
        self._windows.clear()
        self._quality_history.clear()
