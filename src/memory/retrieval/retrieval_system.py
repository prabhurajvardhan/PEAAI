"""
Retrieval System - Context retrieval with relevance scoring and prioritization.

This module handles:
- Relevance scoring
- Context window management
- Memory prioritization
- Time-based decay
- Query-based retrieval
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set, Callable
from enum import Enum
import uuid
import math


class MemoryType(str, Enum):
    """Types of memory items."""
    USER_PREFERENCE = "user_preference"
    USER_FACT = "user_fact"
    CONVERSATION = "conversation"
    STORY = "story"
    RELATIONSHIP = "relationship"
    CONTEXT = "context"
    LONG_TERM = "long_term"


class RetrievalStrategy(str, Enum):
    """Retrieval strategies."""
    RECENCY = "recency"  # Prioritize recent memories
    RELEVANCE = "relevance"  # Prioritize relevance score
    IMPORTANCE = "importance"  # Prioritize importance
    HYBRID = "hybrid"  # Balanced approach


class ImportanceLevel(str, Enum):
    """Memory importance levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class MemoryItem:
    """
    A retrievable memory item.
    """
    
    id: str
    user_id: str
    memory_type: MemoryType
    importance: ImportanceLevel
    
    # Content
    content: str
    summary: Optional[str] = None
    embedding: Optional[List[float]] = None
    
    # Relevance
    relevance_score: float = 1.0  # 0-1
    access_count: int = 0
    
    # Time
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Relationships
    tags: List[str] = field(default_factory=list)
    conversation_id: Optional[str] = None
    story_id: Optional[str] = None
    related_memory_ids: List[str] = field(default_factory=list)
    
    # State
    is_pinned: bool = False
    is_active: bool = True
    
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "memory_type": self.memory_type.value if isinstance(self.memory_type, Enum) else self.memory_type,
            "importance": self.importance.value if isinstance(self.importance, Enum) else self.importance,
            "content": self.content,
            "summary": self.summary,
            "embedding": self.embedding,
            "relevance_score": self.relevance_score,
            "access_count": self.access_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "tags": self.tags,
            "conversation_id": self.conversation_id,
            "story_id": self.story_id,
            "related_memory_ids": self.related_memory_ids,
            "is_pinned": self.is_pinned,
            "is_active": self.is_active,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MemoryItem":
        """Create from dictionary."""
        memory_type = data.get("memory_type")
        if isinstance(memory_type, str):
            memory_type = MemoryType(memory_type.lower())
        
        importance = data.get("importance", "medium")
        if isinstance(importance, str):
            importance = ImportanceLevel(importance.lower())
        
        def parse_dt(dt):
            if isinstance(dt, str):
                return datetime.fromisoformat(dt)
            return dt
        
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            user_id=data.get("user_id", ""),
            memory_type=memory_type,
            importance=importance,
            content=data.get("content", ""),
            summary=data.get("summary"),
            embedding=data.get("embedding"),
            relevance_score=data.get("relevance_score", 1.0),
            access_count=data.get("access_count", 0),
            created_at=parse_dt(data.get("created_at")) or datetime.utcnow(),
            updated_at=parse_dt(data.get("updated_at")) or datetime.utcnow(),
            last_accessed=parse_dt(data.get("last_accessed")),
            expires_at=parse_dt(data.get("expires_at")),
            tags=data.get("tags", []),
            conversation_id=data.get("conversation_id"),
            story_id=data.get("story_id"),
            related_memory_ids=data.get("related_memory_ids", []),
            is_pinned=data.get("is_pinned", False),
            is_active=data.get("is_active", True),
            metadata=data.get("metadata", {}),
        )
    
    def calculate_recency_score(self, now: Optional[datetime] = None) -> float:
        """
        Calculate recency score based on time since last update.
        
        Args:
            now: Current time (defaults to now)
            
        Returns:
            Recency score 0-1
        """
        if now is None:
            now = datetime.utcnow()
        
        age = (now - self.updated_at).total_seconds()
        
        # Exponential decay with half-life of 7 days
        half_life_seconds = 7 * 24 * 60 * 60
        return math.exp(-0.693 * age / half_life_seconds)
    
    def calculate_access_score(self) -> float:
        """
        Calculate access frequency score.
        
        Returns:
            Access score 0-1
        """
        # Logarithmic scale, capped at 10 accesses
        return min(1.0, math.log(1 + self.access_count) / math.log(11))


@dataclass
class RetrievalQuery:
    """
    Query for memory retrieval.
    """
    
    user_id: str
    query_text: str
    
    # Filters
    memory_types: Optional[List[MemoryType]] = None
    tags: Optional[List[str]] = None
    importance_levels: Optional[List[ImportanceLevel]] = None
    
    # Context
    conversation_id: Optional[str] = None
    story_id: Optional[str] = None
    current_time: Optional[datetime] = None
    
    # Retrieval parameters
    strategy: RetrievalStrategy = RetrievalStrategy.HYBRID
    max_items: int = 20
    min_relevance: float = 0.1
    
    # Scoring weights
    recency_weight: float = 0.3
    relevance_weight: float = 0.4
    importance_weight: float = 0.3
    
    # Include expired
    include_expired: bool = False
    
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "query_text": self.query_text,
            "memory_types": [t.value if isinstance(t, Enum) else t for t in (self.memory_types or [])],
            "tags": self.tags,
            "importance_levels": [i.value if isinstance(i, Enum) else i for i in (self.importance_levels or [])],
            "conversation_id": self.conversation_id,
            "story_id": self.story_id,
            "strategy": self.strategy.value if isinstance(self.strategy, Enum) else self.strategy,
            "max_items": self.max_items,
            "min_relevance": self.min_relevance,
            "recency_weight": self.recency_weight,
            "relevance_weight": self.relevance_weight,
            "importance_weight": self.importance_weight,
            "include_expired": self.include_expired,
            "metadata": self.metadata,
        }


@dataclass
class RetrievalResult:
    """
    Result of a retrieval query.
    """
    
    query: RetrievalQuery
    items: List[MemoryItem]
    scores: Dict[str, float]  # item_id -> score
    total_candidates: int
    retrieval_time_ms: float
    
    # Context
    context_window_items: List[MemoryItem] = field(default_factory=list)
    related_items: Dict[str, List[MemoryItem]] = field(default_factory=dict)  # item_id -> related
    
    # Metadata
    strategy_used: RetrievalStrategy
    filters_applied: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "query": self.query.to_dict(),
            "items": [item.to_dict() for item in self.items],
            "scores": self.scores,
            "total_candidates": self.total_candidates,
            "retrieval_time_ms": self.retrieval_time_ms,
            "context_window_items": [item.to_dict() for item in self.context_window_items],
            "related_items": {
                k: [item.to_dict() for item in v]
                for k, v in self.related_items.items()
            },
            "strategy_used": self.strategy_used.value if isinstance(self.strategy_used, Enum) else self.strategy_used,
            "filters_applied": self.filters_applied,
        }
    
    def get_items_by_type(self, memory_type: MemoryType) -> List[MemoryItem]:
        """Get items filtered by type."""
        return [
            item for item in self.items
            if item.memory_type == memory_type
        ]
    
    def get_top_items(self, n: int = 5) -> List[MemoryItem]:
        """Get top N items by score."""
        sorted_items = sorted(
            self.items,
            key=lambda x: self.scores.get(x.id, 0),
            reverse=True
        )
        return sorted_items[:n]


class RetrievalSystem:
    """
    Memory retrieval system with relevance scoring and prioritization.
    
    Provides:
    - Query-based memory retrieval
    - Relevance scoring
    - Time-based decay
    - Memory prioritization
    - Context window management
    """
    
    def __init__(self, db_session=None):
        """
        Initialize retrieval system.
        
        Args:
            db_session: Optional database session
        """
        self._db_session = db_session
        self._items: Dict[str, MemoryItem] = {}  # item_id -> item
        self._user_items: Dict[str, Set[str]] = {}  # user_id -> set of item_ids
        self._type_index: Dict[str, Set[str]] = {}  # type -> set of item_ids
        self._tag_index: Dict[str, Set[str]] = {}  # tag -> set of item_ids
        
        # Scoring components
        self._scorer = RelevanceScorer()
        self._prioritizer = MemoryPrioritizer()
        self._decay = TimeDecay()
    
    def index_item(self, item: MemoryItem) -> None:
        """
        Index a memory item for retrieval.
        
        Args:
            item: MemoryItem to index
        """
        self._items[item.id] = item
        
        # User index
        self._user_items.setdefault(item.user_id, set()).add(item.id)
        
        # Type index
        type_key = item.memory_type.value if isinstance(item.memory_type, Enum) else str(item.memory_type)
        self._type_index.setdefault(type_key, set()).add(item.id)
        
        # Tag index
        for tag in item.tags:
            self._tag_index.setdefault(tag, set()).add(item.id)
    
    def remove_item(self, item_id: str) -> bool:
        """
        Remove an item from the index.
        
        Args:
            item_id: Item identifier
            
        Returns:
            True if removed
        """
        if item_id not in self._items:
            return False
        
        item = self._items[item_id]
        
        # Remove from indexes
        if item.user_id in self._user_items:
            self._user_items[item.user_id].discard(item_id)
        
        type_key = item.memory_type.value if isinstance(item.memory_type, Enum) else str(item.memory_type)
        if type_key in self._type_index:
            self._type_index[type_key].discard(item_id)
        
        for tag in item.tags:
            if tag in self._tag_index:
                self._tag_index[tag].discard(item_id)
        
        del self._items[item_id]
        return True
    
    def retrieve(self, query: RetrievalQuery) -> RetrievalResult:
        """
        Retrieve memory items based on query.
        
        Args:
            query: RetrievalQuery object
            
        Returns:
            RetrievalResult
        """
        start_time = datetime.utcnow()
        
        # Get candidate items
        candidates = self._get_candidates(query)
        
        # Filter expired items
        if not query.include_expired:
            now = query.current_time or datetime.utcnow()
            candidates = [
                c for c in candidates
                if c.expires_at is None or c.expires_at > now
            ]
        
        # Calculate scores
        scored_items = []
        scores = {}
        
        for item in candidates:
            score = self._calculate_score(item, query, start_time)
            
            if score >= query.min_relevance:
                scores[item.id] = score
                scored_items.append((item, score))
        
        # Sort by score
        scored_items.sort(key=lambda x: x[1], reverse=True)
        
        # Apply max items limit
        top_items = [item for item, _ in scored_items[:query.max_items]]
        top_scores = {item.id: scores[item.id] for item in top_items}
        
        # Get context window
        context_items = self._get_context_window(top_items, query)
        
        # Get related items
        related_items = self._get_related_items(top_items)
        
        retrieval_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return RetrievalResult(
            query=query,
            items=top_items,
            scores=top_scores,
            total_candidates=len(candidates),
            retrieval_time_ms=retrieval_time,
            context_window_items=context_items,
            related_items=related_items,
            strategy_used=query.strategy,
            filters_applied=self._get_filters_applied(query),
        )
    
    def retrieve_by_type(
        self,
        user_id: str,
        memory_type: MemoryType,
        limit: int = 20,
    ) -> List[MemoryItem]:
        """
        Retrieve items by memory type.
        
        Args:
            user_id: User identifier
            memory_type: Type of memory
            limit: Maximum items
            
        Returns:
            List of MemoryItems
        """
        type_key = memory_type.value if isinstance(memory_type, Enum) else str(memory_type)
        type_items = self._type_index.get(type_key, set())
        
        items = []
        for item_id in type_items:
            item = self._items.get(item_id)
            if item and item.user_id == user_id and item.is_active:
                items.append(item)
        
        return sorted(
            items,
            key=lambda x: x.updated_at,
            reverse=True
        )[:limit]
    
    def retrieve_recent(
        self,
        user_id: str,
        limit: int = 20,
        types: Optional[List[MemoryType]] = None,
    ) -> List[MemoryItem]:
        """
        Retrieve recent memory items.
        
        Args:
            user_id: User identifier
            limit: Maximum items
            types: Optional type filter
            
        Returns:
            List of recent MemoryItems
        """
        user_item_ids = self._user_items.get(user_id, set())
        
        items = []
        for item_id in user_item_ids:
            item = self._items.get(item_id)
            if item and item.is_active:
                if types is None or item.memory_type in types:
                    items.append(item)
        
        return sorted(
            items,
            key=lambda x: x.updated_at,
            reverse=True
        )[:limit]
    
    def retrieve_pinned(
        self,
        user_id: str,
    ) -> List[MemoryItem]:
        """
        Retrieve pinned memory items.
        
        Args:
            user_id: User identifier
            
        Returns:
            List of pinned MemoryItems
        """
        user_item_ids = self._user_items.get(user_id, set())
        
        return [
            self._items[item_id]
            for item_id in user_item_ids
            if item_id in self._items
            and self._items[item_id].is_pinned
            and self._items[item_id].is_active
        ]
    
    def get_item(self, item_id: str) -> Optional[MemoryItem]:
        """
        Get a specific memory item.
        
        Args:
            item_id: Item identifier
            
        Returns:
            MemoryItem or None
        """
        return self._items.get(item_id)
    
    def update_access(self, item_id: str) -> None:
        """
        Update access statistics for an item.
        
        Args:
            item_id: Item identifier
        """
        if item_id in self._items:
            item = self._items[item_id]
            item.access_count += 1
            item.last_accessed = datetime.utcnow()
    
    def _get_candidates(self, query: RetrievalQuery) -> List[MemoryItem]:
        """Get candidate items for query."""
        # Start with user's items
        user_item_ids = self._user_items.get(query.user_id, set())
        candidates = []
        
        for item_id in user_item_ids:
            item = self._items.get(item_id)
            if not item or not item.is_active:
                continue
            
            # Apply type filter
            if query.memory_types:
                if item.memory_type not in query.memory_types:
                    continue
            
            # Apply importance filter
            if query.importance_levels:
                if item.importance not in query.importance_levels:
                    continue
            
            # Apply tag filter
            if query.tags:
                if not any(tag in item.tags for tag in query.tags):
                    continue
            
            # Apply conversation filter
            if query.conversation_id:
                if item.conversation_id != query.conversation_id:
                    continue
            
            # Apply story filter
            if query.story_id:
                if item.story_id != query.story_id:
                    continue
            
            candidates.append(item)
        
        return candidates
    
    def _calculate_score(
        self,
        item: MemoryItem,
        query: RetrievalQuery,
        now: datetime,
    ) -> float:
        """Calculate retrieval score for an item."""
        weights = {
            "recency": query.recency_weight,
            "relevance": query.relevance_weight,
            "importance": query.importance_weight,
        }
        
        # Apply strategy
        if query.strategy == RetrievalStrategy.RECENCY:
            weights = {"recency": 0.7, "relevance": 0.2, "importance": 0.1}
        elif query.strategy == RetrievalStrategy.RELEVANCE:
            weights = {"recency": 0.1, "relevance": 0.7, "importance": 0.2}
        elif query.strategy == RetrievalStrategy.IMPORTANCE:
            weights = {"recency": 0.1, "relevance": 0.2, "importance": 0.7}
        
        # Calculate component scores
        recency_score = item.calculate_recency_score(now)
        relevance_score = self._scorer.calculate_relevance(item, query)
        importance_score = self._scorer.calculate_importance(item)
        
        # Pinned items get a boost
        if item.is_pinned:
            importance_score = min(1.0, importance_score + 0.2)
        
        # Calculate weighted score
        total_weight = sum(weights.values())
        score = (
            weights["recency"] * recency_score +
            weights["relevance"] * relevance_score +
            weights["importance"] * importance_score
        ) / total_weight
        
        # Apply time-based decay
        decay_factor = self._decay.calculate_decay(item, now)
        score *= decay_factor
        
        return max(0.0, min(1.0, score))
    
    def _get_context_window(
        self,
        items: List[MemoryItem],
        query: RetrievalQuery,
    ) -> List[MemoryItem]:
        """Get context window items."""
        context_items = []
        seen_ids = {item.id for item in items}
        
        # Get related items from context
        for item in items[:5]:  # Top 5 items
            for related_id in item.related_memory_ids[:3]:
                if related_id not in seen_ids:
                    related = self._items.get(related_id)
                    if related and related.is_active:
                        context_items.append(related)
                        seen_ids.add(related_id)
        
        return context_items[:query.max_items // 2]
    
    def _get_related_items(
        self,
        items: List[MemoryItem],
    ) -> Dict[str, List[MemoryItem]]:
        """Get related items for each top item."""
        related = {}
        max_related = 5
        
        for item in items:
            related_ids = item.related_memory_ids[:max_related]
            related_items = [
                self._items[rid]
                for rid in related_ids
                if rid in self._items
            ]
            if related_items:
                related[item.id] = related_items
        
        return related
    
    def _get_filters_applied(self, query: RetrievalQuery) -> Dict[str, Any]:
        """Get summary of filters applied."""
        return {
            "memory_types": [t.value for t in (query.memory_types or [])],
            "tags": query.tags,
            "importance_levels": [i.value for i in (query.importance_levels or [])],
            "conversation_id": query.conversation_id,
            "story_id": query.story_id,
        }
    
    def cleanup_expired(self) -> int:
        """
        Remove expired memory items.
        
        Returns:
            Number of items removed
        """
        now = datetime.utcnow()
        removed = 0
        
        for item_id in list(self._items.keys()):
            item = self._items[item_id]
            if item.expires_at and item.expires_at < now:
                self.remove_item(item_id)
                removed += 1
        
        return removed
