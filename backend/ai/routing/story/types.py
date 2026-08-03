"""
Type definitions for Story Routing.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class StoryState(Enum):
    """Story execution states."""
    IDLE = "idle"
    STARTING = "starting"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    SCENE_TRANSITION = "scene_transition"
    ENDING = "ending"
    COMPLETED = "completed"


class StoryTrigger(Enum):
    """Story trigger types."""
    USER_REQUEST = "user_request"
    EMOTIONAL_MOMENT = "emotional_moment"
    NATURAL_BREAK = "natural_break"
    CHARACTER_DEATH = "character_death"
    QUEST_COMPLETE = "quest_complete"
    USER_INTERRUPT = "user_interrupt"


@dataclass
class StoryScene:
    """A scene in a story."""
    scene_id: str
    index: int
    text: str
    description: str
    characters: List[str] = field(default_factory=list)
    setting: str = ""
    mood: str = ""
    duration_estimate: float = 0.0


@dataclass
class Story:
    """A story with scenes."""
    story_id: str
    title: str
    genre: str
    scenes: List[StoryScene]
    current_scene_index: int = 0
    state: StoryState = StoryState.IDLE
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StoryQuery:
    """Query for story routing."""
    user_id: str
    message: str
    current_scene: Optional[int] = None
    include_context: bool = True
    allow_story_start: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StoryResponse:
    """Response from story routing."""
    should_tell_story: bool
    story: Optional[Story] = None
    current_scene: Optional[StoryScene] = None
    next_scene: Optional[StoryScene] = None
    should_end: bool = False
    response_text: Optional[str] = None
    trigger: Optional[StoryTrigger] = None
