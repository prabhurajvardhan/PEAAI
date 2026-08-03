"""
Type definitions for Story Generation Pipeline.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class StoryGenre(Enum):
    """Story genres for generation."""
    ADVENTURE = "adventure"
    FANTASY = "fantasy"
    SCIFI = "science_fiction"
    MYSTERY = "mystery"
    COMEDY = "comedy"
    DRAMA = "drama"
    ROMANCE = "romance"
    HORROR = "horror"


class StoryLength(Enum):
    """Story length options."""
    SHORT = "short"       # 1-2 scenes
    MEDIUM = "medium"     # 3-5 scenes
    LONG = "long"         # 6-10 scenes


class SceneMarker(Enum):
    """Markers that indicate scene boundaries."""
    NEWLINE_PARAGRAPH = "\n\n"
    DIALOGUE_END = "\""
    ACTION_END = "."
    CHAPTER_BREAK = "***"


@dataclass
class StoryGenerationConfig:
    """Configuration for story generation."""
    genre: StoryGenre = StoryGenre.ADVENTURE
    length: StoryLength = StoryLength.MEDIUM
    temperature: float = 0.8
    max_tokens_per_scene: int = 500
    max_total_tokens: int = 4000
    scene_min_chars: int = 100
    scene_max_chars: int = 800
    include_dialogue: bool = True
    include_action: bool = True
    enable_streaming: bool = True
    context_window_tokens: int = 8192


@dataclass
class StoryScene:
    """A segmented scene from a story."""
    scene_id: str
    index: int
    text: str
    description: str
    characters: List[str] = field(default_factory=list)
    setting: str = ""
    mood: str = ""
    duration_estimate: float = 5.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GeneratedStory:
    """A fully generated story with scenes."""
    story_id: str
    title: str
    genre: StoryGenre
    full_text: str
    scenes: List[StoryScene]
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StoryPromptContext:
    """Context for story prompt generation."""
    user_id: str
    user_message: str
    user_preferences: Dict[str, Any] = field(default_factory=dict)
    relationship_context: str = ""
    story_genre_hint: Optional[StoryGenre] = None
    previous_stories_summary: str = ""
    conversation_history: List[Dict[str, str]] = field(default_factory=list)


@dataclass
class StreamEvent:
    """Event from streaming story generation."""
    event_type: str  # "scene_start", "scene_text", "scene_end", "story_complete", "error"
    scene_index: Optional[int] = None
    text: Optional[str] = None
    scene: Optional[StoryScene] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
