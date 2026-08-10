"""
Story Generation Pipeline - M08 AI Engine

Generates stories using the LLM with:
- Story generation prompts
- Scene segmentation
- Streaming support
- Context window management

This module depends on:
- LLM client from BA-001 (backend/ai/llm/)
- EventDispatcher from BA-001 (backend/ai/event_dispatcher/)
- Story types from BA-001 (backend/ai/routing/story/types.py)
"""

from .types import (
    StoryGenre,
    StoryLength,
    StoryGenerationConfig,
    StoryScene,
    GeneratedStory,
    StoryPromptContext,
    StreamEvent,
    SceneMarker,
)

from .prompts import (
    build_system_prompt,
    build_story_prompt,
    get_prompt_template,
    PromptTemplate,
)

from .segmenter import (
    SceneSegmenter,
    SegmentationResult,
    get_segmenter,
)

from .streamer import (
    StoryStreamer,
    StreamConfig,
    StreamingStoryGenerator,
    async_iterate_chunks,
)

from .context import (
    ContextManager,
    ContextWindow,
    MemorySummary,
    get_context_manager,
    set_context_manager,
)

from .generator import (
    StoryGenerator,
    GenerationResult,
    get_story_generator,
    set_story_generator,
)

__all__ = [
    # Types
    "StoryGenre",
    "StoryLength",
    "StoryGenerationConfig",
    "StoryScene",
    "GeneratedStory",
    "StoryPromptContext",
    "StreamEvent",
    "SceneMarker",
    # Prompts
    "build_system_prompt",
    "build_story_prompt",
    "get_prompt_template",
    "PromptTemplate",
    # Segmentation
    "SceneSegmenter",
    "SegmentationResult",
    "get_segmenter",
    # Streaming
    "StoryStreamer",
    "StreamConfig",
    "StreamingStoryGenerator",
    "async_iterate_chunks",
    # Context
    "ContextManager",
    "ContextWindow",
    "MemorySummary",
    "get_context_manager",
    "set_context_manager",
    # Generator
    "StoryGenerator",
    "GenerationResult",
    "get_story_generator",
    "set_story_generator",
]
