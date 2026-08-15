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
        """Test Bedrock request formatting using Nova standard message format."""
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
        assert "system" in formatted  # System field present
        assert formatted["inferenceConfig"]["temperature"] == 0.7
        # Verify system prompt is in system field
        assert len(formatted["system"]) == 1
        assert formatted["system"][0]["text"] == "You are a helpful assistant"
        # Verify user message
        assert len(formatted["messages"]) == 1
        assert formatted["messages"][0]["role"] == "user"
        assert formatted["messages"][0]["content"][0]["text"] == "Hello, how are you?"

    def test_bedrock_format_request_no_system(self, bedrock_client):
        """Test Bedrock formatting without system prompt."""
        from backend.ai.llm import LLMRequest

        request = LLMRequest(
            messages=[
                Message(role=MessageRole.USER, content="Hello"),
            ],
            model="amazon.nova-micro-v1:0",
            temperature=0.5,
        )

        formatted = bedrock_client.formatter.format_bedrock(request)

        # No system field when no system message
        assert "system" not in formatted
        assert len(formatted["messages"]) == 1

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

    @pytest.mark.asyncio
    async def test_complete_bedrock_with_mocked_boto3(self, bedrock_client):
        """Test _complete_bedrock with mocked boto3 client."""
        import json
        import io
        
        # Create mock response body
        response_body = json.dumps({
            "output": {
                "message": {
                    "content": [{"text": "Test response"}]
                }
            },
            "usage": {
                "inputTokens": 10,
                "outputTokens": 5,
                "totalTokens": 15,
            },
            "stopReason": "end_turn",
        }).encode("utf-8")
        
        # Create mock response
        mock_response = MagicMock()
        mock_response.__getitem__ = lambda self, key: {
            "body": io.BytesIO(response_body),
        }.get(key)
        
        # Create mock boto3 client
        mock_boto3_client = MagicMock()
        # Make invoke_model return our mock response (wrapped in lambda for thread execution)
        def sync_invoke(**kwargs):
            return mock_response
        mock_boto3_client.invoke_model = sync_invoke
        
        # Patch boto3.client to return our mock client
        with patch("boto3.client", return_value=mock_boto3_client):
            response = await bedrock_client.complete(
                messages=[Message(role=MessageRole.USER, content="Hello")]
            )
            
            # Verify response was parsed correctly
            assert response.content == "Test response"
            assert response.usage["total_tokens"] == 15
            assert response.model == "amazon.nova-micro-v1:0"

    @pytest.mark.asyncio
    async def test_complete_bedrock_uses_to_thread(self, bedrock_client):
        """Test that _complete_bedrock offloads boto3 call to thread pool."""
        import json
        import io
        
        # Create mock response
        response_body = json.dumps({
            "output": {
                "message": {
                    "content": [{"text": "Test"}]
                }
            },
            "usage": {"inputTokens": 1, "outputTokens": 1, "totalTokens": 2},
            "stopReason": "end_turn",
        }).encode("utf-8")
        
        mock_response = MagicMock()
        mock_response.__getitem__ = lambda self, key: {
            "body": io.BytesIO(response_body),
        }.get(key)
        
        mock_boto3_client = MagicMock()
        mock_boto3_client.invoke_model = lambda **kwargs: mock_response
        
        # Track if asyncio.to_thread was used
        to_thread_called = False
        original_to_thread = asyncio.to_thread
        
        async def mock_to_thread(func, *args, **kwargs):
            nonlocal to_thread_called
            to_thread_called = True
            return func(*args, **kwargs)
        
        with patch("boto3.client", return_value=mock_boto3_client), \
             patch("asyncio.to_thread", mock_to_thread):
            await bedrock_client.complete(
                messages=[Message(role=MessageRole.USER, content="Hello")]
            )
        
        assert to_thread_called, "asyncio.to_thread should be used for boto3 call"

    @pytest.mark.asyncio
    async def test_stream_complete_bedrock_with_mocked_boto3(self, bedrock_client):
        """Test _stream_complete_bedrock with mocked boto3 client."""
        import json
        
        # Create mock streaming response
        chunk1 = json.dumps({"text": "Hello"}).encode("utf-8")
        chunk2 = json.dumps({"text": " world"}).encode("utf-8")
        
        mock_stream = iter([
            {"chunk": {"bytes": chunk1}},
            {"chunk": {"bytes": chunk2}},
        ])
        
        mock_response = MagicMock()
        mock_response.__getitem__ = lambda self, key: {
            "body": mock_stream,
        }.get(key)
        
        mock_boto3_client = MagicMock()
        
        def sync_stream(**kwargs):
            return mock_response
        mock_boto3_client.invoke_model_with_response_stream = sync_stream
        
        chunks = []
        with patch("boto3.client", return_value=mock_boto3_client), \
             patch("asyncio.to_thread", side_effect=lambda f, *a, **k: f(*a, **k)):
            async for chunk in bedrock_client.stream_complete(
                messages=[Message(role=MessageRole.USER, content="Hello")]
            ):
                chunks.append(chunk)
        
        assert len(chunks) >= 1
        # At least one chunk should have content
        assert any(c.content for c in chunks)

    @pytest.mark.asyncio
    async def test_complete_bedrock_auth_error(self, bedrock_client):
        """Test Bedrock authentication error handling."""
        from backend.ai.llm import AuthenticationError
        import sys
        
        # Use error message that matches the AccessDenied check
        def sync_call_that_fails(**kwargs):
            raise Exception("AccessDeniedException: User is not authorized to access this resource")
        
        mock_boto3_client = MagicMock()
        mock_boto3_client.invoke_model = sync_call_that_fails
        
        mock_boto3 = MagicMock()
        mock_boto3.client.return_value = mock_boto3_client
        
        # Remove boto3 from sys.modules to force re-import
        original_boto3 = sys.modules.get("boto3")
        try:
            if "boto3" in sys.modules:
                del sys.modules["boto3"]
            # Also remove any submodules
            for key in list(sys.modules.keys()):
                if key.startswith("boto3."):
                    del sys.modules[key]
            
            with patch.dict("sys.modules", {"boto3": mock_boto3}), \
                 patch("asyncio.to_thread", side_effect=lambda f, *a, **k: f(*a, **k)):
                with pytest.raises(AuthenticationError):
                    await bedrock_client.complete(
                        messages=[Message(role=MessageRole.USER, content="Hello")]
                    )
        finally:
            # Restore original boto3
            if original_boto3:
                sys.modules["boto3"] = original_boto3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
