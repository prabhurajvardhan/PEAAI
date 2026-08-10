"""
Streaming support for story generation.

Handles streaming story content from LLM with scene boundaries detection.
"""
import asyncio
import logging
from typing import AsyncGenerator, Callable, List, Optional
from dataclasses import dataclass
from collections.abc import AsyncIterator

from .types import StoryScene, StreamEvent, StoryGenre, StoryGenerationConfig
from .segmenter import SceneSegmenter, get_segmenter

logger = logging.getLogger(__name__)


@dataclass
class StreamConfig:
    """Configuration for streaming."""
    buffer_size: int = 100  # Characters to buffer before yielding
    scene_boundary_detection: bool = True
    min_scene_chars: int = 50  # Minimum chars before checking for scene boundary


class StoryStreamer:
    """
    Streams story content with scene boundary detection.
    
    Features:
    - Character-by-character streaming
    - Scene boundary detection
    - Buffered streaming for performance
    - Cancellation support
    """
    
    def __init__(
        self,
        segmenter: Optional[SceneSegmenter] = None,
        config: Optional[StreamConfig] = None,
    ):
        """
        Initialize the streamer.
        
        Args:
            segmenter: Scene segmenter for boundary detection
            config: Stream configuration
        """
        self.segmenter = segmenter or get_segmenter()
        self.config = config or StreamConfig()
        self._buffer = ""
        self._scene_buffer = ""
        self._scene_index = 0
        self._cancelled = False
        self._listeners: List[Callable[[StreamEvent], None]] = []
    
    def add_listener(self, listener: Callable[[StreamEvent], None]) -> None:
        """Add a listener for stream events."""
        self._listeners.append(listener)
    
    def remove_listener(self, listener: Callable[[StreamEvent], None]) -> None:
        """Remove a listener."""
        if listener in self._listeners:
            self._listeners.remove(listener)
    
    def _emit_event(self, event: StreamEvent) -> None:
        """Emit an event to all listeners."""
        for listener in self._listeners:
            try:
                listener(event)
            except Exception as e:
                logger.error(f"Stream listener error: {e}")
    
    def cancel(self) -> None:
        """Cancel the current streaming operation."""
        self._cancelled = True
    
    def reset(self) -> None:
        """Reset the streamer state."""
        self._buffer = ""
        self._scene_buffer = ""
        self._scene_index = 0
        self._cancelled = False
    
    def stream_chunks(
        self,
        chunks: AsyncIterator[str],
    ) -> AsyncGenerator[StreamEvent, None]:
        """
        Stream chunks and emit scene events.
        
        Args:
            chunks: Async iterator of text chunks
        
        Yields:
            StreamEvent for each scene segment
        """
        self.reset()
        
        async def process():
            buffer = ""
            scene_buffer = ""
            scene_index = 0
            first_chunk = True
            
            async for chunk in chunks:
                if self._cancelled:
                    break
                
                buffer += chunk
                scene_buffer += chunk
                
                # Emit first chunk event
                if first_chunk:
                    yield StreamEvent(
                        event_type="story_start",
                        metadata={"total_scenes": 0},
                    )
                    first_chunk = False
                
                # Check for scene boundaries
                if self.config.scene_boundary_detection:
                    scene_complete = self._detect_scene_boundary(scene_buffer)
                else:
                    scene_complete = len(scene_buffer) >= self.config.buffer_size
                
                if scene_complete:
                    # Yield scene text event
                    yield StreamEvent(
                        event_type="scene_text",
                        scene_index=scene_index,
                        text=scene_buffer,
                    )
                    scene_buffer = ""
                    scene_index += 1
                
                # Also emit buffered chunks for immediate display
                if len(buffer) >= self.config.buffer_size:
                    yield StreamEvent(
                        event_type="buffer",
                        text=buffer,
                        scene_index=scene_index,
                    )
                    buffer = ""
            
            # Yield remaining content
            if scene_buffer.strip():
                yield StreamEvent(
                    event_type="scene_text",
                    scene_index=scene_index,
                    text=scene_buffer,
                )
            
            # Story complete
            yield StreamEvent(
                event_type="story_complete",
                metadata={"total_scenes": scene_index + 1},
            )
        
        return process()
    
    def _detect_scene_boundary(self, text: str) -> bool:
        """
        Detect if the text has reached a scene boundary.
        
        Args:
            text: Current buffered text
        
        Returns:
            True if a scene boundary is detected
        """
        if len(text) < self.config.min_scene_chars:
            return False
        
        # Check for scene break markers
        markers = ["***", "\n\n\n", "---", "==="]
        for marker in markers:
            if marker in text:
                return True
        
        # Check for natural paragraph breaks with enough content
        if "\n\n" in text and len(text) >= self.config.buffer_size:
            # Check if we're at a good break point
            last_two_newlines = text.rfind("\n\n")
            if last_two_newlines > len(text) * 0.5:  # At least 50% through
                return True
        
        # Check for dialogue ending followed by narration
        if '"' in text:
            # If we have multiple dialogue segments, we might be at a scene boundary
            quote_count = text.count('"')
            if quote_count >= 4 and len(text) >= self.config.buffer_size:
                return True
        
        return False


class StreamingStoryGenerator:
    """
    Generates stories with streaming support.
    
    Combines LLM streaming with scene segmentation and event emission.
    """
    
    def __init__(
        self,
        streamer: Optional[StoryStreamer] = None,
        segmenter: Optional[SceneSegmenter] = None,
    ):
        """
        Initialize the streaming generator.
        
        Args:
            streamer: Story streamer instance
            segmenter: Scene segmenter instance
        """
        self.streamer = streamer or StoryStreamer(segmenter=segmenter)
        self.segmenter = segmenter or self.streamer.segmenter
    
    async def generate_streaming(
        self,
        llm_stream: AsyncIterator[str],
        genre: StoryGenre = StoryGenre.ADVENTURE,
        config: Optional[StoryGenerationConfig] = None,
    ) -> AsyncGenerator[StreamEvent, None]:
        """
        Generate a story with streaming.
        
        Args:
            llm_stream: Async iterator of LLM response chunks
            genre: Story genre
            config: Generation configuration
        
        Yields:
            StreamEvent for each scene and buffer update
        """
        story_text = ""
        scene_buffer = ""
        scene_index = 0
        first_event = True
        
        async for chunk in llm_stream:
            if self.streamer._cancelled:
                break
            
            story_text += chunk
            scene_buffer += chunk
            
            # Emit story start event
            if first_event:
                yield StreamEvent(
                    event_type="story_start",
                    scene_index=0,
                    metadata={"genre": genre.value},
                )
                first_event = False
            
            # Check for scene completion
            if self._is_scene_complete(scene_buffer, config):
                # Segment and emit scene
                scene = self._create_scene_from_buffer(scene_buffer, scene_index)
                yield StreamEvent(
                    event_type="scene_complete",
                    scene_index=scene_index,
                    text=scene_buffer,
                    scene=scene,
                )
                
                scene_buffer = ""
                scene_index += 1
            else:
                # Emit buffer update for immediate display
                yield StreamEvent(
                    event_type="buffer",
                    text=scene_buffer,
                    scene_index=scene_index,
                )
        
        # Handle remaining buffer
        if scene_buffer.strip():
            scene = self._create_scene_from_buffer(scene_buffer, scene_index)
            yield StreamEvent(
                event_type="scene_complete",
                scene_index=scene_index,
                text=scene_buffer,
                scene=scene,
            )
            scene_index += 1
        
        # Story complete
        yield StreamEvent(
            event_type="story_complete",
            metadata={
                "total_scenes": scene_index,
                "total_chars": len(story_text),
            },
        )
    
    def _is_scene_complete(
        self,
        buffer: str,
        config: Optional[StoryGenerationConfig],
    ) -> bool:
        """Check if the scene buffer is complete."""
        if config and config.scene_max_chars:
            min_chars = config.scene_min_chars
            max_chars = config.scene_max_chars
        else:
            min_chars = 100
            max_chars = 800
        
        if len(buffer) < min_chars:
            return False
        
        # Check for natural boundaries
        if len(buffer) >= max_chars:
            return True
        
        # Check for paragraph break
        if buffer.endswith("\n\n"):
            return True
        
        # Check for sentence end followed by short pause
        if len(buffer) >= min_chars:
            if buffer[-1] in ".!?":
                return True
        
        return False
    
    def _create_scene_from_buffer(
        self,
        buffer: str,
        index: int,
    ) -> StoryScene:
        """Create a StoryScene from buffered text."""
        from .segmenter import get_segmenter
        
        segmenter = get_segmenter()
        result = segmenter.segment(buffer, scene_index_offset=index)
        
        if result.scenes:
            return result.scenes[0]
        
        # Fallback: create a basic scene
        import uuid
        return StoryScene(
            scene_id=f"scene_{uuid.uuid4().hex[:8]}",
            index=index,
            text=buffer.strip(),
            description=buffer.strip()[:200],
        )


# Helper function for async iteration
async def async_iterate_chunks(chunks: List[str]) -> AsyncIterator[str]:
    """Helper to iterate over chunks asynchronously."""
    for chunk in chunks:
        await asyncio.sleep(0)  # Yield control
        yield chunk
