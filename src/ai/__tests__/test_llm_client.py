"""
Tests for LLM client module.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.ai.llm import (
    Message,
    MessageRole,
    LLMClient,
    LLMConfig,
    LLMProvider,
    TokenManager,
)


class TestTokenManager:
    """Tests for TokenManager."""

    def test_estimate_tokens(self):
        """Test token estimation."""
        tm = TokenManager()
        # Simple approximation: ~4 chars per token
        text = "hello world"
        expected = len(text) // 4
        assert tm.estimate_tokens(text) == expected

    def test_count_message_tokens(self):
        """Test message token counting."""
        tm = TokenManager()
        msg = Message(role=MessageRole.USER, content="test message")
        tokens = tm.count_message_tokens(msg)
        assert tokens > 0

    def test_truncate_messages(self):
        """Test message truncation."""
        tm = TokenManager(max_context_tokens=100, max_response_tokens=50)
        messages = [
            Message(role=MessageRole.USER, content="short"),
            Message(role=MessageRole.USER, content="a" * 200),
            Message(role=MessageRole.USER, content="another short"),
        ]
        truncated = tm.truncate_messages(messages, max_tokens=50)
        # Should truncate to fit within limit
        assert tm.count_messages_tokens(truncated) <= 50

    def test_truncate_preserves_system(self):
        """Test that system message is preserved."""
        tm = TokenManager(max_context_tokens=100)
        messages = [
            Message(role=MessageRole.SYSTEM, content="system prompt"),
            Message(role=MessageRole.USER, content="a" * 200),
        ]
        truncated = tm.truncate_messages(messages, max_tokens=50)
        # System message should be in truncated list
        assert any(m.role == MessageRole.SYSTEM for m in truncated)


class TestLLMClient:
    """Tests for LLMClient."""

    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return LLMConfig(
            provider=LLMProvider.OPENAI,
            api_key="test-key",
            model="gpt-4",
        )

    @pytest.fixture
    def client(self, config):
        """Create test client."""
        return LLMClient(config)

    def test_init(self, client, config):
        """Test client initialization."""
        assert client.config == config
        assert client.token_manager is not None
        assert client.formatter is not None
        assert client.parser is not None

    def test_format_request_openai(self, client):
        """Test OpenAI request formatting."""
        from src.ai.llm import LLMRequest

        request = LLMRequest(
            messages=[
                Message(role=MessageRole.SYSTEM, content="You are helpful"),
                Message(role=MessageRole.USER, content="Hello"),
            ],
            model="gpt-4",
            temperature=0.7,
        )

        formatted = client.formatter.format_openai(request)

        assert formatted["model"] == "gpt-4"
        assert len(formatted["messages"]) == 2
        assert formatted["temperature"] == 0.7

    def test_format_request_anthropic(self, client):
        """Test Anthropic request formatting."""
        from src.ai.llm import LLMRequest

        request = LLMRequest(
            messages=[
                Message(role=MessageRole.SYSTEM, content="You are helpful"),
                Message(role=MessageRole.USER, content="Hello"),
            ],
            model="claude-3",
            temperature=0.7,
        )

        formatted = client.formatter.format_anthropic(request)

        assert formatted["model"] == "claude-3"
        assert "system" in formatted
        assert len(formatted["messages"]) == 1  # System merged into system field

    def test_parse_response_openai(self, client):
        """Test OpenAI response parsing."""
        response_data = {
            "choices": [{
                "message": {"content": "Hello!"},
                "finish_reason": "stop",
            }],
            "model": "gpt-4",
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            },
        }

        parsed = client.parser.parse_openai(response_data)

        assert parsed.content == "Hello!"
        assert parsed.model == "gpt-4"
        assert parsed.usage["total_tokens"] == 15

    def test_get_endpoint(self, client):
        """Test endpoint selection."""
        assert "chat/completions" in client._get_endpoint()

    def test_handle_error_401(self, client):
        """Test authentication error handling."""
        with pytest.raises(Exception) as exc_info:
            client._handle_error(401, "Invalid API key")
        assert "Invalid API key" in str(exc_info.value) or "401" in str(exc_info.value)

    def test_handle_error_429(self, client):
        """Test rate limit error handling."""
        with pytest.raises(Exception) as exc_info:
            client._handle_error(429, "Rate limit exceeded")
        assert "Rate limit" in str(exc_info.value) or "429" in str(exc_info.value)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
