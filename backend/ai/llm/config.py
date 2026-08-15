"""
LLM configuration and defaults.
"""
import os
from dataclasses import dataclass, field
from typing import Dict, Optional
from .types import LLMProvider


def _get_provider_from_env() -> LLMProvider:
    """Get LLM provider from environment variable."""
    provider_str = os.getenv("LLM_PROVIDER", "").lower()
    if provider_str == "anthropic":
        return LLMProvider.ANTHROPIC
    elif provider_str == "ollama":
        return LLMProvider.OLLAMA
    elif provider_str == "bedrock":
        return LLMProvider.BEDROCK
    return LLMProvider.OPENAI


@dataclass
class LLMConfig:
    """Configuration for LLM providers."""
    provider: LLMProvider = field(default_factory=_get_provider_from_env)
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: str = "gpt-4"
    default_temperature: float = 0.7
    default_max_tokens: int = 2048
    max_context_tokens: int = 8192
    timeout: int = 60
    retry_attempts: int = 3
    retry_delay: float = 1.0

    # Provider-specific settings
    openai_settings: Dict = field(default_factory=lambda: {
        "organization": None,
    })
    anthropic_settings: Dict = field(default_factory=lambda: {
        "version": "2023-06-01",
    })
    ollama_settings: Dict = field(default_factory=lambda: {
        "keep_alive": "5m",
    })
    bedrock_settings: Dict = field(default_factory=lambda: {
        "aws_region": "us-east-1",
        "bedrock_model_id": "amazon.nova-micro-v1:0",
    })

    def __post_init__(self):
        """Initialize configuration from environment variables if not set."""
        if self.api_key is None:
            self.api_key = os.getenv("LLM_API_KEY")

        if self.base_url is None:
            if self.provider == LLMProvider.OLLAMA:
                self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            elif self.provider == LLMProvider.ANTHROPIC:
                self.base_url = "https://api.anthropic.com"
            elif self.provider == LLMProvider.BEDROCK:
                # Bedrock uses AWS SDK, base_url not needed
                self.base_url = None
            else:
                self.base_url = "https://api.openai.com/v1"

        if self.provider == LLMProvider.OPENAI and self.openai_settings.get("organization") is None:
            self.openai_settings["organization"] = os.getenv("OPENAI_ORGANIZATION")

        if self.provider == LLMProvider.BEDROCK:
            if self.bedrock_settings.get("aws_region") is None:
                self.bedrock_settings["aws_region"] = os.getenv("AWS_REGION", "us-east-1")
            if self.bedrock_settings.get("bedrock_model_id") is None:
                self.bedrock_settings["bedrock_model_id"] = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-micro-v1:0")
            # Use the model from bedrock_settings as the primary model
            if self.model == "gpt-4":  # Only override if using default
                self.model = self.bedrock_settings["bedrock_model_id"]


# Default configuration
default_config = LLMConfig()
