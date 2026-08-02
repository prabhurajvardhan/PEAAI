"""
Relevance Scorer - Calculates relevance scores for memory items.

Provides:
- Text relevance scoring
- Importance scoring
- Access frequency scoring
"""

from typing import Dict, Set
from .retrieval_system import MemoryItem, RetrievalQuery, ImportanceLevel
import math


class RelevanceScorer:
    """
    Calculates relevance scores for memory items.
    
    Supports:
    - TF-IDF-like text matching
    - Importance-based scoring
    - Access frequency scoring
    """
    
    def __init__(self):
        """Initialize relevance scorer."""
        self._stop_words: Set[str] = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at",
            "to", "for", "of", "with", "by", "from", "as", "is", "was",
            "are", "were", "been", "be", "have", "has", "had", "do", "does",
            "did", "will", "would", "could", "should", "may", "might", "must",
            "shall", "can", "need", "it", "its", "this", "that", "these", "those",
        }
    
    def calculate_relevance(
        self,
        item: MemoryItem,
        query: RetrievalQuery,
    ) -> float:
        """
        Calculate text relevance score.
        
        Args:
            item: Memory item
            query: Retrieval query
            
        Returns:
            Relevance score 0-1
        """
        if not query.query_text:
            return item.relevance_score
        
        # Tokenize query
        query_terms = self._tokenize(query.query_text)
        
        # Get item text
        item_text = self._get_item_text(item)
        item_terms = self._tokenize(item_text)
        
        if not query_terms or not item_terms:
            return 0.0
        
        # Calculate term frequency
        item_tf = self._calculate_term_frequency(item_terms)
        query_tf = self._calculate_term_frequency(query_terms)
        
        # Calculate relevance using dot product
        dot_product = sum(
            item_tf.get(term, 0) * query_tf.get(term, 0)
            for term in query_terms
        )
        
        # Normalize
        item_magnitude = math.sqrt(sum(v ** 2 for v in item_tf.values()))
        query_magnitude = math.sqrt(sum(v ** 2 for v in query_tf.values()))
        
        if item_magnitude == 0 or query_magnitude == 0:
            return 0.0
        
        cosine_similarity = dot_product / (item_magnitude * query_magnitude)
        
        # Boost for exact phrase matches
        query_phrase = query.query_text.lower()
        if query_phrase in item_text.lower():
            cosine_similarity = min(1.0, cosine_similarity + 0.3)
        
        # Boost for tag matches
        tag_matches = sum(1 for term in query_terms if term in item.tags)
        if tag_matches > 0:
            cosine_similarity = min(1.0, cosine_similarity + 0.1 * tag_matches)
        
        return max(0.0, min(1.0, cosine_similarity))
    
    def calculate_importance(self, item: MemoryItem) -> float:
        """
        Calculate importance score.
        
        Args:
            item: Memory item
            
        Returns:
            Importance score 0-1
        """
        # Base importance from importance level
        importance_scores = {
            ImportanceLevel.LOW: 0.25,
            ImportanceLevel.MEDIUM: 0.5,
            ImportanceLevel.HIGH: 0.75,
            ImportanceLevel.CRITICAL: 1.0,
        }
        
        base_score = importance_scores.get(item.importance, 0.5)
        
        # Boost for pinned items
        if item.is_pinned:
            base_score = min(1.0, base_score + 0.2)
        
        # Boost for high access count
        access_boost = min(0.1, math.log(1 + item.access_count) / 100)
        base_score += access_boost
        
        return max(0.0, min(1.0, base_score))
    
    def calculate_access_frequency(self, item: MemoryItem) -> float:
        """
        Calculate access frequency score.
        
        Args:
            item: Memory item
            
        Returns:
            Access frequency score 0-1
        """
        if item.access_count == 0:
            return 0.0
        
        # Logarithmic scale
        return min(1.0, math.log(1 + item.access_count) / math.log(101))
    
    def _tokenize(self, text: str) -> Dict[str, int]:
        """
        Tokenize text into terms with frequency.
        
        Args:
            text: Text to tokenize
            
        Returns:
            Dictionary of term -> frequency
        """
        # Simple tokenization
        import re
        words = re.findall(r'\w+', text.lower())
        
        # Remove stop words
        words = [w for w in words if w not in self._stop_words and len(w) > 1]
        
        # Count frequencies
        freq = {}
        for word in words:
            freq[word] = freq.get(word, 0) + 1
        
        return freq
    
    def _get_item_text(self, item: MemoryItem) -> str:
        """
        Get searchable text from item.
        
        Args:
            item: Memory item
            
        Returns:
            Searchable text
        """
        parts = [item.content]
        
        if item.summary:
            parts.append(item.summary)
        
        parts.extend(item.tags)
        
        return " ".join(parts)
    
    def _calculate_term_frequency(
        self,
        terms: Dict[str, int],
    ) -> Dict[str, float]:
        """
        Calculate normalized term frequency.
        
        Args:
            terms: Term frequencies
            
        Returns:
            Normalized TF scores
        """
        if not terms:
            return {}
        
        max_freq = max(terms.values())
        if max_freq == 0:
            return {}
        
        return {
            term: freq / max_freq
            for term, freq in terms.items()
        }
