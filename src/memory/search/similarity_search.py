"""
Similarity Search - Similarity calculation and search algorithms.

Provides:
- Multiple similarity metrics
- Search result ranking
- Diversity-aware search
"""

from typing import Dict, List, Optional, Tuple, Callable
from dataclasses import dataclass
import math


@dataclass
class SearchConfig:
    """Configuration for similarity search."""
    
    # Similarity metric
    metric: str = "cosine"  # cosine, euclidean, dot_product
    
    # Search parameters
    k: int = 10  # Number of results
    min_score: float = 0.0  # Minimum similarity
    
    # Diversity
    enable_diversity: bool = True
    diversity_threshold: float = 0.8  # MMR-style diversity
    
    # Hybrid search
    enable_hybrid: bool = False
    keyword_weight: float = 0.3
    semantic_weight: float = 0.7
    
    # Filters
    filter_func: Optional[Callable[[Dict], bool]] = None


class SimilaritySearch:
    """
    Similarity search engine with multiple metrics.
    
    Provides:
    - Cosine similarity
    - Euclidean distance
    - Dot product similarity
    - Diversity-aware search (MMR)
    - Hybrid search
    """
    
    def __init__(self, config: Optional[SearchConfig] = None):
        """
        Initialize similarity search.
        
        Args:
            config: Optional search configuration
        """
        self._config = config or SearchConfig()
    
    def set_config(self, config: SearchConfig) -> None:
        """Set search configuration."""
        self._config = config
    
    def search(
        self,
        query_vector: List[float],
        candidates: List[Tuple[str, List[float], Dict]],
        include_scores: bool = True,
    ) -> List[Dict]:
        """
        Search for similar vectors.
        
        Args:
            query_vector: Query embedding vector
            candidates: List of (id, vector, metadata) tuples
            include_scores: Include similarity scores in results
            
        Returns:
            List of result dictionaries
        """
        # Calculate similarities
        scored = []
        for item_id, vector, metadata in candidates:
            score = self._calculate_similarity(query_vector, vector)
            
            if score >= self._config.min_score:
                scored.append((item_id, vector, metadata, score))
        
        # Sort by score
        scored.sort(key=lambda x: x[3], reverse=True)
        
        # Apply diversity if enabled
        if self._config.enable_diversity and self._config.diversity_threshold > 0:
            scored = self._apply_diversity(scored)
        
        # Apply limit
        results = scored[:self._config.k]
        
        # Build results
        if include_scores:
            return [
                {
                    "id": item_id,
                    "metadata": metadata,
                    "similarity_score": score,
                }
                for item_id, _, metadata, score in results
            ]
        else:
            return [
                {"id": item_id, "metadata": metadata}
                for item_id, _, metadata, _ in results
            ]
    
    def search_with_keyword(
        self,
        query_vector: List[float],
        query_text: str,
        candidates: List[Tuple[str, List[float], str, Dict]],
        include_scores: bool = True,
    ) -> List[Dict]:
        """
        Hybrid search combining semantic and keyword search.
        
        Args:
            query_vector: Query embedding vector
            query_text: Raw query text for keyword matching
            candidates: List of (id, vector, text, metadata) tuples
            include_scores: Include scores in results
            
        Returns:
            List of result dictionaries with combined scores
        """
        keyword_weight = self._config.keyword_weight
        semantic_weight = self._config.semantic_weight
        
        # Calculate combined scores
        scored = []
        for item_id, vector, text, metadata in candidates:
            # Semantic similarity
            semantic_score = self._calculate_similarity(query_vector, vector)
            
            # Keyword similarity (simple overlap)
            keyword_score = self._keyword_similarity(query_text, text)
            
            # Combined score
            combined = (
                semantic_weight * semantic_score +
                keyword_weight * keyword_score
            )
            
            if combined >= self._config.min_score:
                scored.append((item_id, vector, text, metadata, combined))
        
        # Sort and limit
        scored.sort(key=lambda x: x[4], reverse=True)
        results = scored[:self._config.k]
        
        if include_scores:
            return [
                {
                    "id": item_id,
                    "metadata": metadata,
                    "similarity_score": score,
                    "semantic_score": semantic_score,
                    "keyword_score": keyword_score,
                }
                for item_id, _, _, metadata, score in results
            ]
        else:
            return [
                {"id": item_id, "metadata": metadata}
                for item_id, _, _, metadata, _ in results
            ]
    
    def rerank(
        self,
        query_vector: List[float],
        results: List[Dict],
        get_vector_func: Callable[[str], Optional[List[float]]],
    ) -> List[Dict]:
        """
        Rerank search results.
        
        Args:
            query_vector: Query vector
            results: Initial results
            get_vector_func: Function to get vector by ID
            
        Returns:
            Reranked results
        """
        reranked = []
        
        for result in results:
            item_id = result.get("id")
            vector = get_vector_func(item_id)
            
            if vector:
                score = self._calculate_similarity(query_vector, vector)
                result["reranked_score"] = score
                reranked.append(result)
            else:
                result["reranked_score"] = result.get("similarity_score", 0)
                reranked.append(result)
        
        reranked.sort(key=lambda x: x.get("reranked_score", 0), reverse=True)
        return reranked
    
    def _calculate_similarity(
        self,
        a: List[float],
        b: List[float],
    ) -> float:
        """Calculate similarity between vectors."""
        if self._config.metric == "cosine":
            return self._cosine_similarity(a, b)
        elif self._config.metric == "euclidean":
            return self._euclidean_similarity(a, b)
        elif self._config.metric == "dot_product":
            return self._dot_product(a, b)
        else:
            return self._cosine_similarity(a, b)
    
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
    
    def _euclidean_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate similarity from Euclidean distance."""
        if len(a) != len(b):
            return 0.0
        
        distance = sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5
        
        # Convert distance to similarity (0-1)
        # Assuming max distance is sqrt(dimension)
        max_dist = len(a) ** 0.5
        return max(0, 1 - distance / max_dist)
    
    def _dot_product(self, a: List[float], b: List[float]) -> float:
        """Calculate dot product (not normalized)."""
        if len(a) != len(b):
            return 0.0
        
        # Normalize to 0-1 range
        dot = sum(x * y for x, y in zip(a, b))
        return (dot + 1) / 2  # Shift to 0-1 range
    
    def _keyword_similarity(self, query: str, text: str) -> float:
        """Calculate simple keyword overlap."""
        import re
        
        query_terms = set(re.findall(r'\w+', query.lower()))
        text_terms = set(re.findall(r'\w+', text.lower()))
        
        if not query_terms or not text_terms:
            return 0.0
        
        intersection = query_terms & text_terms
        union = query_terms | text_terms
        
        return len(intersection) / len(union)
    
    def _apply_diversity(
        self,
        items: List[Tuple],
    ) -> List[Tuple]:
        """
        Apply MMR-style diversity.
        
        Args:
            items: List of (id, vector, metadata, score) tuples
            
        Returns:
            Diversified list
        """
        if len(items) <= 1:
            return items
        
        selected = []
        remaining = list(items)
        
        # Select highest scoring item first
        selected.append(remaining.pop(0))
        
        # Select remaining items with diversity
        while remaining:
            best_idx = 0
            best_score = -1
            
            for i, item in enumerate(remaining):
                item_id, item_vector, metadata, score = item
                
                # Calculate minimum similarity to selected items (for diversity)
                min_sim = 1.0
                for sel_id, sel_vector, _, _ in selected:
                    sim = self._cosine_similarity(item_vector, sel_vector)
                    min_sim = min(min_sim, sim)
                
                # MMR: alpha * score + (1 - alpha) * diversity
                alpha = 1 - self._config.diversity_threshold
                mmr_score = alpha * score + self._config.diversity_threshold * (1 - min_sim)
                
                if mmr_score > best_score:
                    best_score = mmr_score
                    best_idx = i
            
            selected.append(remaining.pop(best_idx))
        
        return selected


class DiversitySearch:
    """
    Diversity-aware search for result diversification.
    
    Provides:
    - Max Marginal Relevance (MMR)
    - Aspect diversity
    - Coverage optimization
    """
    
    def __init__(self):
        """Initialize diversity search."""
        pass
    
    def diversify(
        self,
        results: List[Dict],
        query_vector: List[float],
        get_vector_func: Callable[[str], Optional[List[float]]],
        lambda_param: float = 0.5,
    ) -> List[Dict]:
        """
        Diversify search results using MMR.
        
        Args:
            results: Initial results
            query_vector: Query vector
            get_vector_func: Function to get vector by ID
            lambda_param: Balance between relevance (1-lambda) and diversity (lambda)
            
        Returns:
            Diversified results
        """
        if len(results) <= 1:
            return results
        
        selected = []
        remaining = list(results)
        
        # Select highest scoring item
        remaining.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)
        selected.append(remaining.pop(0))
        
        # Select remaining with MMR
        while remaining:
            best_idx = 0
            best_mmr = -1
            
            for i, result in enumerate(remaining):
                result_vector = get_vector_func(result.get("id"))
                if not result_vector:
                    continue
                
                # Relevance to query
                relevance = self._cosine_similarity(query_vector, result_vector)
                
                # Maximum similarity to selected (for diversity)
                max_sim = 0
                for sel in selected:
                    sel_vector = get_vector_func(sel.get("id"))
                    if sel_vector:
                        sim = self._cosine_similarity(result_vector, sel_vector)
                        max_sim = max(max_sim, sim)
                
                # MMR score
                mmr = lambda_param * relevance + (1 - lambda_param) * (1 - max_sim)
                
                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = i
            
            if remaining:
                selected.append(remaining.pop(best_idx))
        
        return selected
    
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


class BM25Similarity:
    """
    BM25 ranking for keyword search.
    
    Provides:
    - Okapi BM25 ranking
    - Configurable parameters
    """
    
    def __init__(
        self,
        k1: float = 1.5,
        b: float = 0.75,
        avg_doc_length: float = 100,
    ):
        """
        Initialize BM25.
        
        Args:
            k1: Term frequency saturation parameter
            b: Document length normalization
            avg_doc_length: Average document length
        """
        self._k1 = k1
        self._b = b
        self._avg_doc_length = avg_doc_length
        self._doc_lengths: Dict[str, float] = {}
        self._doc_term_freq: Dict[str, Dict[str, int]] = {}
        self._doc_count = 0
        self._term_doc_freq: Dict[str, int] = {}
    
    def add_document(
        self,
        doc_id: str,
        text: str,
        metadata: Optional[Dict] = None,
    ) -> None:
        """Add a document to the index."""
        import re
        
        # Tokenize
        terms = re.findall(r'\w+', text.lower())
        self._doc_lengths[doc_id] = len(terms)
        
        # Term frequencies
        term_freq = {}
        for term in terms:
            term_freq[term] = term_freq.get(term, 0) + 1
            self._term_doc_freq[term] = self._term_doc_freq.get(term, 0) + 1
        
        self._doc_term_freq[doc_id] = term_freq
        self._doc_count += 1
    
    def search(
        self,
        query: str,
        documents: List[Tuple[str, str, Dict]],
        k: int = 10,
    ) -> List[Dict]:
        """
        Search using BM25.
        
        Args:
            query: Query string
            documents: List of (id, text, metadata) tuples
            k: Number of results
            
        Returns:
            List of result dictionaries
        """
        import re
        
        # Tokenize query
        query_terms = re.findall(r'\w+', query.lower())
        
        if not query_terms:
            return []
        
        # Score documents
        scores = []
        for doc_id, text, metadata in documents:
            score = self._calculate_bm25(doc_id, query_terms)
            if score > 0:
                scores.append({
                    "id": doc_id,
                    "metadata": metadata,
                    "bm25_score": score,
                })
        
        # Sort and limit
        scores.sort(key=lambda x: x["bm25_score"], reverse=True)
        return scores[:k]
    
    def _calculate_bm25(
        self,
        doc_id: str,
        query_terms: List[str],
    ) -> float:
        """Calculate BM25 score for a document."""
        if doc_id not in self._doc_term_freq:
            return 0.0
        
        doc_len = self._doc_lengths.get(doc_id, 0)
        term_freq = self._doc_term_freq[doc_id]
        
        score = 0.0
        
        for term in query_terms:
            if term not in term_freq:
                continue
            
            tf = term_freq[term]
            df = self._term_doc_freq.get(term, 0)
            
            if df == 0:
                continue
            
            # IDF
            idf = math.log((self._doc_count - df + 0.5) / (df + 0.5))
            
            # TF component
            tf_component = (tf * (self._k1 + 1)) / (
                tf + self._k1 * (1 - self._b + self._b * doc_len / self._avg_doc_length)
            )
            
            score += idf * tf_component
        
        return score
