"""
Context window management for story generation.

Manages token usage and context window for long story generation sessions.
"""
import logging
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass, field
from collections import deque

from .types import StoryPromptContext, StoryGenerationConfig

logger = logging.getLogger(__name__)


@dataclass
class ContextWindow:
    """Represents the current context window state."""
    total_tokens: int
    max_tokens: int
    used_tokens: int
    available_tokens: int
    overflow: bool = False


@dataclass
class MemorySummary:
    """Summary of memory context."""
    key_memories: List[str] = field(default_factory=list)
    character_context: str = ""
    plot_points: List[str] = field(default_factory=list)
    emotional_arc: str = ""


class ContextManager:
    """
    Manages context window for story generation.
    
    Handles:
    - Token counting and budgeting
    - Memory prioritization
    - Context truncation
    - Scene-based context updates
    """
    
    # Approximate token ratios (chars per token)
    CHARS_PER_TOKEN = 4
    
    # Priority levels for context items
    PRIORITY_HIGH = 1
    PRIORITY_MEDIUM = 2
    PRIORITY_LOW = 3
    
    def __init__(
        self,
        max_context_tokens: int = 8192,
        reserved_response_tokens: int = 2048,
        story_prompt_tokens: int = 500,
    ):
        """
        Initialize the context manager.
        
        Args:
            max_context_tokens: Maximum context window size
            reserved_response_tokens: Tokens reserved for LLM response
            story_prompt_tokens: Approximate tokens for story prompt
        """
        self.max_context_tokens = max_context_tokens
        self.reserved_response_tokens = reserved_response_tokens
        self.story_prompt_tokens = story_prompt_tokens
        
        # Available for input
        self.available_input_tokens = (
            max_context_tokens - reserved_response_tokens - story_prompt_tokens
        )
        
        # Context history
        self._context_history: deque = deque(maxlen=100)
        self._scene_contexts: List[Dict[str, Any]] = []
        self._memory_summaries: List[MemorySummary] = []
        
        # Current usage
        self._current_usage = 0
    
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text.
        
        Args:
            text: Text to estimate
        
        Returns:
            Estimated token count
        """
        return len(text) // self.CHARS_PER_TOKEN
    
    def get_available_tokens(self) -> int:
        """Get available tokens for new content."""
        return self.available_input_tokens - self._current_usage
    
    def get_context_window(self) -> ContextWindow:
        """Get current context window state."""
        used = self._current_usage
        available = self.available_input_tokens - used
        overflow = used > self.available_input_tokens
        
        return ContextWindow(
            total_tokens=self.max_context_tokens,
            max_tokens=self.available_input_tokens,
            used_tokens=used,
            available_tokens=max(0, available),
            overflow=overflow,
        )
    
    def add_context(
        self,
        content: str,
        priority: int = PRIORITY_MEDIUM,
        context_type: str = "general",
    ) -> int:
        """
        Add content to the context window.
        
        Args:
            content: Content to add
            priority: Priority level (1=high, 2=medium, 3=low)
            context_type: Type of context for tracking
        
        Returns:
            Tokens used
        """
        tokens = self.estimate_tokens(content)
        
        # Check if we need to truncate
        if self._current_usage + tokens > self.available_input_tokens:
            self._truncate_to_fit(tokens)
        
        # Add to history
        self._context_history.append({
            "content": content,
            "priority": priority,
            "type": context_type,
            "tokens": tokens,
        })
        
        self._current_usage += tokens
        return tokens
    
    def add_scene_context(
        self,
        scene_index: int,
        scene_text: str,
        characters: List[str],
        setting: str,
    ) -> None:
        """
        Add scene-specific context.
        
        Args:
            scene_index: Scene index
            scene_text: Scene text
            characters: Characters in scene
            setting: Scene setting
        """
        scene_context = {
            "index": scene_index,
            "text": scene_text,
            "characters": characters,
            "setting": setting,
            "tokens": self.estimate_tokens(scene_text),
        }
        
        self._scene_contexts.append(scene_context)
        
        # Keep only recent scenes
        if len(self._scene_contexts) > 10:
            self._scene_contexts = self._scene_contexts[-10:]
    
    def build_context_for_scene(
        self,
        base_context: StoryPromptContext,
        scene_index: int,
        config: StoryGenerationConfig,
    ) -> Tuple[str, int]:
        """
        Build context string for generating the next scene.
        
        Args:
            base_context: Base prompt context
            scene_index: Index of scene to generate
            config: Generation configuration
        
        Returns:
            Tuple of (context_string, token_count)
        """
        context_parts = []
        total_tokens = 0
        
        # Add relationship context (high priority)
        if base_context.relationship_context:
            text = f"Relationship: {base_context.relationship_context}"
            tokens = self.estimate_tokens(text)
            if total_tokens + tokens <= self.available_input_tokens:
                context_parts.append(text)
                total_tokens += tokens
        
        # Add recent scene summaries
        if self._scene_contexts:
            recent_scenes = self._scene_contexts[-3:]  # Last 3 scenes
            for scene in recent_scenes:
                # Create brief summary
                summary = f"Scene {scene['index']}: {scene['setting']}"
                if scene['characters']:
                    summary += f" - {', '.join(scene['characters'][:2])}"
                
                tokens = self.estimate_tokens(summary)
                if total_tokens + tokens <= self.available_input_tokens:
                    context_parts.append(summary)
                    total_tokens += tokens
        
        # Add memory summaries
        if self._memory_summaries:
            for summary in self._memory_summaries[-2:]:  # Last 2 summaries
                if summary.key_memories:
                    memories_text = "Key moments: " + "; ".join(summary.key_memories[-2:])
                    tokens = self.estimate_tokens(memories_text)
                    if total_tokens + tokens <= self.available_input_tokens:
                        context_parts.append(memories_text)
                        total_tokens += tokens
        
        # Add previous stories summary
        if base_context.previous_stories_summary:
            text = f"Past stories: {base_context.previous_stories_summary}"
            tokens = self.estimate_tokens(text)
            if total_tokens + tokens <= self.available_input_tokens:
                context_parts.append(text)
                total_tokens += tokens
        
        return "\n".join(context_parts), total_tokens
    
    def update_memory_summary(
        self,
        scene_contexts: List[Dict[str, Any]],
    ) -> MemorySummary:
        """
        Update the memory summary based on recent scenes.
        
        Args:
            scene_contexts: Recent scene contexts
        
        Returns:
            Updated MemorySummary
        """
        summary = MemorySummary()
        
        # Extract key plot points
        if len(scene_contexts) >= 3:
            summary.plot_points = [
                f"Scene {s.get('index', i)}: {s.get('setting', 'Unknown')}"
                for i, s in enumerate(scene_contexts[-3:])
            ]
        
        # Extract characters
        all_characters = set()
        for scene in scene_contexts:
            all_characters.update(scene.get('characters', []))
        summary.character_context = ", ".join(list(all_characters)[:5])
        
        # Store summary
        self._memory_summaries.append(summary)
        
        # Keep only recent summaries
        if len(self._memory_summaries) > 20:
            self._memory_summaries = self._memory_summaries[-20:]
        
        return summary
    
    def _truncate_to_fit(self, needed_tokens: int) -> None:
        """
        Truncate context to fit new content.
        
        Args:
            needed_tokens: Number of tokens needed
        """
        available = self.available_input_tokens - needed_tokens
        
        if available < 0:
            # Need to remove some content
            while self._current_usage > 0 and self._current_usage > available:
                if self._context_history:
                    old = self._context_history.popleft()
                    self._current_usage -= old["tokens"]
                else:
                    break
            
            # Also truncate scene contexts
            if len(self._scene_contexts) > 3:
                self._scene_contexts = self._scene_contexts[-3:]
                # Recalculate tokens from scenes
                scene_tokens = sum(s.get("tokens", 0) for s in self._scene_contexts)
                self._current_usage = max(self._current_usage, scene_tokens)
        
        logger.warning(
            f"Context truncated. Current usage: {self._current_usage}, "
            f"Available: {available}"
        )
    
    def truncate_to_token_limit(
        self,
        text: str,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Truncate text to fit within token limit.
        
        Args:
            text: Text to truncate
            max_tokens: Maximum tokens (uses available if not specified)
        
        Returns:
            Truncated text
        """
        if max_tokens is None:
            max_tokens = self.get_available_tokens()
        
        max_chars = max_tokens * self.CHARS_PER_TOKEN
        
        if len(text) <= max_chars:
            return text
        
        # Truncate to max chars
        truncated = text[:max_chars]
        
        # Try to end at a sentence boundary
        last_period = truncated.rfind('.')
        last_question = truncated.rfind('?')
        last_exclaim = truncated.rfind('!')
        
        end_pos = max(last_period, last_question, last_exclaim)
        
        if end_pos > max_chars * 0.7:  # If we can end at sentence
            return truncated[:end_pos + 1]
        
        # Otherwise end at last space
        last_space = truncated.rfind(' ')
        if last_space > max_chars * 0.9:
            return truncated[:last_space] + "..."
        
        return truncated + "..."
    
    def reset(self) -> None:
        """Reset the context manager state."""
        self._context_history.clear()
        self._scene_contexts.clear()
        self._memory_summaries.clear()
        self._current_usage = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get context management statistics."""
        return {
            "total_tokens": self.max_context_tokens,
            "available_input_tokens": self.available_input_tokens,
            "current_usage": self._current_usage,
            "context_items": len(self._context_history),
            "scene_contexts": len(self._scene_contexts),
            "memory_summaries": len(self._memory_summaries),
        }


# Global context manager instance
_context_manager: Optional[ContextManager] = None


def get_context_manager(
    max_context_tokens: int = 8192,
    reserved_response_tokens: int = 2048,
) -> ContextManager:
    """Get or create the global context manager instance."""
    global _context_manager
    if _context_manager is None:
        _context_manager = ContextManager(
            max_context_tokens=max_context_tokens,
            reserved_response_tokens=reserved_response_tokens,
        )
    return _context_manager


def set_context_manager(manager: ContextManager) -> None:
    """Set the global context manager instance."""
    global _context_manager
    _context_manager = manager
