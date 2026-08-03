"""
Story Router - Routes conversations to story generation.

Handles:
- Story detection
- Scene triggering
- Story state management
- End detection
"""
import asyncio
import logging
import re
from typing import Any, Dict, List, Optional, Set

from ...event_dispatcher import EventDispatcher, Event, EventType, EventPriority
from .types import (
    Story,
    StoryScene,
    StoryQuery,
    StoryResponse,
    StoryState,
    StoryTrigger,
)

logger = logging.getLogger(__name__)


class StoryRouter:
    """
    Routes conversations to story generation and manages story state.

    Features:
    - Detects when to start/end stories
    - Manages story scene progression
    - Coordinates with story generation
    - Handles story interruptions
    """

    # Keywords that may trigger story generation
    STORY_KEYWORDS = [
        "tell me a story",
        "tell me about",
        "what if",
        "once upon",
        "i want a story",
        "make up a story",
        "entertain me",
        "bored",
        "let's adventure",
        "let's go on",
        "what happened when",
        "the time when",
        "remember when",
        "adventure",
        "quest",
    ]

    # Keywords that might end a story
    END_KEYWORDS = [
        "stop story",
        "end story",
        "enough story",
        "that's enough",
        "back to normal",
        "exit story",
        "leave the story",
    ]

    # Keywords for interrupting story
    INTERRUPT_KEYWORDS = [
        "wait",
        "hold on",
        "pause",
        "stop",
        "what",
        "huh",
    ]

    def __init__(
        self,
        dispatcher: Optional[EventDispatcher] = None,
        max_scenes_per_story: int = 10,
        min_scene_length: int = 50,
    ):
        """
        Initialize the Story Router.

        Args:
            dispatcher: Event dispatcher for story events
            max_scenes_per_story: Maximum scenes in a generated story
            min_scene_length: Minimum characters for scene content
        """
        self._dispatcher = dispatcher
        self._max_scenes_per_story = max_scenes_per_story
        self._min_scene_length = min_scene_length
        self._active_stories: Dict[str, Story] = {}
        self._story_patterns = [
            r"once upon a time",
            r"long ago",
            r"in a (land|kingdom|world|galaxy|faraway place)",
            r"the story of",
        ]

    def detect_story_intent(self, message: str, context: Optional[Dict] = None) -> float:
        """
        Detect the likelihood that a message wants story generation.

        Args:
            message: User's input message
            context: Optional conversation context

        Returns:
            Float between 0 and 1 indicating story intent probability
        """
        message_lower = message.lower()
        score = 0.0

        # Check for explicit story keywords
        for keyword in self.STORY_KEYWORDS:
            if keyword in message_lower:
                score += 0.4
                break

        # Check for story patterns
        for pattern in self._story_patterns:
            if re.search(pattern, message_lower):
                score += 0.5
                break

        # Check for question patterns that suggest story interest
        question_patterns = [
            r"what if.*\?",
            r"can you.*story",
            r"do you remember.*story",
            r"tell.*story",
        ]
        for pattern in question_patterns:
            if re.search(pattern, message_lower):
                score += 0.3

        # Check context (bored, etc.)
        if context:
            if context.get("user_bored", False):
                score += 0.2
            if context.get("time_of_day") == "evening":
                score += 0.1  # Stories are common in evening

        return min(1.0, score)

    def should_end_story(self, message: str, current_story: Optional[Story] = None) -> bool:
        """
        Determine if current story should end.

        Args:
            message: User's input message
            current_story: Current active story

        Returns:
            True if story should end
        """
        if not current_story:
            return False

        message_lower = message.lower()

        # Check for explicit end keywords
        for keyword in self.END_KEYWORDS:
            if keyword in message_lower:
                return True

        # Check for interrupt keywords during story
        if current_story.state == StoryState.IN_PROGRESS:
            for keyword in self.INTERRUPT_KEYWORDS:
                if keyword in message_lower:
                    return True

        # Check if we've reached max scenes
        if current_story.current_scene_index >= len(current_story.scenes):
            return True

        # Check for scene-based ending markers
        scene_ending_markers = ["the end", "the finale", "they lived", "happily ever after"]
        for marker in scene_ending_markers:
            if marker in message_lower:
                return True

        return False

    async def route_story(
        self,
        query: StoryQuery,
    ) -> StoryResponse:
        """
        Route a message to story generation or normal conversation.

        Args:
            query: Story query with user message and context

        Returns:
            StoryResponse indicating story routing decision
        """
        user_id = query.user_id
        message = query.message

        # Get current story for user
        current_story = self._active_stories.get(user_id)

        # Check if story should end
        if self.should_end_story(message, current_story):
            return await self._end_story(user_id, current_story)

        # Check for interrupt
        if current_story and any(kw in message.lower() for kw in self.INTERRUPT_KEYWORDS):
            return await self._interrupt_story(user_id, current_story)

        # Detect story intent in message
        story_probability = self.detect_story_intent(message, query.metadata)

        if story_probability > 0.5 and query.allow_story_start:
            return await self._start_story(user_id, message, query)

        if current_story and current_story.state == StoryState.IN_PROGRESS:
            return await self._continue_story(user_id, current_story, query)

        return StoryResponse(
            should_tell_story=False,
            response_text=None,
        )

    async def _start_story(
        self,
        user_id: str,
        message: str,
        query: StoryQuery,
    ) -> StoryResponse:
        """Start a new story."""
        story_id = f"story_{user_id}_{asyncio.get_event_loop().time():.0f}"

        # Emit story start event
        if self._dispatcher:
            await self._dispatcher.emit(
                EventType.STORY_START.value,
                data={
                    "story_id": story_id,
                    "user_id": user_id,
                    "message": message,
                },
                priority=EventPriority.HIGH,
                source="story_router",
            )

        # Create placeholder story - actual scenes will be generated
        story = Story(
            story_id=story_id,
            title="AI Generated Story",
            genre="adventure",
            scenes=[],
            state=StoryState.STARTING,
        )
        self._active_stories[user_id] = story

        return StoryResponse(
            should_tell_story=True,
            story=story,
            trigger=StoryTrigger.USER_REQUEST,
            response_text="I'd love to tell you a story! Let me create something special...",
        )

    async def _continue_story(
        self,
        user_id: str,
        story: Story,
        query: StoryQuery,
    ) -> StoryResponse:
        """Continue an existing story."""
        if story.current_scene_index >= len(story.scenes):
            return await self._end_story(user_id, story)

        current_scene = story.scenes[story.current_scene_index]
        next_scene = story.scenes[story.current_scene_index + 1] if story.current_scene_index + 1 < len(story.scenes) else None

        # Emit scene event
        if self._dispatcher:
            await self._dispatcher.emit(
                EventType.STORY_SCENE.value,
                data={
                    "story_id": story.story_id,
                    "scene_index": story.current_scene_index,
                    "scene_id": current_scene.scene_id,
                },
                priority=EventPriority.HIGH,
                source="story_router",
            )

        return StoryResponse(
            should_tell_story=True,
            story=story,
            current_scene=current_scene,
            next_scene=next_scene,
            trigger=StoryTrigger.NATURAL_BREAK,
        )

    async def _interrupt_story(
        self,
        user_id: str,
        story: Story,
    ) -> StoryResponse:
        """Handle story interruption."""
        story.state = StoryState.PAUSED

        if self._dispatcher:
            await self._dispatcher.emit(
                EventType.STORY_END.value,
                data={
                    "story_id": story.story_id,
                    "reason": "interrupted",
                },
                priority=EventPriority.NORMAL,
                source="story_router",
            )

        return StoryResponse(
            should_tell_story=True,
            story=story,
            response_text="*pauses the story* Did you want to say something?",
            trigger=StoryTrigger.USER_INTERRUPT,
        )

    async def _end_story(
        self,
        user_id: str,
        story: Optional[Story],
    ) -> StoryResponse:
        """End the current story."""
        if story:
            story.state = StoryState.COMPLETED
            story.current_scene_index = len(story.scenes)

            if self._dispatcher:
                await self._dispatcher.emit(
                    EventType.STORY_END.value,
                    data={
                        "story_id": story.story_id,
                        "reason": "completed",
                        "scenes_count": len(story.scenes),
                    },
                    priority=EventPriority.NORMAL,
                    source="story_router",
                )

        # Remove from active stories
        if user_id in self._active_stories:
            del self._active_stories[user_id]

        return StoryResponse(
            should_tell_story=False,
            should_end=True,
            trigger=StoryTrigger.USER_INTERRUPT,
            response_text="*ends the story and returns to companion mode*",
        )

    def add_scene_to_story(
        self,
        user_id: str,
        scene: StoryScene,
    ) -> bool:
        """
        Add a scene to the active story.

        Args:
            user_id: User identifier
            scene: Scene to add

        Returns:
            True if scene was added
        """
        story = self._active_stories.get(user_id)
        if not story:
            return False

        if len(story.scenes) >= self._max_scenes_per_story:
            return False

        story.scenes.append(scene)
        story.current_scene_index = len(story.scenes) - 1
        story.state = StoryState.IN_PROGRESS

        return True

    def get_active_story(self, user_id: str) -> Optional[Story]:
        """Get the active story for a user."""
        return self._active_stories.get(user_id)

    def get_current_scene(self, user_id: str) -> Optional[StoryScene]:
        """Get the current scene for a user's story."""
        story = self._active_stories.get(user_id)
        if story and story.scenes:
            idx = min(story.current_scene_index, len(story.scenes) - 1)
            return story.scenes[idx]
        return None

    def advance_scene(self, user_id: str) -> bool:
        """
        Advance to the next scene in the story.

        Args:
            user_id: User identifier

        Returns:
            True if advanced successfully
        """
        story = self._active_stories.get(user_id)
        if not story:
            return False

        if story.current_scene_index + 1 >= len(story.scenes):
            return False

        story.current_scene_index += 1

        # Emit scene event
        if self._dispatcher:
            asyncio.create_task(
                self._dispatcher.emit(
                    EventType.STORY_SCENE.value,
                    data={
                        "story_id": story.story_id,
                        "scene_index": story.current_scene_index,
                    },
                    priority=EventPriority.HIGH,
                    source="story_router",
                )
            )

        return True

    def is_story_active(self, user_id: str) -> bool:
        """Check if user has an active story."""
        story = self._active_stories.get(user_id)
        return story is not None and story.state == StoryState.IN_PROGRESS

    def clear_story(self, user_id: str) -> bool:
        """
        Clear the active story for a user.

        Args:
            user_id: User identifier

        Returns:
            True if story was cleared
        """
        if user_id in self._active_stories:
            del self._active_stories[user_id]
            return True
        return False


# Global router instance
_story_router: Optional[StoryRouter] = None


def get_story_router() -> StoryRouter:
    """Get the global story router instance."""
    global _story_router
    if _story_router is None:
        _story_router = StoryRouter()
    return _story_router


def set_story_router(router: StoryRouter) -> None:
    """Set the global story router instance."""
    global _story_router
    _story_router = router
