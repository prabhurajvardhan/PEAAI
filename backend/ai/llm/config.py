"""
LLM configuration and defaults.
"""
import os
from dataclasses import dataclass, field
from typing import Dict, Optional
from .types import LLMProvider


@dataclass
class LLMConfig:
    """Configuration for LLM providers."""
    provider: LLMProvider = LLMProvider.OPENAI
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

    def __post_init__(self):
        """Initialize configuration from environment variables if not set."""
        if self.api_key is None:
            self.api_key = os.getenv("LLM_API_KEY")

        if self.base_url is None:
            if self.provider == LLMProvider.OLLAMA:
                self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            elif self.provider == LLMProvider.ANTHROPIC:
                self.base_url = "https://api.anthropic.com"
            else:
                self.base_url = "https://api.openai.com/v1"

        if self.provider == LLMProvider.OPENAI and self.openai_settings.get("organization") is None:
            self.openai_settings["organization"] = os.getenv("OPENAI_ORGANIZATION")


# Default configuration
default_config = LLMConfig()
