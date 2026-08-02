"""
Search System - Semantic search with embeddings and vector storage.

This module handles:
- Embedding generation
- Vector storage
- Similarity search
- Filter support
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Set, Callable
from enum import Enum
import uuid
import json


class EmbeddingModel(str, Enum):
    """Available embedding models."""
    TFIDF = "tfidf"  # Simple TF-IDF (fallback)
    SENTENCE_TRANSFORMER = "sentence_transformer"  # sentence-transformers
    OPENAI_ADA = "openai_ada"  # OpenAI ada-002
    COHERE = "cohere"  # Cohere embeddings


class SearchFilterType(str, Enum):
    """Types of search filters."""
    TYPE = "type"  # Memory type filter
    TAG = "tag"  # Tag filter
    DATE_RANGE = "date_range"  # Date range filter
    IMPORTANCE = "importance"  # Importance level filter
    CUSTOM = "custom"  # Custom filter function


@dataclass
class SearchFilter:
    """
    A filter for search results.
    """
    
    filter_type: SearchFilterType
    value: Any
    
    # For custom filters
    filter_func: Optional[Callable[[Dict], bool]] = None
    description: str = ""
    
    # Combining
    negate: bool = False  # Invert filter
    
    def apply(self, item: Dict) -> bool:
        """
        Apply filter to an item.
        
        Args:
            item: Item dictionary
            
        Returns:
            True if item passes filter
        """
        if self.filter_func:
            result = self.filter_func(item)
        else:
            result = self._apply_builtin_filter(item)
        
        return not result if self.negate else result
    
    def _apply_builtin_filter(self, item: Dict) -> bool:
        """Apply built-in filter logic."""
        if self.filter_type == SearchFilterType.TYPE:
            return item.get("memory_type") == self.value
        
        elif self.filter_type == SearchFilterType.TAG:
            tags = item.get("tags", [])
            if isinstance(self.value, list):
                return any(tag in tags for tag in self.value)
            return self.value in tags
        
        elif self.filter_type == SearchFilterType.DATE_RANGE:
            created_at = item.get("created_at")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            
            if self.value.get("from") and created_at < self.value["from"]:
                return False
            if self.value.get("to") and created_at > self.value["to"]:
                return False
            return True
        
        elif self.filter_type == SearchFilterType.IMPORTANCE:
            return item.get("importance") == self.value
        
        return True


@dataclass
class SearchQuery:
    """
    A semantic search query.
    """
    
    user_id: str
    query_text: str
    
    # Model selection
    embedding_model: EmbeddingModel = EmbeddingModel.TFIDF
    
    # Filters
    filters: List[SearchFilter] = field(default_factory=list)
    
    # Search parameters
    max_results: int = 20
    min_similarity: float = 0.1
    include_embeddings: bool = False  # Include embeddings in results
    
    # Boosting
    boost_pinned: float = 0.2  # Similarity boost for pinned items
    boost_recent: float = 0.1  # Similarity boost for recent items
    boost_frequency: float = 0.05  # Similarity boost for frequently accessed
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "query_text": self.query_text,
            "embedding_model": self.embedding_model.value if isinstance(self.embedding_model, Enum) else self.embedding_model,
            "filters": [
                {
                    "filter_type": f.filter_type.value,
                    "value": f.value,
                    "negate": f.negate,
                    "description": f.description,
                }
                for f in self.filters
            ],
            "max_results": self.max_results,
            "min_similarity": self.min_similarity,
            "include_embeddings": self.include_embeddings,
            "boost_pinned": self.boost_pinned,
            "boost_recent": self.boost_recent,
            "boost_frequency": self.boost_frequency,
            "metadata": self.metadata,
        }


@dataclass
class SearchResult:
    """
    Result of a semantic search.
    """
    
    query: SearchQuery
    results: List[Dict]  # List of matching items with scores
    total_candidates: int
    search_time_ms: float
    
    # Metadata
    model_used: EmbeddingModel
    filters_applied: List[str]
    
    # Aggregation
    matched_types: Dict[str, int] = field(default_factory=dict)
    matched_tags: Dict[str, int] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "query": self.query.to_dict(),
            "results": self.results,
            "total_candidates": self.total_candidates,
            "search_time_ms": self.search_time_ms,
            "model_used": self.model_used.value if isinstance(self.model_used, Enum) else self.model_used,
            "filters_applied": self.filters_applied,
            "matched_types": self.matched_types,
            "matched_tags": self.matched_tags,
        }
    
    def get_top_results(self, n: int = 5) -> List[Dict]:
        """Get top N results."""
        return self.results[:n]
    
    def get_by_type(self, memory_type: str) -> List[Dict]:
        """Get results filtered by memory type."""
        return [
            r for r in self.results
            if r.get("memory_type") == memory_type
        ]
    
    def get_by_tag(self, tag: str) -> List[Dict]:
        """Get results filtered by tag."""
        return [
            r for r in self.results
            if tag in r.get("tags", [])
        ]


@dataclass
class IndexedItem:
    """
    An item indexed for search.
    """
    
    id: str
    user_id: str
    content: str
    summary: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    
    # Metadata
    memory_type: str = ""
    importance: str = "medium"
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_pinned: bool = False
    embedding: Optional[List[float]] = None
    
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "content": self.content,
            "summary": self.summary,
            "tags": self.tags,
            "memory_type": self.memory_type,
            "importance": self.importance,
            "created_at": self.created_at.isoformat(),
            "is_pinned": self.is_pinned,
            "embedding": self.embedding,
            "metadata": self.metadata,
        }


class SearchSystem:
    """
    Semantic search system with embeddings and vector storage.
    
    Provides:
    - Embedding generation
    - Vector storage
    - Similarity search
    - Filter support
    """
    
    def __init__(
        self,
        embedding_generator: Optional["EmbeddingGenerator"] = None,
        vector_store: Optional["VectorStore"] = None,
    ):
        """
        Initialize search system.
        
        Args:
            embedding_generator: Optional embedding generator
            vector_store: Optional vector store
        """
        self._embedding_generator = embedding_generator
        self._vector_store = vector_store
        
        # In-memory fallback storage
        self._items: Dict[str, IndexedItem] = {}
        self._user_items: Dict[str, Set[str]] = {}
        
        # Simple TF-IDF fallback
        self._tfidf_index: Dict[str, Dict[str, float]] = {}  # user_id -> term -> idf
        self._tfidf_doc_freq: Dict[str, Dict[str, int]] = {}  # user_id -> term -> doc count
    
    def index_item(
        self,
        item: IndexedItem,
        generate_embedding: bool = True,
    ) -> None:
        """
        Index an item for search.
        
        Args:
            item: Item to index
            generate_embedding: Whether to generate embedding
        """
        # Generate embedding if needed and available
        if generate_embedding and item.embedding is None and self._embedding_generator:
            text = f"{item.content} {item.summary or ''} {' '.join(item.tags)}"
            item.embedding = self._embedding_generator.generate(text)
        
        # Store item
        self._items[item.id] = item
        self._user_items.setdefault(item.user_id, set()).add(item.id)
        
        # Update TF-IDF index
        self._update_tfidf(item)
        
        # Index in vector store if available
        if self._vector_store and item.embedding:
            self._vector_store.upsert(item.id, item.embedding, item.to_dict())
    
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
        
        # Remove from user index
        if item.user_id in self._user_items:
            self._user_items[item.user_id].discard(item_id)
        
        # Remove from TF-IDF index
        self._remove_from_tfidf(item)
        
        # Remove from vector store
        if self._vector_store:
            self._vector_store.delete(item_id)
        
        del self._items[item_id]
        return True
    
    def search(self, query: SearchQuery) -> SearchResult:
        """
        Perform semantic search.
        
        Args:
            query: SearchQuery object
            
        Returns:
            SearchResult
        """
        start_time = datetime.utcnow()
        
        # Generate query embedding
        query_embedding = None
        if self._embedding_generator:
            query_embedding = self._embedding_generator.generate(query.query_text)
        
        # Get candidate items
        candidates = self._get_candidates(query)
        
        # Calculate similarity scores
        scored_items = []
        for item in candidates:
            score = self._calculate_similarity(
                item,
                query_embedding,
                query,
            )
            
            if score >= query.min_similarity:
                scored_items.append((item, score))
        
        # Apply filters
        filtered_items = []
        for item, score in scored_items:
            item_dict = item.to_dict()
            item_dict["similarity_score"] = score
            
            if self._passes_filters(item_dict, query.filters):
                filtered_items.append((item, score))
        
        # Sort by score
        filtered_items.sort(key=lambda x: x[1], reverse=True)
        
        # Apply limit
        top_items = filtered_items[:query.max_results]
        
        # Build results
        results = []
        matched_types: Dict[str, int] = {}
        matched_tags: Dict[str, int] = {}
        
        for item, score in top_items:
            item_dict = item.to_dict()
            item_dict["similarity_score"] = score
            
            # Optionally include embedding
            if not query.include_embeddings:
                item_dict.pop("embedding", None)
            
            results.append(item_dict)
            
            # Track aggregations
            matched_types[item.memory_type] = matched_types.get(item.memory_type, 0) + 1
            for tag in item.tags:
                matched_tags[tag] = matched_tags.get(tag, 0) + 1
        
        search_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return SearchResult(
            query=query,
            results=results,
            total_candidates=len(candidates),
            search_time_ms=search_time,
            model_used=query.embedding_model,
            filters_applied=[f.description or f.filter_type.value for f in query.filters],
            matched_types=matched_types,
            matched_tags=matched_tags,
        )
    
    def search_by_embedding(
        self,
        user_id: str,
        embedding: List[float],
        max_results: int = 20,
        min_similarity: float = 0.1,
    ) -> List[Dict]:
        """
        Search by embedding vector directly.
        
        Args:
            user_id: User identifier
            embedding: Query embedding vector
            max_results: Maximum results
            min_similarity: Minimum similarity threshold
            
        Returns:
            List of matching items with scores
        """
        user_item_ids = self._user_items.get(user_id, set())
        
        results = []
        for item_id in user_item_ids:
            item = self._items.get(item_id)
            if not item or not item.embedding:
                continue
            
            # Calculate cosine similarity
            similarity = self._cosine_similarity(embedding, item.embedding)
            
            if similarity >= min_similarity:
                results.append({
                    **item.to_dict(),
                    "similarity_score": similarity,
                })
        
        # Sort and limit
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:max_results]
    
    def update_embedding(
        self,
        item_id: str,
        new_embedding: Optional[List[float]] = None,
    ) -> bool:
        """
        Update embedding for an item.
        
        Args:
            item_id: Item identifier
            new_embedding: Optional new embedding (re-generates if None)
            
        Returns:
            True if updated
        """
        if item_id not in self._items:
            return False
        
        item = self._items[item_id]
        
        if new_embedding is None and self._embedding_generator:
            text = f"{item.content} {item.summary or ''} {' '.join(item.tags)}"
            new_embedding = self._embedding_generator.generate(text)
        
        item.embedding = new_embedding
        
        # Update vector store
        if self._vector_store and new_embedding:
            self._vector_store.upsert(item_id, new_embedding, item.to_dict())
        
        return True
    
    def reindex_user(
        self,
        user_id: str,
        generate_embeddings: bool = True,
    ) -> int:
        """
        Reindex all items for a user.
        
        Args:
            user_id: User identifier
            generate_embeddings: Whether to generate embeddings
            
        Returns:
            Number of items reindexed
        """
        user_item_ids = self._user_items.get(user_id, set())
        count = 0
        
        for item_id in list(user_item_ids):
            item = self._items.get(item_id)
            if item:
                self.index_item(item, generate_embedding=generate_embeddings)
                count += 1
        
        return count
    
    def _get_candidates(self, query: SearchQuery) -> List[IndexedItem]:
        """Get candidate items for query."""
        user_item_ids = self._user_items.get(query.user_id, set())
        
        items = []
        for item_id in user_item_ids:
            item = self._items.get(item_id)
            if item:
                items.append(item)
        
        return items
    
    def _calculate_similarity(
        self,
        item: IndexedItem,
        query_embedding: Optional[List[float]],
        query: SearchQuery,
    ) -> float:
        """Calculate similarity score with boosts."""
        base_score = 0.0
        
        # Use vector similarity if available
        if query_embedding and item.embedding:
            base_score = self._cosine_similarity(query_embedding, item.embedding)
        else:
            # Fallback to TF-IDF
            base_score = self._tfidf_similarity(item, query.query_text)
        
        # Apply boosts
        if item.is_pinned:
            base_score = min(1.0, base_score + query.boost_pinned)
        
        # Recent boost
        days_old = (datetime.utcnow() - item.created_at).days
        if days_old < 7:
            base_score = min(1.0, base_score + query.boost_recent)
        
        return base_score
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between vectors."""
        if len(a) != len(b) or not a or not b:
            return 0.0
        
        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = sum(x * x for x in a) ** 0.5
        magnitude_b = sum(x * x for x in b) ** 0.5
        
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        
        return dot_product / (magnitude_a * magnitude_b)
    
    def _tfidf_similarity(
        self,
        item: IndexedItem,
        query_text: str,
    ) -> float:
        """Calculate TF-IDF similarity (fallback)."""
        if not query_text:
            return 0.0
        
        # Simple tokenization
        import re
        query_terms = set(re.findall(r'\w+', query_text.lower()))
        item_text = f"{item.content} {item.summary or ''} {' '.join(item.tags)}"
        item_terms = set(re.findall(r'\w+', item_text.lower()))
        
        if not query_terms:
            return 0.0
        
        # Calculate Jaccard similarity as fallback
        intersection = query_terms & item_terms
        union = query_terms | item_terms
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)
    
    def _passes_filters(
        self,
        item: Dict,
        filters: List[SearchFilter],
    ) -> bool:
        """Check if item passes all filters."""
        for filter in filters:
            if not filter.apply(item):
                return False
        return True
    
    def _update_tfidf(self, item: IndexedItem) -> None:
        """Update TF-IDF index for an item."""
        import re
        user_id = item.user_id
        
        if user_id not in self._tfidf_doc_freq:
            self._tfidf_doc_freq[user_id] = {}
        
        # Extract terms
        text = f"{item.content} {item.summary or ''}"
        terms = set(re.findall(r'\w+', text.lower()))
        
        for term in terms:
            self._tfidf_doc_freq[user_id][term] = self._tfidf_doc_freq[user_id].get(term, 0) + 1
    
    def _remove_from_tfidf(self, item: IndexedItem) -> None:
        """Remove item from TF-IDF index."""
        # Simplified: just decrement counts
        # In production, would need proper document removal
        pass
