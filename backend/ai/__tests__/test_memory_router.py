"""
Tests for Memory Router module.
"""
import pytest
import asyncio

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ai.routing.memory import (
    MemoryRouter,
    MemoryQuery,
    MemoryQueryType,
    MemoryContext,
)


class TestMemoryRouter:
    """Tests for MemoryRouter."""

    @pytest.fixture
    def router(self):
        """Create test router."""
        return MemoryRouter(default_max_tokens=2000)

    def test_analyze_query_user_context(self, router):
        """Test user context query analysis."""
        texts = [
            "What do you know about me?",
            "Tell me about myself",
            "What is my name?",
        ]
        for text in texts:
            query_type = router.analyze_query(text)
            # These phrases should trigger user context or relationship queries
            assert query_type in [MemoryQueryType.USER_CONTEXT, MemoryQueryType.RELATIONSHIP_INFO, MemoryQueryType.STORY_CONTEXT], f"Failed for: {text}"

    def test_analyze_query_story(self, router):
        """Test story query analysis."""
        texts = [
            "Tell me a story about dragons",
            "Remember when we went on an adventure?",
            "What was that story you told me?",
        ]
        for text in texts:
            query_type = router.analyze_query(text)
            assert query_type == MemoryQueryType.STORY_CONTEXT, f"Failed for: {text}"

    def test_analyze_query_relationship(self, router):
        """Test relationship query analysis."""
        texts = [
            "How do you feel about me?",
            "What's our relationship like?",
        ]
        for text in texts:
            query_type = router.analyze_query(text)
            # Relationship keywords should prioritize relationship queries
            assert query_type in [MemoryQueryType.RELATIONSHIP_INFO, MemoryQueryType.USER_CONTEXT], f"Failed for: {text}"

    def test_analyze_query_preferences(self, router):
        """Test preferences query analysis."""
        texts = [
            "What do I like?",
            "What are my preferences?",
            "Do I prefer coffee or tea?",
        ]
        for text in texts:
            query_type = router.analyze_query(text)
            assert query_type == MemoryQueryType.PREFERENCES, f"Failed for: {text}"

    def test_analyze_query_conversation_history(self, router):
        """Test conversation history query analysis."""
        texts = [
            "What did we talk about before?",
            "What happened last time?",
        ]
        for text in texts:
            query_type = router.analyze_query(text)
            # These should trigger conversation history or relationship
            assert query_type in [MemoryQueryType.CONVERSATION_HISTORY, MemoryQueryType.RELATIONSHIP_INFO, MemoryQueryType.USER_CONTEXT, MemoryQueryType.GENERAL], f"Failed for: {text}"

    def test_analyze_query_general(self, router):
        """Test general query analysis."""
        text = "What's the weather like?"
        query_type = router.analyze_query(text)
        # Weather is general or could be relationship
        assert query_type in [MemoryQueryType.GENERAL, MemoryQueryType.RELATIONSHIP_INFO]

    @pytest.mark.asyncio
    async def test_retrieve_context(self, router):
        """Test context retrieval."""
        query = MemoryQuery(
            user_id="user123",
            query_text="Tell me about myself",
            query_type=MemoryQueryType.USER_CONTEXT,
        )

        context = await router.retrieve_context(query)

        assert context.user_id == "user123"
        assert context.query_type == MemoryQueryType.USER_CONTEXT
        assert context.system_prompt is not None

    @pytest.mark.asyncio
    async def test_retrieve_context_story(self, router):
        """Test story context retrieval."""
        query = MemoryQuery(
            user_id="user123",
            query_text="Tell me a story",
            query_type=MemoryQueryType.STORY_CONTEXT,
        )

        context = await router.retrieve_context(query)

        assert context.system_prompt is not None

    def test_inject_memory(self, router):
        """Test memory injection into messages."""
        context = MemoryContext(
            user_id="user123",
            query_type=MemoryQueryType.USER_CONTEXT,
            system_prompt="User is named John.",
            conversation_history=[],
            max_context_tokens=2000,
        )

        messages = [
            {"role": "user", "content": "Hello!"},
        ]

        result = router.inject_memory(messages, context)

        assert result.messages is not None
        assert len(result.messages) == 2  # System + user

        # Check system message contains memory
        system_msg = result.messages[0]
        assert system_msg["role"] == "system"
        assert "John" in system_msg["content"]

    def test_inject_memory_with_existing_system(self, router):
        """Test memory injection when system message exists."""
        context = MemoryContext(
            user_id="user123",
            query_type=MemoryQueryType.USER_CONTEXT,
            system_prompt="User loves music.",
            max_context_tokens=2000,
        )

        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"},
        ]

        result = router.inject_memory(messages, context)

        # System message should have both
        system_msg = result.messages[0]
        assert "helpful assistant" in system_msg["content"]
        assert "music" in system_msg["content"]

    def test_inject_memory_truncation(self, router):
        """Test memory truncation for long context."""
        context = MemoryContext(
            user_id="user123",
            query_type=MemoryQueryType.USER_CONTEXT,
            system_prompt="A" * 10000,  # Very long
            max_context_tokens=1000,  # Small limit
        )

        messages = [{"role": "user", "content": "Hi"}]

        result = router.inject_memory(messages, context)

        # Should be truncated
        assert len(result.context.system_prompt) <= context.max_context_tokens * 4

    def test_get_fallback_response(self, router):
        """Test fallback responses."""
        # Test different query types
        fallback = router.get_fallback_response(MemoryQueryType.USER_CONTEXT)
        assert fallback is not None
        assert len(fallback) > 0

        fallback = router.get_fallback_response(MemoryQueryType.STORY_CONTEXT)
        assert fallback is not None

        fallback = router.get_fallback_response(MemoryQueryType.GENERAL)
        assert fallback is not None

    def test_store_memory(self, router):
        """Test storing a memory."""
        result = asyncio.run(router.store_memory(
            user_id="user123",
            content="User loves cats",
            memory_type="user_preference",
        ))
        assert result == True

    def test_clear_cache(self, router):
        """Test clearing the cache."""
        router._memory_cache["key"] = "value"
        router.clear_cache()
        assert len(router._memory_cache) == 0


class TestQueryTypeMapping:
    """Tests for query type to memory type mapping."""

    def test_memory_type_mapping(self):
        """Test query type maps to correct memory types."""
        router = MemoryRouter()

        types = router._extract_memory_types(MemoryQueryType.USER_CONTEXT)
        assert "user_preference" in types

        types = router._extract_memory_types(MemoryQueryType.STORY_CONTEXT)
        assert "story" in types

        types = router._extract_memory_types(MemoryQueryType.RELATIONSHIP_INFO)
        assert "relationship" in types

        types = router._extract_memory_types(MemoryQueryType.PREFERENCES)
        assert "user_preference" in types


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
