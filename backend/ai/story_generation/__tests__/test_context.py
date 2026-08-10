"""Tests for context window management."""
import pytest
from backend.ai.story_generation.context import (
    ContextManager,
    ContextWindow,
    MemorySummary,
    get_context_manager,
)
from backend.ai.story_generation.types import (
    StoryPromptContext,
    StoryGenre,
    StoryGenerationConfig,
)


class TestContextManager:
    """Tests for ContextManager class."""
    
    def test_initialization(self):
        """Test context manager initialization."""
        manager = ContextManager(
            max_context_tokens=4096,
            reserved_response_tokens=1024,
        )
        
        assert manager.max_context_tokens == 4096
        assert manager.reserved_response_tokens == 1024
        assert manager.available_input_tokens > 0
    
    def test_default_initialization(self):
        """Test default initialization values."""
        manager = ContextManager()
        
        assert manager.max_context_tokens == 8192
        assert manager.reserved_response_tokens == 2048
        assert manager.available_input_tokens > 0
    
    def test_estimate_tokens(self):
        """Test token estimation."""
        manager = ContextManager()
        
        # 4 chars per token approximation
        text = "Hello world"  # 11 chars
        tokens = manager.estimate_tokens(text)
        
        assert tokens == 11 // 4
        assert tokens >= 2
    
    def test_get_available_tokens(self):
        """Test getting available tokens."""
        manager = ContextManager()
        
        available = manager.get_available_tokens()
        
        assert available == manager.available_input_tokens
        assert available > 0
    
    def test_get_context_window(self):
        """Test getting context window state."""
        manager = ContextManager()
        
        window = manager.get_context_window()
        
        assert isinstance(window, ContextWindow)
        assert window.total_tokens == manager.max_context_tokens
        assert window.available_tokens > 0
        assert window.overflow is False
    
    def test_add_context(self):
        """Test adding context."""
        manager = ContextManager()
        
        tokens = manager.add_context("Test content", priority=1)
        
        assert tokens > 0
        assert manager._current_usage > 0
    
    def test_add_context_with_truncation(self):
        """Test adding context that requires truncation."""
        manager = ContextManager(max_context_tokens=100)
        
        # Add content
        manager.add_context("Short content", priority=2)
        initial_usage = manager._current_usage
        
        # Add more content that exceeds limit
        long_content = "x" * 5000
        tokens = manager.add_context(long_content, priority=2)
        
        # Should still work with truncation
        assert tokens > 0
    
    def test_add_scene_context(self):
        """Test adding scene-specific context."""
        manager = ContextManager()
        
        manager.add_scene_context(
            scene_index=0,
            scene_text="The hero entered the cave.",
            characters=["Hero", "Villain"],
            setting="Dark cave",
        )
        
        assert len(manager._scene_contexts) == 1
        assert manager._scene_contexts[0]["setting"] == "Dark cave"
    
    def test_scene_context_limit(self):
        """Test that scene contexts are limited."""
        manager = ContextManager()
        
        # Add more than 10 scenes
        for i in range(15):
            manager.add_scene_context(
                scene_index=i,
                scene_text=f"Scene {i} content.",
                characters=["Character"],
                setting=f"Setting {i}",
            )
        
        # Should only keep last 10
        assert len(manager._scene_contexts) <= 10
    
    def test_build_context_for_scene(self):
        """Test building context for scene generation."""
        manager = ContextManager()
        
        # Add some context
        manager.add_scene_context(
            scene_index=0,
            scene_text="Scene 0 text",
            characters=["Hero"],
            setting="Forest",
        )
        
        base_context = StoryPromptContext(
            user_id="test_user",
            user_message="Tell me a story",
            relationship_context="Friends",
        )
        
        config = StoryGenerationConfig()
        
        context_string, tokens = manager.build_context_for_scene(
            base_context, 1, config
        )
        
        assert isinstance(context_string, str)
        assert tokens >= 0
    
    def test_update_memory_summary(self):
        """Test updating memory summary."""
        manager = ContextManager()
        
        scene_contexts = [
            {"index": 0, "text": "Scene 1", "characters": ["Hero"], "setting": "Forest"},
            {"index": 1, "text": "Scene 2", "characters": ["Villain"], "setting": "Cave"},
        ]
        
        summary = manager.update_memory_summary(scene_contexts)
        
        assert isinstance(summary, MemorySummary)
        assert len(manager._memory_summaries) == 1
    
    def test_truncate_to_token_limit(self):
        """Test truncating text to token limit."""
        manager = ContextManager()
        
        long_text = "Hello world! " * 1000
        
        # Truncate to 100 tokens
        truncated = manager.truncate_to_token_limit(long_text, max_tokens=100)
        
        # Should be shorter
        assert len(truncated) < len(long_text)
        
        # Should try to end at sentence
        assert len(truncated) > 0
    
    def test_truncate_without_limit(self):
        """Test truncating without explicit limit."""
        manager = ContextManager()
        
        text = "Short text"
        truncated = manager.truncate_to_token_limit(text)
        
        # Should not truncate short text
        assert truncated == text
    
    def test_reset(self):
        """Test resetting context manager."""
        manager = ContextManager()
        
        # Add some content
        manager.add_context("Test")
        manager.add_scene_context(0, "Text", [], "Setting")
        
        # Reset
        manager.reset()
        
        assert manager._current_usage == 0
        assert len(manager._context_history) == 0
        assert len(manager._scene_contexts) == 0
    
    def test_get_stats(self):
        """Test getting statistics."""
        manager = ContextManager()
        
        manager.add_context("Content 1", priority=1)
        manager.add_scene_context(0, "Scene text", [], "Setting")
        
        stats = manager.get_stats()
        
        assert "total_tokens" in stats
        assert "current_usage" in stats
        assert "context_items" in stats
        assert "scene_contexts" in stats
        assert stats["context_items"] >= 1
        assert stats["scene_contexts"] >= 1


class TestContextWindow:
    """Tests for ContextWindow dataclass."""
    
    def test_context_window_creation(self):
        """Test creating context window."""
        window = ContextWindow(
            total_tokens=8192,
            max_tokens=5000,
            used_tokens=1000,
            available_tokens=4000,
            overflow=False,
        )
        
        assert window.total_tokens == 8192
        assert window.available_tokens == 4000
        assert window.overflow is False
    
    def test_context_window_overflow(self):
        """Test context window with overflow."""
        window = ContextWindow(
            total_tokens=8192,
            max_tokens=5000,
            used_tokens=6000,
            available_tokens=-1000,
            overflow=True,
        )
        
        assert window.overflow is True
        assert window.available_tokens < 0


class TestMemorySummary:
    """Tests for MemorySummary dataclass."""
    
    def test_memory_summary_creation(self):
        """Test creating memory summary."""
        summary = MemorySummary(
            key_memories=["Hero found sword", "Battle won"],
            character_context="Hero, Villain, Mentor",
            plot_points=["Quest started", "Enemy revealed"],
            emotional_arc="Triumph over adversity",
        )
        
        assert len(summary.key_memories) == 2
        assert "Hero" in summary.character_context
    
    def test_default_memory_summary(self):
        """Test default memory summary."""
        summary = MemorySummary()
        
        assert summary.key_memories == []
        assert summary.character_context == ""
        assert summary.plot_points == []
        assert summary.emotional_arc == ""


class TestGetContextManager:
    """Tests for get_context_manager function."""
    
    def test_singleton_pattern(self):
        """Test that get_context_manager returns singleton."""
        manager1 = get_context_manager()
        manager2 = get_context_manager()
        
        assert manager1 is manager2
    
    def test_custom_config(self):
        """Test creating with custom config."""
        # Create a new manager with custom config
        custom_manager = ContextManager(max_context_tokens=4096)
        assert custom_manager.max_context_tokens == 4096
        
        # Verify it respects the config
        assert custom_manager.available_input_tokens == 4096 - custom_manager.reserved_response_tokens - custom_manager.story_prompt_tokens


class TestContextManagerEdgeCases:
    """Edge case tests for context manager."""
    
    def test_add_empty_context(self):
        """Test adding empty context."""
        manager = ContextManager()
        
        tokens = manager.add_context("")
        
        # Empty content should add 0 tokens
        assert tokens == 0
    
    def test_add_unicode_context(self):
        """Test adding unicode context."""
        manager = ContextManager()
        
        tokens = manager.add_context("こんにちは世界 🌍")
        
        assert tokens > 0
    
    def test_build_context_empty(self):
        """Test building context with no history."""
        manager = ContextManager()
        
        context = StoryPromptContext(
            user_id="test",
            user_message="Test",
        )
        config = StoryGenerationConfig()
        
        context_string, tokens = manager.build_context_for_scene(
            context, 0, config
        )
        
        # Should return empty or minimal context
        assert isinstance(context_string, str)
    
    def test_scene_context_with_no_characters(self):
        """Test adding scene context with no characters."""
        manager = ContextManager()
        
        manager.add_scene_context(
            scene_index=0,
            scene_text="The forest was quiet.",
            characters=[],  # No characters
            setting="Dark forest",
        )
        
        scene = manager._scene_contexts[0]
        assert scene["characters"] == []
    
    def test_truncate_exact_boundary(self):
        """Test truncating text at exact boundary."""
        manager = ContextManager()
        
        # Create text that's exactly at the boundary
        text = "Hello world."
        truncated = manager.truncate_to_token_limit(text, max_tokens=3)
        
        # Should not change short text
        assert truncated == text
