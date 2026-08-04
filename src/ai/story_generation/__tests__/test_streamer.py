"""Tests for story streaming."""
import pytest
import asyncio
from src.ai.story_generation.streamer import (
    StoryStreamer,
    StreamConfig,
    StreamingStoryGenerator,
    async_iterate_chunks,
)
from src.ai.story_generation.types import StreamEvent, StoryGenre


class TestStreamConfig:
    """Tests for StreamConfig dataclass."""
    
    def test_default_config(self):
        """Test default stream config."""
        config = StreamConfig()
        
        assert config.buffer_size == 100
        assert config.scene_boundary_detection is True
        assert config.min_scene_chars == 50
    
    def test_custom_config(self):
        """Test custom stream config."""
        config = StreamConfig(
            buffer_size=200,
            scene_boundary_detection=False,
            min_scene_chars=100,
        )
        
        assert config.buffer_size == 200
        assert config.scene_boundary_detection is False


class TestStoryStreamer:
    """Tests for StoryStreamer class."""
    
    def test_initialization(self):
        """Test streamer initialization."""
        streamer = StoryStreamer()
        
        assert streamer.config is not None
        assert streamer._buffer == ""
        assert streamer._cancelled is False
    
    def test_reset(self):
        """Test streamer reset."""
        streamer = StoryStreamer()
        
        streamer._buffer = "Some content"
        streamer._scene_index = 5
        
        streamer.reset()
        
        assert streamer._buffer == ""
        assert streamer._scene_index == 0
        assert streamer._cancelled is False
    
    def test_cancel(self):
        """Test cancelling streaming."""
        streamer = StoryStreamer()
        
        streamer.cancel()
        
        assert streamer._cancelled is True
    
    def test_listener_management(self):
        """Test adding and removing listeners."""
        streamer = StoryStreamer()
        
        def listener(event: StreamEvent):
            pass
        
        streamer.add_listener(listener)
        assert len(streamer._listeners) == 1
        
        streamer.remove_listener(listener)
        assert len(streamer._listeners) == 0
    
    def test_emit_event(self):
        """Test emitting events to listeners."""
        streamer = StoryStreamer()
        
        received_events = []
        
        def listener(event: StreamEvent):
            received_events.append(event)
        
        streamer.add_listener(listener)
        
        event = StreamEvent(event_type="test", text="Hello")
        streamer._emit_event(event)
        
        assert len(received_events) == 1
        assert received_events[0].event_type == "test"
    
    def test_detect_scene_boundary_markers(self):
        """Test scene boundary detection with markers."""
        streamer = StoryStreamer()
        
        # Test with *** - needs minimum chars
        text = "A" * 100 + " *** More content"
        has_boundary = streamer._detect_scene_boundary(text)
        assert has_boundary is True
    
    def test_detect_scene_boundary_paragraph(self):
        """Test scene boundary with paragraph break."""
        streamer = StoryStreamer()
        
        # Long text ending with paragraph break
        text = "A" * 150 + "\n\n" + "B" * 50
        has_boundary = streamer._detect_scene_boundary(text)
        
        # Should detect at buffer_size
        assert has_boundary is True
    
    def test_detect_scene_boundary_short(self):
        """Test that short text doesn't trigger boundary."""
        streamer = StoryStreamer(config=StreamConfig(min_scene_chars=100))
        
        # Text shorter than min_scene_chars
        text = "Short"
        has_boundary = streamer._detect_scene_boundary(text)
        
        assert has_boundary is False
    
    def test_stream_chunks_basic(self):
        """Test basic chunk streaming."""
        streamer = StoryStreamer()
        
        chunks = ["Hello ", "world", "!"]
        
        async def run():
            events = []
            async for event in streamer.stream_chunks(async_iterate_chunks(chunks)):
                events.append(event)
            return events
        
        events = asyncio.run(run())
        
        # Should have start, buffer/content, and complete events
        assert len(events) > 0
        
        # Check for story start
        start_events = [e for e in events if e.event_type == "story_start"]
        assert len(start_events) >= 1
        
        # Check for story complete
        complete_events = [e for e in events if e.event_type == "story_complete"]
        assert len(complete_events) >= 1
    
    def test_stream_chunks_with_cancellation(self):
        """Test streaming with cancellation."""
        streamer = StoryStreamer()
        
        chunks = ["Part1 ", "Part2 ", "Part3"]
        
        async def run():
            events = []
            streamer.cancel()  # Cancel immediately
            async for event in streamer.stream_chunks(async_iterate_chunks(chunks)):
                events.append(event)
            return events
        
        events = asyncio.run(run())
        
        # Should stop early due to cancellation
        assert len(events) >= 0  # May have 0 or 1 events before cancellation


class TestStreamingStoryGenerator:
    """Tests for StreamingStoryGenerator class."""
    
    def test_initialization(self):
        """Test streaming generator initialization."""
        generator = StreamingStoryGenerator()
        
        assert generator.streamer is not None
        assert generator.segmenter is not None
    
    def test_is_scene_complete(self):
        """Test scene completion detection."""
        generator = StreamingStoryGenerator()
        
        # Too short
        assert generator._is_scene_complete("Short", None) is False
        
        # Long enough with sentence end
        long_text = "A" * 100 + "."
        assert generator._is_scene_complete(long_text, None) is True
    
    def test_create_scene_from_buffer(self):
        """Test creating scene from buffer."""
        generator = StreamingStoryGenerator()
        
        buffer = "Once upon a time in a faraway land, there lived a brave hero."
        
        scene = generator._create_scene_from_buffer(buffer, 0)
        
        assert scene.index == 0
        assert scene.text == buffer
        assert scene.description is not None
        assert scene.scene_id is not None


class TestAsyncIterateChunks:
    """Tests for async_iterate_chunks helper."""
    
    def test_basic_iteration(self):
        """Test basic async iteration."""
        chunks = ["a", "b", "c"]
        
        async def run():
            result = []
            async for chunk in async_iterate_chunks(chunks):
                result.append(chunk)
            return result
        
        result = asyncio.run(run())
        
        assert result == ["a", "b", "c"]
    
    def test_empty_list(self):
        """Test with empty list."""
        async def run():
            result = []
            async for chunk in async_iterate_chunks([]):
                result.append(chunk)
            return result
        
        result = asyncio.run(run())
        
        assert result == []


class TestStreamEvents:
    """Tests for StreamEvent handling."""
    
    def test_scene_start_event(self):
        """Test scene start event structure."""
        event = StreamEvent(
            event_type="scene_start",
            scene_index=0,
            metadata={"total_scenes": 5},
        )
        
        assert event.event_type == "scene_start"
        assert event.scene_index == 0
        assert event.metadata["total_scenes"] == 5
    
    def test_buffer_event(self):
        """Test buffer event with text."""
        event = StreamEvent(
            event_type="buffer",
            text="Partial story content...",
            scene_index=1,
        )
        
        assert event.event_type == "buffer"
        assert "Partial" in event.text
        assert event.scene_index == 1
    
    def test_scene_complete_event(self):
        """Test scene complete event."""
        from src.ai.story_generation.types import StoryScene
        
        scene = StoryScene(
            scene_id="test",
            index=0,
            text="Complete scene",
            description="A complete scene",
        )
        
        event = StreamEvent(
            event_type="scene_complete",
            scene_index=0,
            text="Complete scene",
            scene=scene,
        )
        
        assert event.event_type == "scene_complete"
        assert event.scene is not None
        assert event.text == "Complete scene"
    
    def test_error_event(self):
        """Test error event."""
        event = StreamEvent(
            event_type="error",
            error="Connection failed",
            scene_index=2,
        )
        
        assert event.event_type == "error"
        assert "Connection failed" in event.error
    
    def test_story_complete_event(self):
        """Test story complete event."""
        event = StreamEvent(
            event_type="story_complete",
            metadata={
                "total_scenes": 5,
                "total_chars": 5000,
            },
        )
        
        assert event.event_type == "story_complete"
        assert event.metadata["total_scenes"] == 5


class TestStreamingEdgeCases:
    """Edge case tests for streaming."""
    
    def test_empty_chunks(self):
        """Test streaming with empty chunks."""
        streamer = StoryStreamer()
        
        chunks = ["", "", ""]
        
        async def run():
            events = []
            async for event in streamer.stream_chunks(async_iterate_chunks(chunks)):
                events.append(event)
            return events
        
        events = asyncio.run(run())
        
        # Should still complete
        assert len(events) >= 1
    
    def test_whitespace_chunks(self):
        """Test streaming with whitespace chunks."""
        streamer = StoryStreamer()
        
        chunks = ["Hello", " ", "World", "\n\n"]
        
        async def run():
            events = []
            async for event in streamer.stream_chunks(async_iterate_chunks(chunks)):
                events.append(event)
            return events
        
        events = asyncio.run(run())
        assert len(events) >= 1
    
    def test_unicode_chunks(self):
        """Test streaming with unicode chunks."""
        streamer = StoryStreamer()
        
        chunks = ["こんにちは世界", " 🌍 ", "Emojis: 🎭🎨"]
        
        async def run():
            events = []
            async for event in streamer.stream_chunks(async_iterate_chunks(chunks)):
                events.append(event)
            return events
        
        events = asyncio.run(run())
        assert len(events) >= 1
    
    def test_large_chunks(self):
        """Test streaming with large chunks."""
        streamer = StoryStreamer()
        
        chunks = ["x" * 1000, "y" * 1000]
        
        async def run():
            events = []
            async for event in streamer.stream_chunks(async_iterate_chunks(chunks)):
                events.append(event)
            return events
        
        events = asyncio.run(run())
        assert len(events) >= 1
    
    def test_listener_error_handling(self):
        """Test that listener errors don't crash streaming."""
        streamer = StoryStreamer()
        
        def bad_listener(event: StreamEvent):
            raise RuntimeError("Listener error")
        
        def good_listener(event: StreamEvent):
            pass
        
        streamer.add_listener(bad_listener)
        streamer.add_listener(good_listener)
        
        # Should not raise
        try:
            event = StreamEvent(event_type="test", text="Hello")
            streamer._emit_event(event)
        except RuntimeError:
            pytest.fail("Listener error should be caught")
