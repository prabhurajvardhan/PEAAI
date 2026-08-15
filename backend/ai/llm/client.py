"""
LLM client for interacting with language model APIs.
"""
import asyncio
import json
import logging
import time
from typing import AsyncGenerator, Callable, List, Optional, Dict, Any
from dataclasses import dataclass, field

import httpx

from .types import (
    Message, MessageRole, LLMRequest, LLMResponse, StreamChunk,
    TokenUsage, LLMProvider
)
from .config import LLMConfig, default_config

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Base exception for LLM errors."""
    pass


class RateLimitError(LLMError):
    """Rate limit exceeded."""
    pass


class AuthenticationError(LLMError):
    """Authentication failed."""
    pass


class InvalidRequestError(LLMError):
    """Invalid request parameters."""
    pass


class TokenLimitError(LLMError):
    """Token limit exceeded."""
    pass


@dataclass
class TokenManager:
    """
    Manages token usage and context window.
    """
    max_context_tokens: int = 8192
    max_response_tokens: int = 2048
    current_usage: TokenUsage = field(default_factory=TokenUsage)
    token_counts: Dict[str, int] = field(default_factory=lambda: {
        "system": 50,
        "user": 4,
        "assistant": 4,
    })

    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text.
        Uses simple approximation: ~4 chars per token.
        """
        return len(text) // 4

    def count_message_tokens(self, message: Message) -> int:
        """Count tokens for a single message."""
        role_tokens = self.token_counts.get(message.role.value, 4)
        content_tokens = self.estimate_tokens(message.content)
        return role_tokens + content_tokens + 3  # overhead

    def count_messages_tokens(self, messages: List[Message]) -> int:
        """Count tokens for all messages."""
        return sum(self.count_message_tokens(m) for m in messages)

    def get_available_context(self) -> int:
        """Get available context for new input."""
        return self.max_context_tokens - self.current_usage.prompt_tokens

    def truncate_messages(
        self,
        messages: List[Message],
        max_tokens: Optional[int] = None
    ) -> List[Message]:
        """
        Truncate messages to fit within token limit.
        Keeps the most recent messages.
        """
        max_toks = max_tokens or (self.max_context_tokens - self.max_response_tokens)

        if self.count_messages_tokens(messages) <= max_toks:
            return messages

        # Keep system message and truncate history
        result = []
        system_msg = None
        other_messages = []

        for msg in messages:
            if msg.role == MessageRole.SYSTEM:
                system_msg = msg
            else:
                other_messages.append(msg)

        for msg in reversed(other_messages):
            if self.count_messages_tokens(result) + self.count_message_tokens(msg) <= max_toks:
                result.insert(0, msg)
            else:
                break

        if system_msg:
            result.insert(0, system_msg)

        return result

    def update_usage(self, prompt_tokens: int, completion_tokens: int) -> None:
        """Update token usage tracking."""
        self.current_usage.prompt_tokens = prompt_tokens
        self.current_usage.completion_tokens = completion_tokens
        self.current_usage.total_tokens = prompt_tokens + completion_tokens

    def reset_usage(self) -> None:
        """Reset token usage."""
        self.current_usage = TokenUsage()


class RequestFormatter:
    """
    Formats requests for different LLM providers.
    """

    def format_openai(self, request: LLMRequest) -> Dict[str, Any]:
        """Format request for OpenAI API."""
        return {
            "model": request.model,
            "messages": [
                {"role": m.role.value, "content": m.content}
                for m in request.messages
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens or default_config.default_max_tokens,
            "top_p": request.top_p,
            "stop": request.stop,
            "stream": request.stream,
        }

    def format_anthropic(self, request: LLMRequest) -> Dict[str, Any]:
        """Format request for Anthropic API."""
        # Find system message
        system_content = ""
        filtered_messages = []

        for msg in request.messages:
            if msg.role == MessageRole.SYSTEM:
                system_content += msg.content + "\n"
            else:
                filtered_messages.append(msg)

        return {
            "model": request.model,
            "messages": [
                {"role": m.role.value, "content": m.content}
                for m in filtered_messages
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens or default_config.default_max_tokens,
            "top_p": request.top_p,
            "system": system_content.strip(),
        }

    def format_ollama(self, request: LLMRequest) -> Dict[str, Any]:
        """Format request for Ollama API."""
        # Combine messages into a single prompt
        prompt_parts = []
        for msg in request.messages:
            if msg.role == MessageRole.SYSTEM:
                prompt_parts.append(f"System: {msg.content}")
            elif msg.role == MessageRole.USER:
                prompt_parts.append(f"User: {msg.content}")
            else:
                prompt_parts.append(f"Assistant: {msg.content}")

        return {
            "model": request.model,
            "prompt": "\n\n".join(prompt_parts),
            "temperature": request.temperature,
            "options": {
                "num_predict": request.max_tokens or default_config.default_max_tokens,
                "top_p": request.top_p,
                "stop": request.stop,
            },
            "stream": request.stream,
        }

    def format_bedrock(self, request: LLMRequest) -> Dict[str, Any]:
        """
        Format request for Amazon Bedrock API (Nova models).
        
        Nova models use standard messages format with a system prompt field.
        """
        # Separate system message from conversation messages
        system_content = ""
        conversation_messages = []
        
        for msg in request.messages:
            if msg.role == MessageRole.SYSTEM:
                system_content = msg.content
            else:
                # Map roles to Nova format (user/model, not user/assistant)
                role = "user" if msg.role == MessageRole.USER else "model"
                conversation_messages.append({
                    "role": role,
                    "content": [{"text": msg.content}]
                })
        
        # Build request with Nova message format
        payload = {
            "messages": conversation_messages,
            "inferenceConfig": {
                "temperature": request.temperature,
                "maxTokens": request.max_tokens or default_config.default_max_tokens,
            },
        }
        
        # Add system field if present
        if system_content:
            payload["system"] = [{"text": system_content}]
        
        return payload


class ResponseParser:
    """
    Parses responses from different LLM providers.
    """

    def parse_openai(self, response: Dict[str, Any]) -> LLMResponse:
        """Parse OpenAI API response."""
        content = response["choices"][0]["message"]["content"]
        usage = response.get("usage", {})

        return LLMResponse(
            content=content,
            model=response["model"],
            usage={
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
            finish_reason=response["choices"][0].get("finish_reason", "stop"),
            raw_response=response,
        )

    def parse_anthropic(self, response: Dict[str, Any]) -> LLMResponse:
        """Parse Anthropic API response."""
        content = response["content"][0]["text"]
        usage = response.get("usage", {})

        return LLMResponse(
            content=content,
            model=response["model"],
            usage={
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            },
            finish_reason="stop" if response.get("stop_reason") == "end_turn" else response.get("stop_reason", "stop"),
            raw_response=response,
        )

    def parse_ollama(self, response: Dict[str, Any]) -> LLMResponse:
        """Parse Ollama API response."""
        content = response.get("response", "")
        metrics = response.get("metrics", {})

        return LLMResponse(
            content=content,
            model=response["model"],
            usage={
                "prompt_tokens": metrics.get("prompt_eval_count", 0),
                "completion_tokens": metrics.get("eval_count", 0),
                "total_tokens": metrics.get("prompt_eval_count", 0) + metrics.get("eval_count", 0),
            },
            finish_reason="stop" if not response.get("done", False) else "stop",
            raw_response=response,
        )

    def parse_bedrock(self, response: Dict[str, Any], model: str) -> LLMResponse:
        """Parse Amazon Bedrock API response (Nova models)."""
        # Extract content from Nova response
        content = ""
        usage_data = {}
        
        if "output" in response and "message" in response["output"]:
            content = response["output"]["message"]["content"][0].get("text", "")
        
        # Extract usage information
        if "usage" in response:
            usage_data = {
                "prompt_tokens": response["usage"].get("inputTokens", 0),
                "completion_tokens": response["usage"].get("outputTokens", 0),
                "total_tokens": response["usage"].get("totalTokens", 0),
            }
        else:
            usage_data = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            }

        # Extract finish reason
        finish_reason = "stop"
        if "stopReason" in response:
            if response["stopReason"] == "end_turn":
                finish_reason = "stop"
            else:
                finish_reason = response["stopReason"]

        return LLMResponse(
            content=content,
            model=model,
            usage=usage_data,
            finish_reason=finish_reason,
            raw_response=response,
        )

    def parse_stream_openai(self, chunk: Dict[str, Any]) -> Optional[StreamChunk]:
        """Parse OpenAI streaming chunk."""
        delta = chunk.get("choices", [{}])[0].get("delta", {})

        if not delta:
            return None

        return StreamChunk(
            content=delta.get("content", ""),
            delta=delta.get("content", ""),
            index=chunk.get("choices", [{}])[0].get("index", 0),
            finish_reason=chunk.get("choices", [{}])[0].get("finish_reason"),
        )

    def parse_stream_bedrock(self, chunk: Dict[str, Any]) -> Optional[StreamChunk]:
        """Parse Amazon Bedrock streaming chunk (Nova models)."""
        content = ""
        finish_reason = None
        index = 0

        if "chunk" in chunk:
            inner = chunk["chunk"].get("bytes", b"")
            try:
                inner_data = json.loads(inner.decode("utf-8"))
                if "text" in inner_data:
                    content = inner_data["text"]
                if "annotations" in inner_data:
                    finish_reason = "stop"
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass

        if "stopReason" in chunk:
            finish_reason = chunk["stopReason"]

        if not content and finish_reason is None:
            return None

        return StreamChunk(
            content=content,
            delta=content,
            index=index,
            finish_reason=finish_reason,
        )


class LLMClient:
    """
    Main LLM client with request formatting, response parsing, error handling, and token management.
    """

    def __init__(self, config: Optional[LLMConfig] = None):
        """
        Initialize the LLM client.

        Args:
            config: LLM configuration. Uses default if not provided.
        """
        self.config = config or default_config
        self.token_manager = TokenManager(
            max_context_tokens=self.config.max_context_tokens
        )
        self.formatter = RequestFormatter()
        self.parser = ResponseParser()
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.config.base_url,
                timeout=self.config.timeout,
                headers=self._get_headers(),
            )
        return self._client

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests."""
        headers = {"Content-Type": "application/json"}

        if self.config.provider == LLMProvider.OPENAI:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
            if self.config.openai_settings.get("organization"):
                headers["OpenAI-Organization"] = self.config.openai_settings["organization"]
        elif self.config.provider == LLMProvider.ANTHROPIC:
            headers["x-api-key"] = self.config.api_key
            headers["anthropic-version"] = self.config.anthropic_settings.get("version", "2023-06-01")
        elif self.config.provider == LLMProvider.OLLAMA:
            headers["Content-Type"] = "application/json"
        # Note: BEDROCK uses boto3, not HTTP headers

        return headers

    def _get_endpoint(self) -> str:
        """Get API endpoint for current provider."""
        if self.config.provider == LLMProvider.OPENAI:
            return "/chat/completions"
        elif self.config.provider == LLMProvider.ANTHROPIC:
            return "/v1/messages"
        elif self.config.provider == LLMProvider.OLLAMA:
            return "/api/generate"
        # Note: BEDROCK uses boto3, not REST endpoint
        return "/chat/completions"

    def _format_request(self, request: LLMRequest) -> Dict[str, Any]:
        """Format request for current provider."""
        if self.config.provider == LLMProvider.OPENAI:
            return self.formatter.format_openai(request)
        elif self.config.provider == LLMProvider.ANTHROPIC:
            return self.formatter.format_anthropic(request)
        elif self.config.provider == LLMProvider.OLLAMA:
            return self.formatter.format_ollama(request)
        elif self.config.provider == LLMProvider.BEDROCK:
            return self.formatter.format_bedrock(request)
        return self.formatter.format_openai(request)

    def _parse_response(self, response: Dict[str, Any]) -> LLMResponse:
        """Parse response for current provider."""
        if self.config.provider == LLMProvider.OPENAI:
            return self.parser.parse_openai(response)
        elif self.config.provider == LLMProvider.ANTHROPIC:
            return self.parser.parse_anthropic(response)
        elif self.config.provider == LLMProvider.OLLAMA:
            return self.parser.parse_ollama(response)
        elif self.config.provider == LLMProvider.BEDROCK:
            return self.parser.parse_bedrock(response, self.config.model)
        return self.parser.parse_openai(response)

    def _handle_error(self, status_code: int, response_text: str) -> None:
        """Handle API errors based on status code."""
        if status_code == 401:
            raise AuthenticationError("Invalid API key")
        elif status_code == 429:
            raise RateLimitError(f"Rate limit exceeded: {response_text}")
        elif status_code == 400:
            raise InvalidRequestError(f"Invalid request: {response_text}")
        elif status_code == 413:
            raise TokenLimitError("Request too long: token limit exceeded")
        else:
            raise LLMError(f"API error ({status_code}): {response_text}")

    async def complete(
        self,
        messages: List[Message],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        """
        Send a completion request to the LLM.

        Args:
            messages: List of conversation messages
            model: Model to use (defaults to config)
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            system_prompt: Optional system prompt to prepend

        Returns:
            LLMResponse with the model's response

        Raises:
            LLMError: On API errors
            RateLimitError: On rate limit
            AuthenticationError: On auth failure
            TokenLimitError: On token limit
        """
        # Handle Bedrock separately since it uses boto3
        if self.config.provider == LLMProvider.BEDROCK:
            return await self._complete_bedrock(
                messages, model, temperature, max_tokens, system_prompt
            )

        # Add system prompt if provided
        if system_prompt:
            messages = [Message(role=MessageRole.SYSTEM, content=system_prompt)] + messages

        # Truncate messages if needed
        messages = self.token_manager.truncate_messages(messages)

        request = LLMRequest(
            messages=messages,
            model=model or self.config.model,
            temperature=temperature if temperature is not None else self.config.default_temperature,
            max_tokens=max_tokens or self.config.default_max_tokens,
        )

        formatted = self._format_request(request)
        endpoint = self._get_endpoint()

        client = await self._get_client()
        last_error = None

        for attempt in range(self.config.retry_attempts):
            try:
                response = await client.post(endpoint, json=formatted)
                response_text = response.text

                if response.status_code != 200:
                    self._handle_error(response.status_code, response_text)

                data = response.json()
                llm_response = self._parse_response(data)

                # Update token usage
                self.token_manager.update_usage(
                    llm_response.usage["prompt_tokens"],
                    llm_response.usage["completion_tokens"]
                )

                return llm_response

            except httpx.HTTPError as e:
                last_error = e
                logger.warning(f"Request failed (attempt {attempt + 1}): {e}")

                if attempt < self.config.retry_attempts - 1:
                    await asyncio.sleep(self.config.retry_delay * (2 ** attempt))

        raise LLMError(f"Request failed after {self.config.retry_attempts} attempts: {last_error}")

    async def _complete_bedrock(
        self,
        messages: List[Message],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        """
        Send a completion request to Amazon Bedrock using boto3.
        
        Args:
            messages: List of conversation messages
            model: Model to use (defaults to config)
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            system_prompt: Optional system prompt to prepend

        Returns:
            LLMResponse with the model's response
        """
        # Import boto3 here to avoid hard dependency when not using Bedrock
        try:
            import boto3
        except ImportError:
            raise LLMError("boto3 is required for Bedrock. Install with: pip install boto3")

        # Add system prompt if provided
        if system_prompt:
            messages = [Message(role=MessageRole.SYSTEM, content=system_prompt)] + messages

        # Truncate messages if needed
        messages = self.token_manager.truncate_messages(messages)

        # Use provided model or config
        bedrock_model = model or self.config.bedrock_settings.get("bedrock_model_id", "amazon.nova-micro-v1:0")
        aws_region = self.config.bedrock_settings.get("aws_region", "us-east-1")

        # Create request
        request = LLMRequest(
            messages=messages,
            model=bedrock_model,
            temperature=temperature if temperature is not None else self.config.default_temperature,
            max_tokens=max_tokens or self.config.default_max_tokens,
        )

        formatted = self._format_request(request)

        # Create Bedrock runtime client
        try:
            bedrock_client = boto3.client(
                service_name="bedrock-runtime",
                region_name=aws_region
            )
        except Exception as e:
            raise AuthenticationError(f"Failed to create Bedrock client: {e}")

        # Invoke model - offload blocking boto3 call to thread pool
        def _sync_invoke():
            return bedrock_client.invoke_model(
                modelId=bedrock_model,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(formatted)
            )

        try:
            response = await asyncio.to_thread(_sync_invoke)
        except Exception as e:
            error_msg = str(e)
            if "AccessDenied" in error_msg or "UnauthorizedException" in error_msg:
                raise AuthenticationError(f"Bedrock access denied: {error_msg}")
            elif "ThrottlingException" in error_msg or "ProvisionedThroughputExceededException" in error_msg:
                raise RateLimitError(f"Bedrock rate limit exceeded: {error_msg}")
            elif "ValidationException" in error_msg:
                raise InvalidRequestError(f"Bedrock validation error: {error_msg}")
            else:
                raise LLMError(f"Bedrock API error: {error_msg}")

        # Parse response
        response_body = json.loads(response["body"].read().decode("utf-8"))
        llm_response = self.parser.parse_bedrock(response_body, bedrock_model)

        # Update token usage
        self.token_manager.update_usage(
            llm_response.usage["prompt_tokens"],
            llm_response.usage["completion_tokens"]
        )

        return llm_response

    async def stream_complete(
        self,
        messages: List[Message],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Stream a completion from the LLM.

        Args:
            messages: List of conversation messages
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            system_prompt: Optional system prompt

        Yields:
            StreamChunk with partial responses
        """
        # Handle Bedrock separately since it uses boto3 streaming
        if self.config.provider == LLMProvider.BEDROCK:
            async for chunk in self._stream_complete_bedrock(
                messages, model, temperature, max_tokens, system_prompt
            ):
                yield chunk
            return

        if system_prompt:
            messages = [Message(role=MessageRole.SYSTEM, content=system_prompt)] + messages

        messages = self.token_manager.truncate_messages(messages)

        request = LLMRequest(
            messages=messages,
            model=model or self.config.model,
            temperature=temperature if temperature is not None else self.config.default_temperature,
            max_tokens=max_tokens or self.config.default_max_tokens,
            stream=True,
        )

        formatted = self._format_request(request)
        endpoint = self._get_endpoint()

        client = await self._get_client()

        async with client.stream("POST", endpoint, json=formatted) as response:
            if response.status_code != 200:
                text = await response.aread()
                self._handle_error(response.status_code, text.decode())

            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                try:
                    import json
                    chunk_data = json.loads(line)

                    if self.config.provider == LLMProvider.OPENAI:
                        chunk = self.parser.parse_stream_openai(chunk_data)
                    else:
                        # For other providers, create a simple chunk
                        content = chunk_data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        chunk = StreamChunk(
                            content=content,
                            delta=content,
                            index=chunk_data.get("choices", [{}])[0].get("index", 0),
                        )

                    if chunk:
                        yield chunk

                except json.JSONDecodeError:
                    continue

    async def _stream_complete_bedrock(
        self,
        messages: List[Message],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Stream a completion from Amazon Bedrock using boto3.
        
        Args:
            messages: List of conversation messages
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            system_prompt: Optional system prompt

        Yields:
            StreamChunk with partial responses
        """
        # Import boto3 here to avoid hard dependency when not using Bedrock
        try:
            import boto3
        except ImportError:
            raise LLMError("boto3 is required for Bedrock streaming. Install with: pip install boto3")

        # Add system prompt if provided
        if system_prompt:
            messages = [Message(role=MessageRole.SYSTEM, content=system_prompt)] + messages

        # Truncate messages if needed
        messages = self.token_manager.truncate_messages(messages)

        # Use provided model or config
        bedrock_model = model or self.config.bedrock_settings.get("bedrock_model_id", "amazon.nova-micro-v1:0")
        aws_region = self.config.bedrock_settings.get("aws_region", "us-east-1")

        # Create request
        request = LLMRequest(
            messages=messages,
            model=bedrock_model,
            temperature=temperature if temperature is not None else self.config.default_temperature,
            max_tokens=max_tokens or self.config.default_max_tokens,
        )

        formatted = self._format_request(request)

        # Create Bedrock runtime client
        try:
            bedrock_client = boto3.client(
                service_name="bedrock-runtime",
                region_name=aws_region
            )
        except Exception as e:
            raise AuthenticationError(f"Failed to create Bedrock client: {e}")

        # Invoke model with streaming - offload blocking call to thread pool
        def _sync_stream():
            return bedrock_client.invoke_model_with_response_stream(
                modelId=bedrock_model,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(formatted)
            )

        try:
            response = await asyncio.to_thread(_sync_stream)
        except Exception as e:
            error_msg = str(e)
            if "AccessDenied" in error_msg or "UnauthorizedException" in error_msg:
                raise AuthenticationError(f"Bedrock access denied: {error_msg}")
            elif "ThrottlingException" in error_msg or "ProvisionedThroughputExceededException" in error_msg:
                raise RateLimitError(f"Bedrock rate limit exceeded: {error_msg}")
            else:
                raise LLMError(f"Bedrock streaming error: {error_msg}")

        # Process streaming response - iterate chunks
        # Note: The response body iterator itself is synchronous; yield each chunk
        # as it arrives to allow other coroutines to run between chunks
        for event in response["body"]:
            chunk_data = event
            chunk = self.parser.parse_stream_bedrock(chunk_data)
            if chunk:
                # Yield control to event loop between chunks
                yield chunk
                await asyncio.sleep(0)

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None


# Global client instance
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get the global LLM client instance."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client


def set_llm_client(client: LLMClient) -> None:
    """Set the global LLM client instance."""
    global _llm_client
    _llm_client = client
