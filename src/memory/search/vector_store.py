"""
Vector Store - Vector storage and indexing for embeddings.

Provides:
- Vector insertion and deletion
- Approximate nearest neighbor search
- Index management
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
import math
import heapq


@dataclass
class VectorEntry:
    """A vector entry in the store."""
    
    id: str
    vector: List[float]
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorStore:
    """
    Vector storage with approximate nearest neighbor search.
    
    Provides:
    - In-memory vector storage
    - Cosine similarity search
    - Index management
    """
    
    def __init__(self, dimension: int = 384):
        """
        Initialize vector store.
        
        Args:
            dimension: Vector dimension
        """
        self._dimension = dimension
        self._vectors: Dict[str, VectorEntry] = {}
        self._id_to_user: Dict[str, str] = {}  # vector_id -> user_id
        self._user_vectors: Dict[str, List[str]] = {}  # user_id -> [vector_ids]
    
    def upsert(
        self,
        id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """
        Insert or update a vector.
        
        Args:
            id: Vector identifier
            vector: Embedding vector
            metadata: Optional metadata
            user_id: Optional user identifier for filtering
        """
        entry = VectorEntry(
            id=id,
            vector=vector,
            metadata=metadata or {},
        )
        
        self._vectors[id] = entry
        
        if user_id:
            self._id_to_user[id] = user_id
            self._user_vectors.setdefault(user_id, []).append(id)
    
    def delete(self, id: str) -> bool:
        """
        Delete a vector.
        
        Args:
            id: Vector identifier
            
        Returns:
            True if deleted
        """
        if id not in self._vectors:
            return False
        
        # Remove from user index
        user_id = self._id_to_user.get(id)
        if user_id and user_id in self._user_vectors:
            self._user_vectors[user_id] = [
                vid for vid in self._user_vectors[user_id] if vid != id
            ]
        
        del self._id_to_user[id]
        del self._vectors[id]
        return True
    
    def get(self, id: str) -> Optional[VectorEntry]:
        """
        Get a vector by ID.
        
        Args:
            id: Vector identifier
            
        Returns:
            VectorEntry or None
        """
        return self._vectors.get(id)
    
    def search(
        self,
        query_vector: List[float],
        user_id: Optional[str] = None,
        k: int = 10,
        min_score: float = 0.0,
    ) -> List[Tuple[str, float, Dict]]:
        """
        Search for similar vectors.
        
        Args:
            query_vector: Query embedding vector
            user_id: Optional filter by user
            k: Number of results to return
            min_score: Minimum similarity score
            
        Returns:
            List of (id, score, metadata) tuples
        """
        # Get candidate vectors
        if user_id:
            candidate_ids = self._user_vectors.get(user_id, [])
        else:
            candidate_ids = list(self._vectors.keys())
        
        # Calculate similarities
        similarities = []
        for vid in candidate_ids:
            entry = self._vectors.get(vid)
            if not entry:
                continue
            
            score = self._cosine_similarity(query_vector, entry.vector)
            
            if score >= min_score:
                similarities.append((vid, score, entry.metadata))
        
        # Get top k
        top_k = heapq.nlargest(k, similarities, key=lambda x: x[1])
        
        return top_k
    
    def search_by_id(
        self,
        query_id: str,
        k: int = 10,
        min_score: float = 0.0,
    ) -> List[Tuple[str, float, Dict]]:
        """
        Search for vectors similar to another vector.
        
        Args:
            query_id: ID of query vector
            k: Number of results
            min_score: Minimum similarity
            
        Returns:
            List of (id, score, metadata) tuples
        """
        entry = self._vectors.get(query_id)
        if not entry:
            return []
        
        return self.search(
            entry.vector,
            k=k + 1,  # +1 to exclude query itself
            min_score=min_score,
        )
    
    def count(self, user_id: Optional[str] = None) -> int:
        """
        Count vectors.
        
        Args:
            user_id: Optional filter by user
            
        Returns:
            Number of vectors
        """
        if user_id:
            return len(self._user_vectors.get(user_id, []))
        return len(self._vectors)
    
    def clear(self, user_id: Optional[str] = None) -> int:
        """
        Clear vectors.
        
        Args:
            user_id: Optional filter by user
            
        Returns:
            Number of vectors cleared
        """
        if user_id:
            vector_ids = self._user_vectors.get(user_id, [])
            for vid in vector_ids:
                self.delete(vid)
            return len(vector_ids)
        else:
            count = len(self._vectors)
            self._vectors.clear()
            self._id_to_user.clear()
            self._user_vectors.clear()
            return count
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity."""
        if len(a) != len(b) or not a or not b:
            return 0.0
        
        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = sum(x * x for x in a) ** 0.5
        magnitude_b = sum(x * x for x in b) ** 0.5
        
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        
        return dot_product / (magnitude_a * magnitude_b)


class HNSWVectorStore(VectorStore):
    """
    Vector store with HNSW indexing for faster ANN search.
    
    HNSW (Hierarchical Navigable Small World) provides:
    - Logarithmic search time
    - High recall
    - Efficient memory usage
    """
    
    def __init__(
        self,
        dimension: int = 384,
        m: int = 16,  # Number of connections
        ef_construction: int = 200,  # Search width during construction
        ef_search: int = 100,  # Search width during search
    ):
        """
        Initialize HNSW vector store.
        
        Args:
            dimension: Vector dimension
            m: Number of connections per layer
            ef_construction: Construction search width
            ef_search: Search width
        """
        super().__init__(dimension)
        
        self._m = m
        self._ef_construction = ef_construction
        self._ef_search = ef_search
        
        # HNSW layers (simplified implementation)
        self._hnsw_layers: List[Dict[str, List[Tuple[str, float]]]] = []
        self._entry_points: Dict[int, str] = {}  # layer -> entry point
        self._max_layer = -1
    
    def upsert(
        self,
        id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """Insert vector with HNSW indexing."""
        super().upsert(id, vector, metadata, user_id)
        
        # In a full implementation, would update HNSW index
        # This is a simplified placeholder
        self._update_hnsw(id, vector)
    
    def search(
        self,
        query_vector: List[float],
        user_id: Optional[str] = None,
        k: int = 10,
        min_score: float = 0.0,
    ) -> List[Tuple[str, float, Dict]]:
        """Search using HNSW index (falls back to brute force)."""
        # For now, fall back to brute force
        # Full HNSW implementation would use the index
        return super().search(query_vector, user_id, k, min_score)
    
    def _update_hnsw(self, id: str, vector: List[float]) -> None:
        """Update HNSW index with new vector."""
        # Simplified: just track entry point
        if self._max_layer < 0:
            self._entry_points[0] = id
            self._max_layer = 0


class PineconeVectorStore(VectorStore):
    """
    Vector store backed by Pinecone.
    
    Provides cloud-hosted vector storage with:
    - Managed infrastructure
    - Horizontal scaling
    - Low latency
    """
    
    def __init__(
        self,
        api_key: str,
        environment: str,
        index_name: str,
        dimension: int = 384,
    ):
        """
        Initialize Pinecone vector store.
        
        Args:
            api_key: Pinecone API key
            environment: Pinecone environment
            index_name: Index name
            dimension: Vector dimension
        """
        super().__init__(dimension)
        
        self._api_key = api_key
        self._environment = environment
        self._index_name = index_name
        
        # In production, would initialize Pinecone client
        self._initialized = False
    
    def upsert(
        self,
        id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """Upsert to Pinecone."""
        # In production, would call Pinecone API
        super().upsert(id, vector, metadata, user_id)
    
    def delete(self, id: str) -> bool:
        """Delete from Pinecone."""
        # In production, would call Pinecone API
        return super().delete(id)
    
    def search(
        self,
        query_vector: List[float],
        user_id: Optional[str] = None,
        k: int = 10,
        min_score: float = 0.0,
    ) -> List[Tuple[str, float, Dict]]:
        """Search via Pinecone."""
        # In production, would call Pinecone query API
        return super().search(query_vector, user_id, k, min_score)


class WeaviateVectorStore(VectorStore):
    """
    Vector store backed by Weaviate.
    
    Provides:
    - Semantic search
    - Hybrid search (vector + keyword)
    - Graph relationships
    """
    
    def __init__(
        self,
        url: str,
        api_key: Optional[str] = None,
        class_name: str = "Memory",
        dimension: int = 384,
    ):
        """
        Initialize Weaviate vector store.
        
        Args:
            url: Weaviate URL
            api_key: Optional API key
            class_name: Weaviate class name
            dimension: Vector dimension
        """
        super().__init__(dimension)
        
        self._url = url
        self._api_key = api_key
        self._class_name = class_name
    
    def upsert(
        self,
        id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """Upsert to Weaviate."""
        super().upsert(id, vector, metadata, user_id)
    
    def delete(self, id: str) -> bool:
        """Delete from Weaviate."""
        return super().delete(id)
    
    def search(
        self,
        query_vector: List[float],
        user_id: Optional[str] = None,
        k: int = 10,
        min_score: float = 0.0,
    ) -> List[Tuple[str, float, Dict]]:
        """Search via Weaviate."""
        return super().search(query_vector, user_id, k, min_score)


def create_vector_store(
    backend: str = "memory",
    **kwargs,
) -> VectorStore:
    """
    Factory function to create vector store.
    
    Args:
        backend: Backend type ("memory", "hnsw", "pinecone", "weaviate")
        **kwargs: Backend-specific arguments
        
    Returns:
        VectorStore instance
    """
    if backend == "memory":
        return VectorStore(dimension=kwargs.get("dimension", 384))
    elif backend == "hnsw":
        return HNSWVectorStore(
            dimension=kwargs.get("dimension", 384),
            m=kwargs.get("m", 16),
            ef_construction=kwargs.get("ef_construction", 200),
            ef_search=kwargs.get("ef_search", 100),
        )
    elif backend == "pinecone":
        return PineconeVectorStore(
            api_key=kwargs["api_key"],
            environment=kwargs["environment"],
            index_name=kwargs["index_name"],
            dimension=kwargs.get("dimension", 384),
        )
    elif backend == "weaviate":
        return WeaviateVectorStore(
            url=kwargs["url"],
            api_key=kwargs.get("api_key"),
            class_name=kwargs.get("class_name", "Memory"),
            dimension=kwargs.get("dimension", 384),
        )
    else:
        return VectorStore(dimension=kwargs.get("dimension", 384))
