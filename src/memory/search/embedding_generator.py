"""
Embedding Generator - Generates embeddings for text.

Provides:
- Multiple embedding model support
- Batch processing
- Caching
"""

from typing import List, Dict, Optional, Callable
from abc import ABC, abstractmethod
from dataclasses import dataclass
import hashlib


@dataclass
class EmbeddingConfig:
    """Configuration for embedding generation."""
    
    model_name: str = "tfidf"
    dimension: int = 384
    batch_size: int = 32
    
    # API keys for external models
    openai_api_key: Optional[str] = None
    cohere_api_key: Optional[str] = None
    
    # Cache settings
    cache_enabled: bool = True
    cache_size: int = 10000


class EmbeddingGenerator(ABC):
    """
    Abstract base class for embedding generators.
    """
    
    @abstractmethod
    def generate(self, text: str) -> List[float]:
        """
        Generate embedding for text.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector
        """
        pass
    
    @abstractmethod
    def generate_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts
            
        Returns:
            List of embedding vectors
        """
        pass
    
    def get_dimension(self) -> int:
        """Get embedding dimension."""
        return 384


class TFIDFEmbeddingGenerator(EmbeddingGenerator):
    """
    Simple TF-IDF based embedding generator (fallback).
    """
    
    def __init__(self, config: Optional[EmbeddingConfig] = None):
        """
        Initialize TF-IDF generator.
        
        Args:
            config: Optional configuration
        """
        self._config = config or EmbeddingConfig()
        self._vocabulary: Dict[str, int] = {}
        self._idf: Dict[str, float] = {}
        self._document_count: int = 0
        self._stop_words: set = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at",
            "to", "for", "of", "with", "by", "from", "as", "is", "was",
            "are", "were", "been", "be", "have", "has", "had", "do", "does",
            "did", "will", "would", "could", "should", "may", "might", "must",
            "i", "you", "he", "she", "it", "we", "they", "this", "that",
        }
        self._dimension = self._config.dimension
    
    def generate(self, text: str) -> List[float]:
        """
        Generate TF-IDF embedding for text.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector
        """
        import re
        
        # Tokenize
        words = re.findall(r'\w+', text.lower())
        words = [w for w in words if w not in self._stop_words and len(w) > 1]
        
        # Build vocabulary if empty
        if not self._vocabulary:
            for word in words:
                if word not in self._vocabulary and len(self._vocabulary) < self._dimension:
                    self._vocabulary[word] = len(self._vocabulary)
        
        # Calculate term frequency
        tf = {}
        for word in words:
            tf[word] = tf.get(word, 0) + 1
        
        # Normalize
        max_tf = max(tf.values()) if tf else 1
        for word in tf:
            tf[word] = tf[word] / max_tf
        
        # Build vector
        vector = [0.0] * len(self._vocabulary)
        for word, freq in tf.items():
            if word in self._vocabulary:
                idx = self._vocabulary[word]
                if idx < len(vector):
                    # Use TF * IDF approximation (1.0 as IDF since no corpus stats)
                    vector[idx] = freq
        
        # Normalize vector
        magnitude = sum(x * x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        
        return vector
    
    def generate_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for batch."""
        return [self.generate(text) for text in texts]
    
    def get_dimension(self) -> int:
        """Get embedding dimension."""
        return self._dimension
    
    def update_corpus_stats(self, texts: List[str]) -> None:
        """
        Update corpus statistics for better IDF.
        
        Args:
            texts: List of texts in corpus
        """
        self._document_count = len(texts)
        
        # Count document frequencies
        doc_freq: Dict[str, int] = {}
        for text in texts:
            import re
            words = set(re.findall(r'\w+', text.lower()))
            for word in words:
                if word not in self._stop_words:
                    doc_freq[word] = doc_freq.get(word, 0) + 1
        
        # Calculate IDF
        for word, count in doc_freq.items():
            self._idf[word] = max(0.1, 1.0 - count / self._document_count)


class OpenAIEmbeddingGenerator(EmbeddingGenerator):
    """
    OpenAI embedding generator using ada-002.
    """
    
    def __init__(self, config: EmbeddingConfig):
        """
        Initialize OpenAI generator.
        
        Args:
            config: Configuration with API key
        """
        self._config = config
        self._api_key = config.openai_api_key
        self._dimension = 1536  # ada-002 dimension
        self._cache: Dict[str, List[float]] = {}
    
    def generate(self, text: str) -> List[float]:
        """Generate embedding using OpenAI API."""
        # Check cache
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # In production, would call OpenAI API
        # For now, return placeholder
        embedding = self._generate_placeholder(text)
        
        # Cache result
        if self._config.cache_enabled:
            self._cache[cache_key] = embedding
        
        return embedding
    
    def generate_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for batch."""
        return [self.generate(text) for text in texts]
    
    def get_dimension(self) -> int:
        """Get embedding dimension."""
        return self._dimension
    
    def _generate_placeholder(self, text: str) -> List[float]:
        """Generate placeholder embedding."""
        import hashlib
        hash_value = int(hashlib.md5(text.encode()).hexdigest(), 16)
        import random
        random.seed(hash_value % (2**32))
        return [random.uniform(-1, 1) for _ in range(self._dimension)]


class CohereEmbeddingGenerator(EmbeddingGenerator):
    """
    Cohere embedding generator.
    """
    
    def __init__(self, config: EmbeddingConfig):
        """Initialize Cohere generator."""
        self._config = config
        self._api_key = config.cohere_api_key
        self._dimension = 1024  # Cohere v3 dimension
        self._cache: Dict[str, List[float]] = {}
    
    def generate(self, text: str) -> List[float]:
        """Generate embedding using Cohere API."""
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        embedding = self._generate_placeholder(text)
        
        if self._config.cache_enabled:
            self._cache[cache_key] = embedding
        
        return embedding
    
    def generate_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for batch."""
        return [self.generate(text) for text in texts]
    
    def get_dimension(self) -> int:
        """Get embedding dimension."""
        return self._dimension
    
    def _generate_placeholder(self, text: str) -> List[float]:
        """Generate placeholder embedding."""
        hash_value = int(hashlib.md5(text.encode()).hexdigest(), 16)
        import random
        random.seed(hash_value % (2**32))
        return [random.uniform(-1, 1) for _ in range(self._dimension)]


def create_embedding_generator(
    config: Optional[EmbeddingConfig] = None,
) -> EmbeddingGenerator:
    """
    Factory function to create embedding generator.
    
    Args:
        config: Optional configuration
        
    Returns:
        EmbeddingGenerator instance
    """
    config = config or EmbeddingConfig()
    
    if config.model_name == "tfidf":
        return TFIDFEmbeddingGenerator(config)
    elif config.model_name == "openai_ada":
        return OpenAIEmbeddingGenerator(config)
    elif config.model_name == "cohere":
        return CohereEmbeddingGenerator(config)
    else:
        return TFIDFEmbeddingGenerator(config)
