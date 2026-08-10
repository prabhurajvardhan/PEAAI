"""
Story Generation Pipeline.

Main module for generating stories using the LLM with:
- Story generation prompts
- Scene segmentation
- Streaming support
- Context window management
"""
import asyncio
import logging
import uuid
from typing import AsyncGenerator, List, Optional, Dict, Any
from dataclasses import dataclass

from .types import (
    StoryGenre,
    StoryLength,
    StoryGenerationConfig,
    StoryScene,
    GeneratedStory,
    StoryPromptContext,
    StreamEvent,
)
from .prompts import build_system_prompt, build_story_prompt
from .segmenter import SceneSegmenter, get_segmenter
from .streamer import StoryStreamer, StreamingStoryGenerator
from .context import ContextManager, get_context_manager

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    """Result of story generation."""
    story: GeneratedStory
    total_scenes: int
    total_tokens_used: int
    streaming_enabled: bool


class StoryGenerator:
    """
    Main story generation pipeline.
    
    Features:
    - Multi-scene story generation
    - Streaming support with scene detection
    - Context management across scenes
    - Genre-aware prompt generation
    - Configurable story length
    """
    
    def __init__(
        self,
        llm_client: Any = None,
        segmenter: Optional[SceneSegmenter] = None,
        context_manager: Optional[ContextManager] = None,
        streamer: Optional[StoryStreamer] = None,
    ):
        """
        Initialize the story generator.
        
        Args:
            llm_client: LLM client for generating content
            segmenter: Scene segmenter instance
            context_manager: Context manager instance
            streamer: Story streamer instance
        """
        self.llm_client = llm_client
        self.segmenter = segmenter or get_segmenter()
        self.context_manager = context_manager or get_context_manager()
        self.streamer = streamer or StoryStreamer(segmenter=self.segmenter)
        self.streaming_generator = StreamingStoryGenerator(
            streamer=self.streamer,
            segmenter=self.segmenter,
        )
        
        # Story tracking
        self._active_stories: Dict[str, GeneratedStory] = {}
    
    def set_llm_client(self, llm_client: Any) -> None:
        """Set the LLM client."""
        self.llm_client = llm_client
    
    async def generate_story(
        self,
        context: StoryPromptContext,
        config: Optional[StoryGenerationConfig] = None,
    ) -> GeneratedStory:
        """
        Generate a complete story.
        
        Args:
            context: Story prompt context
            config: Generation configuration
        
        Returns:
            Generated story with scenes
        """
        config = config or StoryGenerationConfig(
            genre=context.story_genre_hint or StoryGenre.ADVENTURE
        )
        
        story_id = f"story_{uuid.uuid4().hex[:8]}"
        
        # Determine number of scenes based on length
        num_scenes = self._get_scene_count(config.length)
        
        logger.info(f"Generating story with {num_scenes} scenes")
        
        # Generate scenes
        scenes = []
        full_text_parts = []
        current_story_context = ""
        
        for scene_idx in range(num_scenes):
            is_continuation = scene_idx > 0
            
            # Build scene prompt
            scene_prompt = build_story_prompt(
                context=context,
                config=config,
                scene_index=scene_idx,
                is_continuation=is_continuation,
            )
            
            # Build system prompt
            system_prompt = build_system_prompt(config.genre)
            
            # Add continuation context
            if current_story_context:
                scene_prompt = (
                    f"Previous story context:\n{current_story_context}\n\n"
                    f"{scene_prompt}"
                )
            
            # Truncate prompt if needed
            max_prompt_tokens = self.context_manager.available_input_tokens // 2
            scene_prompt = self.context_manager.truncate_to_token_limit(
                scene_prompt, max_prompt_tokens
            )
            
            # Generate scene using LLM
            try:
                scene_text = await self._generate_scene_text(
                    system_prompt=system_prompt,
                    user_prompt=scene_prompt,
                    config=config,
                )
            except Exception as e:
                logger.error(f"Scene generation failed: {e}")
                # Create placeholder scene
                scene_text = f"[Story continues with scene {scene_idx + 1}...]"
            
            # Segment the scene text
            scene_result = self.segmenter.segment(
                scene_text,
                genre=config.genre,
                scene_index_offset=scene_idx * 10,
            )
            
            # Add scenes to list
            for seg_scene in scene_result.scenes:
                seg_scene.index = len(scenes)
                scenes.append(seg_scene)
                full_text_parts.append(seg_scene.text)
            
            # Update story context
            current_story_context = "\n\n".join(full_text_parts[-3:])
            
            # Update context manager
            if scene_result.scenes:
                latest_scene = scene_result.scenes[-1]
                self.context_manager.add_scene_context(
                    scene_idx,
                    latest_scene.text,
                    latest_scene.characters,
                    latest_scene.setting,
                )
            
            logger.info(f"Scene {scene_idx + 1}/{num_scenes} generated")
        
        # Create story
        story = GeneratedStory(
            story_id=story_id,
            title=f"A {config.genre.value.capitalize()} Tale",
            genre=config.genre,
            full_text="\n\n".join(full_text_parts),
            scenes=scenes,
            metadata={
                "length": config.length.value,
                "num_scenes": len(scenes),
                "context_stats": self.context_manager.get_stats(),
            },
        )
        
        self._active_stories[story_id] = story
        return story
    
    async def generate_story_streaming(
        self,
        context: StoryPromptContext,
        config: Optional[StoryGenerationConfig] = None,
    ) -> AsyncGenerator[StreamEvent, None]:
        """
        Generate a story with streaming.
        
        Args:
            context: Story prompt context
            config: Generation configuration
        
        Yields:
            StreamEvent for each scene and buffer update
        """
        config = config or StoryGenerationConfig(
            genre=context.story_genre_hint or StoryGenre.ADVENTURE,
            enable_streaming=True,
        )
        
        story_id = f"story_{uuid.uuid4().hex[:8]}"
        num_scenes = self._get_scene_count(config.length)
        
        logger.info(f"Generating streaming story with {num_scenes} scenes")
        
        # Reset streamer
        self.streamer.reset()
        
        # Generate scenes one by one with streaming
        all_scenes = []
        full_text_parts = []
        
        for scene_idx in range(num_scenes):
            is_continuation = scene_idx > 0
            
            # Emit scene start
            yield StreamEvent(
                event_type="scene_start",
                scene_index=scene_idx,
                metadata={
                    "story_id": story_id,
                    "total_scenes": num_scenes,
                    "is_continuation": is_continuation,
                },
            )
            
            # Build prompt
            scene_prompt = build_story_prompt(
                context=context,
                config=config,
                scene_index=scene_idx,
                is_continuation=is_continuation,
            )
            system_prompt = build_system_prompt(config.genre)
            
            # Add continuation context
            if full_text_parts:
                continuation = "\n\n".join(full_text_parts[-2:])
                scene_prompt = (
                    f"Story so far:\n{continuation}\n\n"
                    f"{scene_prompt}"
                )
            
            # Truncate prompt
            max_prompt_tokens = self.context_manager.available_input_tokens // 2
            scene_prompt = self.context_manager.truncate_to_token_limit(
                scene_prompt, max_prompt_tokens
            )
            
            # Stream from LLM
            try:
                async def generate_stream():
                    async for chunk in await self._stream_scene_text(
                        system_prompt=system_prompt,
                        user_prompt=scene_prompt,
                        config=config,
                    ):
                        yield chunk
                
                # Process streaming chunks
                scene_buffer = ""
                async for event in self.streaming_generator.generate_streaming(
                    generate_stream(),
                    genre=config.genre,
                    config=config,
                ):
                    if event.event_type == "buffer":
                        scene_buffer += event.text if event.text else ""
                    elif event.event_type == "scene_complete":
                        scene_buffer = event.text or scene_buffer
                        yield event
                    elif event.event_type == "story_complete":
                        # Don't emit, we're in scene mode
                        pass
                    else:
                        yield event
                
                # Segment the completed scene
                if scene_buffer.strip():
                    scene_result = self.segmenter.segment(
                        scene_buffer,
                        genre=config.genre,
                        scene_index_offset=scene_idx * 10,
                    )
                    
                    for seg_scene in scene_result.scenes:
                        seg_scene.index = len(all_scenes)
                        all_scenes.append(seg_scene)
                        full_text_parts.append(seg_scene.text)
                    
                    # Update context
                    if scene_result.scenes:
                        latest = scene_result.scenes[-1]
                        self.context_manager.add_scene_context(
                            scene_idx,
                            latest.text,
                            latest.characters,
                            latest.setting,
                        )
            
            except Exception as e:
                logger.error(f"Scene streaming failed: {e}")
                yield StreamEvent(
                    event_type="error",
                    scene_index=scene_idx,
                    error=str(e),
                )
            
            logger.info(f"Scene {scene_idx + 1}/{num_scenes} complete")
        
        # Emit story complete
        yield StreamEvent(
            event_type="story_complete",
            metadata={
                "story_id": story_id,
                "total_scenes": len(all_scenes),
                "total_chars": sum(len(t) for t in full_text_parts),
            },
        )
    
    async def _generate_scene_text(
        self,
        system_prompt: str,
        user_prompt: str,
        config: StoryGenerationConfig,
    ) -> str:
        """Generate scene text using the LLM."""
        if self.llm_client is None:
            raise ValueError("LLM client not configured")
        
        # Import message types from LLM module
        from backend.ai.llm.types import Message, MessageRole
        
        messages = [
            Message(role=MessageRole.SYSTEM, content=system_prompt),
            Message(role=MessageRole.USER, content=user_prompt),
        ]
        
        response = await self.llm_client.complete(
            messages=messages,
            temperature=config.temperature,
            max_tokens=config.max_tokens_per_scene,
        )
        
        return response.content
    
    async def _stream_scene_text(
        self,
        system_prompt: str,
        user_prompt: str,
        config: StoryGenerationConfig,
    ) -> AsyncGenerator[str, None]:
        """Stream scene text from the LLM."""
        if self.llm_client is None:
            raise ValueError("LLM client not configured")
        
        from backend.ai.llm.types import Message, MessageRole
        
        messages = [
            Message(role=MessageRole.SYSTEM, content=system_prompt),
            Message(role=MessageRole.USER, content=user_prompt),
        ]
        
        async for chunk in self.llm_client.stream_complete(
            messages=messages,
            temperature=config.temperature,
            max_tokens=config.max_tokens_per_scene,
        ):
            yield chunk.content
    
    def _get_scene_count(self, length: StoryLength) -> int:
        """Get number of scenes based on story length."""
        counts = {
            StoryLength.SHORT: 2,
            StoryLength.MEDIUM: 5,
            StoryLength.LONG: 8,
        }
        return counts.get(length, 5)
    
    def get_active_story(self, story_id: str) -> Optional[GeneratedStory]:
        """Get an active story by ID."""
        return self._active_stories.get(story_id)
    
    def clear_active_story(self, story_id: str) -> bool:
        """Clear an active story."""
        if story_id in self._active_stories:
            del self._active_stories[story_id]
            return True
        return False


# Global generator instance
_story_generator: Optional[StoryGenerator] = None


def get_story_generator() -> StoryGenerator:
    """Get or create the global story generator instance."""
    global _story_generator
    if _story_generator is None:
        _story_generator = StoryGenerator()
    return _story_generator


def set_story_generator(generator: StoryGenerator) -> None:
    """Set the global story generator instance."""
    global _story_generator
    _story_generator = generator
