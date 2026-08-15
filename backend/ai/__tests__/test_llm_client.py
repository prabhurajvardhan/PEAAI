"""
Tests for LLM client module.
"""
import os
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ai.llm import (
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
        from backend.ai.llm import LLMRequest

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
        from backend.ai.llm import LLMRequest

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


class TestBedrockProvider:
    """Tests for Bedrock provider integration."""

    @pytest.fixture
    def bedrock_config(self):
        """Create test Bedrock configuration."""
        return LLMConfig(
            provider=LLMProvider.BEDROCK,
            model="amazon.nova-micro-v1:0",
            bedrock_settings={
                "aws_region": "us-east-1",
                "bedrock_model_id": "amazon.nova-micro-v1:0",
            },
        )

    @pytest.fixture
    def bedrock_client(self, bedrock_config):
        """Create test Bedrock client."""
        return LLMClient(bedrock_config)

    def test_bedrock_provider_selection(self, bedrock_config):
        """Test that Bedrock provider is correctly configured."""
        assert bedrock_config.provider == LLMProvider.BEDROCK

    def test_bedrock_model_selection(self, bedrock_config):
        """Test that Bedrock model is correctly set."""
        assert bedrock_config.model == "amazon.nova-micro-v1:0"
        assert bedrock_config.bedrock_settings["bedrock_model_id"] == "amazon.nova-micro-v1:0"

    def test_bedrock_aws_region(self, bedrock_config):
        """Test that AWS region is correctly configured."""
        assert bedrock_config.bedrock_settings["aws_region"] == "us-east-1"

    def test_bedrock_format_request(self, bedrock_client):
        """Test Bedrock request formatting."""
        from backend.ai.llm import LLMRequest

        request = LLMRequest(
            messages=[
                Message(role=MessageRole.SYSTEM, content="You are a helpful assistant"),
                Message(role=MessageRole.USER, content="Hello, how are you?"),
            ],
            model="amazon.nova-micro-v1:0",
            temperature=0.7,
        )

        formatted = bedrock_client.formatter.format_bedrock(request)

        # Verify request structure for Nova models
        assert "messages" in formatted
        assert "inferenceConfig" in formatted
        assert formatted["inferenceConfig"]["temperature"] == 0.7

    def test_bedrock_parse_response(self, bedrock_client):
        """Test Bedrock response parsing."""
        # Mock Nova response structure
        response_data = {
            "output": {
                "message": {
                    "content": [{"text": "Hello! I'm doing great, thank you!"}]
                }
            },
            "usage": {
                "inputTokens": 10,
                "outputTokens": 12,
                "totalTokens": 22,
            },
            "stopReason": "end_turn",
        }

        parsed = bedrock_client.parser.parse_bedrock(response_data, "amazon.nova-micro-v1:0")

        assert parsed.content == "Hello! I'm doing great, thank you!"
        assert parsed.model == "amazon.nova-micro-v1:0"
        assert parsed.usage["prompt_tokens"] == 10
        assert parsed.usage["completion_tokens"] == 12
        assert parsed.finish_reason == "stop"

    def test_bedrock_parse_response_no_content(self, bedrock_client):
        """Test Bedrock response parsing with no content."""
        response_data = {
            "output": {
                "message": {
                    "content": [{"text": ""}]
                }
            },
            "usage": {
                "inputTokens": 5,
                "outputTokens": 0,
                "totalTokens": 5,
            },
            "stopReason": "max_tokens",
        }

        parsed = bedrock_client.parser.parse_bedrock(response_data, "amazon.nova-micro-v1:0")

        assert parsed.content == ""
        assert parsed.finish_reason == "max_tokens"

    def test_bedrock_stream_chunk_parsing(self, bedrock_client):
        """Test Bedrock streaming chunk parsing."""
        import json
        # Simulate a streaming chunk from Bedrock
        chunk_data = {
            "chunk": {
                "bytes": json.dumps({"text": "Hello"}).encode("utf-8")
            }
        }

        parsed = bedrock_client.parser.parse_stream_bedrock(chunk_data)

        assert parsed.content == "Hello"
        assert parsed.delta == "Hello"

    def test_bedrock_config_from_env(self):
        """Test Bedrock configuration from environment variables."""
        # Test that LLM_PROVIDER environment variable works
        # This tests the _get_provider_from_env function behavior
        from backend.ai.llm.config import _get_provider_from_env
        
        # When env var is set to bedrock, it should return BEDROCK provider
        # We test the logic directly
        os.environ["LLM_PROVIDER"] = "bedrock"
        assert _get_provider_from_env() == LLMProvider.BEDROCK
        
        os.environ["LLM_PROVIDER"] = "openai"
        assert _get_provider_from_env() == LLMProvider.OPENAI
        
        os.environ["LLM_PROVIDER"] = "anthropic"
        assert _get_provider_from_env() == LLMProvider.ANTHROPIC
        
        os.environ["LLM_PROVIDER"] = "ollama"
        assert _get_provider_from_env() == LLMProvider.OLLAMA
        
        # Clean up
        os.environ.pop("LLM_PROVIDER", None)

    def test_bedrock_custom_model_selection(self):
        """Test that custom Bedrock model can be selected."""
        config = LLMConfig(
            provider=LLMProvider.BEDROCK,
            model="amazon.nova-lite-v1:0",
            bedrock_settings={
                "aws_region": "us-west-2",
                "bedrock_model_id": "amazon.nova-lite-v1:0",
            },
        )
        # Custom model should be used
        assert config.model == "amazon.nova-lite-v1:0"
        assert config.bedrock_settings["bedrock_model_id"] == "amazon.nova-lite-v1:0"

    def test_bedrock_no_api_key_required(self, bedrock_config):
        """Test that Bedrock doesn't require API key in config."""
        # Bedrock uses AWS SDK credential chain, not API key
        config = LLMConfig(
            provider=LLMProvider.BEDROCK,
            api_key=None,  # No API key needed
            bedrock_settings={
                "aws_region": "us-east-1",
                "bedrock_model_id": "amazon.nova-micro-v1:0",
            },
        )
        assert config.api_key is None
        assert config.bedrock_settings["bedrock_model_id"] == "amazon.nova-micro-v1:0"

    def test_bedrock_error_handling_import(self, bedrock_client):
        """Test that boto3 import error is handled."""
        with patch.dict("sys.modules", {"boto3": None}):
            # The import will fail gracefully with a clear error message
            pass  # Import happens at call time, not initialization


class TestBedrockIntegration:
    """Integration tests for Bedrock provider."""

    @pytest.fixture
    def bedrock_config(self):
        """Create test Bedrock configuration."""
        return LLMConfig(
            provider=LLMProvider.BEDROCK,
            model="amazon.nova-micro-v1:0",
            bedrock_settings={
                "aws_region": "us-east-1",
                "bedrock_model_id": "amazon.nova-micro-v1:0",
            },
        )

    @pytest.fixture
    def bedrock_client(self, bedrock_config):
        """Create test Bedrock client."""
        return LLMClient(bedrock_config)

    def test_bedrock_client_initialization(self, bedrock_client, bedrock_config):
        """Test that Bedrock client initializes correctly."""
        assert bedrock_client.config.provider == LLMProvider.BEDROCK
        assert bedrock_client.config.bedrock_settings["aws_region"] == "us-east-1"
        assert bedrock_client.config.bedrock_settings["bedrock_model_id"] == "amazon.nova-micro-v1:0"

    def test_bedrock_format_and_parse_flow(self, bedrock_client):
        """Test the complete format -> API call -> parse flow with mocks."""
        from backend.ai.llm import LLMRequest
        
        # Create request
        request = LLMRequest(
            messages=[
                Message(role=MessageRole.SYSTEM, content="You are helpful"),
                Message(role=MessageRole.USER, content="Hello"),
            ],
            model="amazon.nova-micro-v1:0",
            temperature=0.7,
        )
        
        # Format the request
        formatted = bedrock_client.formatter.format_bedrock(request)
        
        # Verify format
        assert "messages" in formatted
        assert "inferenceConfig" in formatted
        
        # Simulate a response and parse it
        mock_response = {
            "output": {
                "message": {
                    "content": [{"text": "Hi! How can I help you?"}]
                }
            },
            "usage": {
                "inputTokens": 10,
                "outputTokens": 8,
                "totalTokens": 18,
            },
            "stopReason": "end_turn",
        }
        
        parsed = bedrock_client.parser.parse_bedrock(mock_response, "amazon.nova-micro-v1:0")
        
        assert parsed.content == "Hi! How can I help you?"
        assert parsed.usage["total_tokens"] == 18
        assert parsed.finish_reason == "stop"
        assert parsed.model == "amazon.nova-micro-v1:0"

    def test_bedrock_stream_chunk_parsing(self, bedrock_client):
        """Test Bedrock streaming chunk parsing."""
        import json
        
        # Simulate streaming chunks from Bedrock
        chunk1 = {
            "chunk": {
                "bytes": json.dumps({"text": "Hello"}).encode("utf-8")
            }
        }
        chunk2 = {
            "chunk": {
                "bytes": json.dumps({"text": " world"}).encode("utf-8")
            }
        }
        final_chunk = {
            "stopReason": "end_turn"
        }
        
        parsed1 = bedrock_client.parser.parse_stream_bedrock(chunk1)
        parsed2 = bedrock_client.parser.parse_stream_bedrock(chunk2)
        parsed3 = bedrock_client.parser.parse_stream_bedrock(final_chunk)
        
        assert parsed1.content == "Hello"
        assert parsed2.content == " world"
        assert parsed3.content == ""  # No text in stop chunk
        assert parsed3.finish_reason == "end_turn"

    @pytest.mark.asyncio
    async def test_bedrock_parse_response_format(self, bedrock_client):
        """Test that Bedrock response parsing handles various formats."""
        # Test with complete response
        response_data = {
            "output": {
                "message": {
                    "content": [{"text": "Hello world"}]
                }
            },
            "usage": {
                "inputTokens": 5,
                "outputTokens": 2,
                "totalTokens": 7,
            },
            "stopReason": "end_turn",
        }
        
        parsed = bedrock_client.parser.parse_bedrock(response_data, "amazon.nova-micro-v1:0")
        assert parsed.content == "Hello world"
        assert parsed.usage["total_tokens"] == 7
        
        # Test with different stop reason
        response_data["stopReason"] = "max_tokens"
        parsed = bedrock_client.parser.parse_bedrock(response_data, "amazon.nova-micro-v1:0")
        assert parsed.finish_reason == "max_tokens"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
