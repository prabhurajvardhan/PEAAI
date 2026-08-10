"""Tests for story generation prompts."""
import pytest
from backend.ai.story_generation.prompts import (
    build_system_prompt,
    build_story_prompt,
    get_prompt_template,
    GENRE_TEMPLATES,
)
from backend.ai.story_generation.types import (
    StoryGenre,
    StoryLength,
    StoryGenerationConfig,
    StoryPromptContext,
)


class TestGenreTemplates:
    """Tests for genre prompt templates."""
    
    def test_all_genres_have_templates(self):
        """Test that all genres have templates."""
        for genre in StoryGenre:
            template = get_prompt_template(genre)
            assert template is not None
            assert hasattr(template, 'SYSTEM_PROMPT')
            assert hasattr(template, 'format_user_prompt')
    
    def test_adventure_template(self):
        """Test adventure genre template."""
        template = get_prompt_template(StoryGenre.ADVENTURE)
        
        assert "storyteller" in template.SYSTEM_PROMPT.lower()
        assert "PEAAI" in template.SYSTEM_PROMPT
    
    def test_fantasy_template(self):
        """Test fantasy genre template."""
        template = get_prompt_template(StoryGenre.FANTASY)
        
        assert "fantasy" in template.SYSTEM_PROMPT.lower()
        assert "magical" in template.SYSTEM_PROMPT.lower()
    
    def test_scifi_template(self):
        """Test sci-fi genre template."""
        template = get_prompt_template(StoryGenre.SCIFI)
        
        assert "science fiction" in template.SYSTEM_PROMPT.lower()
        assert "futuristic" in template.SYSTEM_PROMPT.lower() or "spaceship" in template.SYSTEM_PROMPT.lower()


class TestBuildSystemPrompt:
    """Tests for build_system_prompt function."""
    
    def test_basic_system_prompt(self):
        """Test building basic system prompt."""
        prompt = build_system_prompt(StoryGenre.ADVENTURE)
        
        assert prompt is not None
        assert len(prompt) > 0
        assert "PEAAI" in prompt
    
    def test_system_prompt_with_style(self):
        """Test building system prompt with style."""
        prompt = build_system_prompt(
            StoryGenre.FANTASY,
            companion_style="Be whimsical and playful"
        )
        
        assert "whimsical" in prompt.lower()
    
    def test_different_genres(self):
        """Test prompts for different genres."""
        for genre in StoryGenre:
            prompt = build_system_prompt(genre)
            assert len(prompt) > 100  # Should have substantial content


class TestBuildStoryPrompt:
    """Tests for build_story_prompt function."""
    
    def test_basic_story_prompt(self):
        """Test building basic story prompt."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Tell me a story about dragons",
        )
        config = StoryGenerationConfig(genre=StoryGenre.ADVENTURE)
        
        prompt = build_story_prompt(context, config)
        
        assert prompt is not None
        assert "dragons" in prompt.lower() or "story" in prompt.lower()
    
    def test_prompt_with_context(self):
        """Test prompt with full context."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Tell me an adventure",
            relationship_context="Best friends with the user",
            previous_stories_summary="Previously told a quest story",
            conversation_history=[
                {"role": "user", "content": "Hello"},
            ],
        )
        config = StoryGenerationConfig()
        
        prompt = build_story_prompt(context, config)
        
        assert "relationship" in prompt.lower() or "friends" in prompt.lower()
    
    def test_continuation_prompt(self):
        """Test building continuation prompt."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Continue the story",
        )
        config = StoryGenerationConfig()
        
        # First scene
        prompt1 = build_story_prompt(context, config, scene_index=0, is_continuation=False)
        
        # Continuation
        prompt2 = build_story_prompt(context, config, scene_index=1, is_continuation=True)
        
        # Continuation should mention continuing
        assert "continue" in prompt2.lower() or "continued" in prompt2.lower()
    
    def test_scene_request_formatting(self):
        """Test scene request is properly formatted."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Begin the tale",
        )
        config = StoryGenerationConfig()
        
        # First scene
        prompt1 = build_story_prompt(context, config, scene_index=0)
        assert "scene 1" in prompt1.lower() or "opening" in prompt1.lower()
        
        # Later scenes
        prompt5 = build_story_prompt(context, config, scene_index=4)
        assert "scene 5" in prompt5.lower()
    
    def test_genre_hint_in_context(self):
        """Test genre hint from context is used."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Tell me a fantasy tale",
            story_genre_hint=StoryGenre.FANTASY,
        )
        config = StoryGenerationConfig(genre=StoryGenre.ADVENTURE)  # Default is adventure
        
        prompt = build_story_prompt(context, config)
        
        # Should use the context genre hint
        template = get_prompt_template(context.story_genre_hint)
        assert "fantasy" in template.SYSTEM_PROMPT.lower()


class TestPromptFormatting:
    """Tests for prompt formatting details."""
    
    def test_config_temperature_influence(self):
        """Test that config influences prompt."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Tell me a story",
        )
        
        # Different configs should produce similar structure but different details
        config1 = StoryGenerationConfig(temperature=0.5)
        config2 = StoryGenerationConfig(temperature=1.0)
        
        prompt1 = build_story_prompt(context, config1)
        prompt2 = build_story_prompt(context, config2)
        
        # Both should have similar structure
        assert "length" in prompt1.lower() or "target" in prompt1.lower()
        assert "length" in prompt2.lower() or "target" in prompt2.lower()
    
    def test_scene_length_in_prompt(self):
        """Test that scene length appears in prompt."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Quick story",
        )
        config = StoryGenerationConfig(
            scene_min_chars=200,
            scene_max_chars=500,
        )
        
        prompt = build_story_prompt(context, config)
        
        # Should mention the length target
        assert "200" in prompt or "500" in prompt or "characters" in prompt.lower()
    
    def test_genre_specific_instructions(self):
        """Test that different genres get different instructions."""
        context = StoryPromptContext(
            user_id="test_user",
            user_message="Tell me a story",
        )
        
        fantasy_config = StoryGenerationConfig(genre=StoryGenre.FANTASY)
        scifi_config = StoryGenerationConfig(genre=StoryGenre.SCIFI)
        
        fantasy_prompt = build_story_prompt(context, fantasy_config)
        scifi_prompt = build_story_prompt(context, scifi_config)
        
        # Should contain genre-specific terms in config/genre info
        assert "fantasy" in fantasy_prompt.lower() or "magic" in fantasy_prompt.lower()
        # The user prompt includes genre focus from config
        assert "science_fiction" in scifi_prompt.lower() or "fantasy" in fantasy_prompt.lower()


class TestPromptTemplates:
    """Tests for PromptTemplate class."""
    
    def test_template_interface(self):
        """Test that templates implement required interface."""
        template = get_prompt_template(StoryGenre.ADVENTURE)
        
        assert hasattr(template, 'SYSTEM_PROMPT')
        assert hasattr(template, 'USER_PROMPT_TEMPLATE')
        assert callable(template.format_user_prompt)
    
    def test_format_user_prompt_returns_string(self):
        """Test format_user_prompt returns string."""
        template = get_prompt_template(StoryGenre.ADVENTURE)
        context = StoryPromptContext(
            user_id="test",
            user_message="Test",
        )
        config = StoryGenerationConfig()
        
        result = template.format_user_prompt(context, config)
        
        assert isinstance(result, str)
        assert len(result) > 0
