"""Tests for story generation types."""
import pytest
from backend.ai.story_generation.types import (
    StoryGenre,
    StoryLength,
    StoryGenerationConfig,
    StoryScene,
    GeneratedStory,
    StoryPromptContext,
    StreamEvent,
    SceneMarker,
)


class TestStoryGenre:
    """Tests for StoryGenre enum."""
    
    def test_all_genres_defined(self):
        """Verify all expected genres are defined."""
        genres = [
            StoryGenre.ADVENTURE,
            StoryGenre.FANTASY,
            StoryGenre.SCIFI,
            StoryGenre.MYSTERY,
            StoryGenre.COMEDY,
            StoryGenre.DRAMA,
            StoryGenre.ROMANCE,
            StoryGenre.HORROR,
        ]
        assert len(genres) == 8
    
    def test_genre_values(self):
        """Test genre string values."""
        assert StoryGenre.ADVENTURE.value == "adventure"
        assert StoryGenre.FANTASY.value == "fantasy"
        assert StoryGenre.SCIFI.value == "science_fiction"


class TestStoryLength:
    """Tests for StoryLength enum."""
    
    def test_all_lengths_defined(self):
        """Verify all story lengths are defined."""
        assert StoryLength.SHORT.value == "short"
        assert StoryLength.MEDIUM.value == "medium"
        assert StoryLength.LONG.value == "long"


class TestStoryGenerationConfig:
    """Tests for StoryGenerationConfig dataclass."""
    
    def test_default_config(self):
        """Test default configuration."""
        config = StoryGenerationConfig()
        
        assert config.genre == StoryGenre.ADVENTURE
        assert config.length == StoryLength.MEDIUM
        assert config.temperature == 0.8
        assert config.max_tokens_per_scene == 500
        assert config.scene_min_chars == 100
        assert config.scene_max_chars == 800
        assert config.enable_streaming is True
    
    def test_custom_config(self):
        """Test custom configuration."""
        config = StoryGenerationConfig(
            genre=StoryGenre.FANTASY,
            length=StoryLength.LONG,
            temperature=0.9,
            max_tokens_per_scene=1000,
        )
        
        assert config.genre == StoryGenre.FANTASY
        assert config.length == StoryLength.LONG
        assert config.temperature == 0.9
        assert config.max_tokens_per_scene == 1000


class TestStoryScene:
    """Tests for StoryScene dataclass."""
    
    def test_scene_creation(self):
        """Test creating a story scene."""
        scene = StoryScene(
            scene_id="test_scene_1",
            index=0,
            text="Once upon a time in a faraway land...",
            description="Opening scene of the story",
            characters=["Hero", "Villain"],
            setting="Dark forest",
            mood="mysterious",
        )
        
        assert scene.scene_id == "test_scene_1"
        assert scene.index == 0
        assert "Once upon" in scene.text
        assert len(scene.characters) == 2
        assert scene.setting == "Dark forest"
        assert scene.mood == "mysterious"
    
    def test_scene_with_characters(self):
        """Test scene with characters."""
        scene = StoryScene(
            scene_id="scene_with_chars",
            index=1,
            text="The hero ventured deeper...",
            description="Hero enters the cave",
            characters=["Hero", "Guide"],
            setting="Dark cave",
            mood="tense",
        )
        
        assert "Hero" in scene.characters
        assert "Guide" in scene.characters
        assert scene.setting == "Dark cave"


class TestGeneratedStory:
    """Tests for GeneratedStory dataclass."""
    
    def test_story_creation(self):
        """Test creating a generated story."""
        scenes = [
            StoryScene(
                scene_id="scene_1",
                index=0,
                text="Scene 1 text",
                description="First scene",
            ),
            StoryScene(
                scene_id="scene_2",
                index=1,
                text="Scene 2 text",
                description="Second scene",
            ),
        ]
        
        story = GeneratedStory(
            story_id="story_123",
            title="The Great Adventure",
            genre=StoryGenre.ADVENTURE,
            full_text="Scene 1 text\n\nScene 2 text",
            scenes=scenes,
        )
        
        assert story.story_id == "story_123"
        assert story.title == "The Great Adventure"
        assert story.genre == StoryGenre.ADVENTURE
        assert len(story.scenes) == 2
        assert story.full_text == "Scene 1 text\n\nScene 2 text"


class TestStoryPromptContext:
    """Tests for StoryPromptContext dataclass."""
    
    def test_basic_context(self):
        """Test basic prompt context."""
        context = StoryPromptContext(
            user_id="user_123",
            user_message="Tell me an adventure story!",
        )
        
        assert context.user_id == "user_123"
        assert context.user_message == "Tell me an adventure story!"
        assert context.story_genre_hint is None
        assert context.conversation_history == []
    
    def test_full_context(self):
        """Test context with all fields."""
        context = StoryPromptContext(
            user_id="user_456",
            user_message="Tell me a fantasy tale",
            user_preferences={"favorite_genre": "fantasy"},
            relationship_context="We've been friends for a while",
            story_genre_hint=StoryGenre.FANTASY,
            previous_stories_summary="User enjoyed a dragon story last week",
            conversation_history=[
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"},
            ],
        )
        
        assert context.story_genre_hint == StoryGenre.FANTASY
        assert "friends" in context.relationship_context
        assert len(context.conversation_history) == 2


class TestStreamEvent:
    """Tests for StreamEvent dataclass."""
    
    def test_scene_start_event(self):
        """Test scene start event."""
        event = StreamEvent(
            event_type="scene_start",
            scene_index=0,
            metadata={"story_id": "story_abc"},
        )
        
        assert event.event_type == "scene_start"
        assert event.scene_index == 0
        assert event.metadata["story_id"] == "story_abc"
    
    def test_buffer_event(self):
        """Test buffer event."""
        event = StreamEvent(
            event_type="buffer",
            text="The hero walked through...",
            scene_index=1,
        )
        
        assert event.event_type == "buffer"
        assert "hero" in event.text
        assert event.scene_index == 1
    
    def test_error_event(self):
        """Test error event."""
        event = StreamEvent(
            event_type="error",
            error="Connection timeout",
            scene_index=2,
        )
        
        assert event.event_type == "error"
        assert "timeout" in event.error
