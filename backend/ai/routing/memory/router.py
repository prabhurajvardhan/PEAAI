"""
Memory Router - Routes queries to memory and injects context.

Handles:
- Query analysis
- Context retrieval
- Memory injection
- Fallback handling
"""
import logging
import re
from typing import Any, Dict, List, Optional, Set

from ...event_dispatcher import EventDispatcher, Event, EventType, EventPriority
from .types import (
    MemoryQuery,
    MemoryQueryType,
    MemoryContext,
    MemoryInjectionResult,
    MemoryPriority,
)

logger = logging.getLogger(__name__)


class MemoryRouter:
    """
    Routes queries to memory and injects context into LLM requests.

    Features:
    - Query analysis to determine memory needs
    - Context retrieval from Memory Engine
    - Memory injection into LLM requests
    - Fallback handling for missing memories
    """

    # Keywords for query type detection
    QUERY_KEYWORDS: Dict[MemoryQueryType, List[str]] = {
        MemoryQueryType.USER_CONTEXT: ["me", "my", "i am", "i'm", "my name", "about me"],
        MemoryQueryType.CONVERSATION_HISTORY: ["before", "earlier", "previously", "last time", "yesterday"],
        MemoryQueryType.STORY_CONTEXT: ["story", "tell me", "remember when", "the time", "adventure"],
        MemoryQueryType.RELATIONSHIP_INFO: ["we", "us", "our", "together", "relationship", "friendship"],
        MemoryQueryType.PREFERENCES: ["like", "prefer", "favorite", "hate", "dislike", "enjoy"],
        MemoryQueryType.FACTS: ["fact", "know", "remember", "tell me about"],
        MemoryQueryType.GENERAL: [],
    }

    # System prompt templates for each query type
    SYSTEM_PROMPT_TEMPLATES: Dict[MemoryQueryType, str] = {
        MemoryQueryType.USER_CONTEXT: "You are talking with {name}. They are a {age} year old {occupation}. {relationship_info}",
        MemoryQueryType.CONVERSATION_HISTORY: "In your previous conversations: {history}",
        MemoryQueryType.STORY_CONTEXT: "Related stories from the past: {stories}",
        MemoryQueryType.RELATIONSHIP_INFO: "Your relationship: {relationship}",
        MemoryQueryType.PREFERENCES: "User preferences: {preferences}",
        MemoryQueryType.FACTS: "Facts about the user: {facts}",
        MemoryQueryType.GENERAL: "General context: {context}",
    }

    def __init__(
        self,
        dispatcher: Optional[EventDispatcher] = None,
        default_max_tokens: int = 2000,
    ):
        """
        Initialize the Memory Router.

        Args:
            dispatcher: Event dispatcher for memory events
            default_max_tokens: Default max tokens for context
        """
        self._dispatcher = dispatcher
        self._default_max_tokens = default_max_tokens
        self._memory_cache: Dict[str, Any] = {}
        self._fallback_templates: Dict[str, str] = {
            "no_memory": "You don't have specific memory of this yet.",
            "limited_memory": "You have limited memory of this topic. Ask the user for more details.",
            "user_info_missing": "You don't know much about the user yet. Be curious and ask questions.",
        }

    def analyze_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> MemoryQueryType:
        """
        Analyze a query to determine the type of memory needed.

        Args:
            query: User's input query
            context: Optional context about the conversation

        Returns:
            MemoryQueryType indicating what type of memory to retrieve
        """
        query_lower = query.lower()

        # Check for story keywords first (higher priority for engagement)
        story_keywords = self.QUERY_KEYWORDS[MemoryQueryType.STORY_CONTEXT]
        if any(kw in query_lower for kw in story_keywords):
            return MemoryQueryType.STORY_CONTEXT

        # Check for relationship keywords
        relationship_keywords = self.QUERY_KEYWORDS[MemoryQueryType.RELATIONSHIP_INFO]
        if any(kw in query_lower for kw in relationship_keywords):
            return MemoryQueryType.RELATIONSHIP_INFO

        # Check for preference keywords
        preference_keywords = self.QUERY_KEYWORDS[MemoryQueryType.PREFERENCES]
        if any(kw in query_lower for kw in preference_keywords):
            return MemoryQueryType.PREFERENCES

        # Check for user context keywords
        user_keywords = self.QUERY_KEYWORDS[MemoryQueryType.USER_CONTEXT]
        if any(kw in query_lower for kw in user_keywords):
            return MemoryQueryType.USER_CONTEXT

        # Check for conversation history keywords
        history_keywords = self.QUERY_KEYWORDS[MemoryQueryType.CONVERSATION_HISTORY]
        if any(kw in query_lower for kw in history_keywords):
            return MemoryQueryType.CONVERSATION_HISTORY

        # Check for fact keywords
        fact_keywords = self.QUERY_KEYWORDS[MemoryQueryType.FACTS]
        if any(kw in query_lower for kw in fact_keywords):
            return MemoryQueryType.FACTS

        return MemoryQueryType.GENERAL

    def _extract_memory_types(self, query_type: MemoryQueryType) -> List[str]:
        """Map query type to memory types to retrieve."""
        type_map = {
            MemoryQueryType.USER_CONTEXT: ["user_preference", "user_fact", "context"],
            MemoryQueryType.CONVERSATION_HISTORY: ["conversation", "context"],
            MemoryQueryType.STORY_CONTEXT: ["story", "conversation"],
            MemoryQueryType.RELATIONSHIP_INFO: ["relationship", "context"],
            MemoryQueryType.PREFERENCES: ["user_preference"],
            MemoryQueryType.FACTS: ["user_fact", "context"],
            MemoryQueryType.GENERAL: ["user_preference", "user_fact", "relationship", "context"],
        }
        return type_map.get(query_type, ["context"])

    async def retrieve_context(
        self,
        query: MemoryQuery,
    ) -> MemoryContext:
        """
        Retrieve memory context for a query.

        Args:
            query: Memory query with user and query details

        Returns:
            MemoryContext with retrieved memories
        """
        # Emit event for memory retrieval
        if self._dispatcher:
            await self._dispatcher.emit(
                EventType.MEMORY_QUERY.value,
                data=query,
                priority=EventPriority.NORMAL,
                source="memory_router",
            )

        # Build context from available sources
        context = MemoryContext(
            user_id=query.user_id,
            query_type=query.query_type,
            system_prompt="",
        )

        # Retrieve based on query type
        if query.query_type == MemoryQueryType.USER_CONTEXT:
            context.system_prompt = await self._build_user_context(query)
        elif query.query_type == MemoryQueryType.CONVERSATION_HISTORY:
            context.system_prompt = await self._build_conversation_context(query)
        elif query.query_type == MemoryQueryType.STORY_CONTEXT:
            context.system_prompt = await self._build_story_context(query)
        elif query.query_type == MemoryQueryType.RELATIONSHIP_INFO:
            context.system_prompt = await self._build_relationship_context(query)
        elif query.query_type == MemoryQueryType.PREFERENCES:
            context.system_prompt = await self._build_preferences_context(query)
        elif query.query_type == MemoryQueryType.FACTS:
            context.system_prompt = await self._build_facts_context(query)
        else:
            context.system_prompt = await self._build_general_context(query)

        # Emit retrieval complete event
        if self._dispatcher:
            await self._dispatcher.emit(
                EventType.MEMORY_RETRIEVED.value,
                data=context,
                priority=EventPriority.NORMAL,
                source="memory_router",
            )

        return context

    async def _build_user_context(self, query: MemoryQuery) -> str:
        """Build user context prompt."""
        # Placeholder - would integrate with Memory Engine
        user_info = self._fallback_templates["user_info_missing"]
        return f"User context: {user_info}"

    async def _build_conversation_context(self, query: MemoryQuery) -> str:
        """Build conversation history context."""
        if query.conversation_id:
            # Would retrieve from Memory Engine
            return f"Conversation history from session {query.conversation_id}: (no history available)"
        return self._fallback_templates["limited_memory"]

    async def _build_story_context(self, query: MemoryQuery) -> str:
        """Build story context prompt."""
        if query.story_id:
            return f"Story context for {query.story_id}: (no story context available)"
        return "No active story context. Consider starting a story if appropriate."

    async def _build_relationship_context(self, query: MemoryQuery) -> str:
        """Build relationship context prompt."""
        return "Relationship context: You have been talking with this user. Build rapport naturally."

    async def _build_preferences_context(self, query: MemoryQuery) -> str:
        """Build preferences context prompt."""
        return "User preferences: Pay attention to their likes and dislikes. Ask about preferences if uncertain."

    async def _build_facts_context(self, query: MemoryQuery) -> str:
        """Build facts context prompt."""
        return "Facts about the user: Remember what they've told you about themselves."

    async def _build_general_context(self, query: MemoryQuery) -> str:
        """Build general context prompt."""
        return "General context: Respond naturally based on the conversation."

    def inject_memory(
        self,
        messages: List[Dict[str, str]],
        context: MemoryContext,
    ) -> MemoryInjectionResult:
        """
        Inject memory context into LLM messages.

        Args:
            messages: Existing messages
            context: Retrieved memory context

        Returns:
            MemoryInjectionResult with updated messages
        """
        # Estimate tokens
        context_text = context.system_prompt + "\n".join(context.conversation_history)
        tokens_estimate = len(context_text) // 4

        # Truncate if needed
        max_chars = context.max_context_tokens * 4
        if tokens_estimate > context.max_context_tokens:
            context.system_prompt = context.system_prompt[:max_chars]
            tokens_estimate = context.max_context_tokens

        # Inject system prompt with memory
        injected_messages = []

        for i, msg in enumerate(messages):
            if msg.get("role") == "system":
                # Append memory context to existing system prompt
                existing_content = msg.get("content", "")
                new_content = f"{existing_content}\n\n## Memory Context\n{context.system_prompt}"
                injected_messages.append({"role": "system", "content": new_content})
            else:
                injected_messages.append(msg)

        # If no system message, add one
        if not any(m.get("role") == "system" for m in messages):
            injected_messages.insert(0, {
                "role": "system",
                "content": f"## Memory Context\n{context.system_prompt}"
            })

        return MemoryInjectionResult(
            context=context,
            messages=injected_messages,
            tokens_used=tokens_estimate,
            tokens_saved=0,
        )

    def get_fallback_response(self, query_type: MemoryQueryType) -> str:
        """
        Get fallback response when memory is unavailable.

        Args:
            query_type: Type of query that failed

        Returns:
            Fallback response text
        """
        fallback_map = {
            MemoryQueryType.USER_CONTEXT: self._fallback_templates["user_info_missing"],
            MemoryQueryType.CONVERSATION_HISTORY: self._fallback_templates["limited_memory"],
            MemoryQueryType.STORY_CONTEXT: "No story context available.",
            MemoryQueryType.RELATIONSHIP_INFO: "Continue building your relationship naturally.",
            MemoryQueryType.PREFERENCES: "Ask the user about their preferences.",
            MemoryQueryType.FACTS: self._fallback_templates["no_memory"],
            MemoryQueryType.GENERAL: "Respond naturally.",
        }
        return fallback_map.get(query_type, self._fallback_templates["no_memory"])

    async def store_memory(
        self,
        user_id: str,
        content: str,
        memory_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Store a new memory item.

        Args:
            user_id: User identifier
            content: Memory content
            memory_type: Type of memory
            metadata: Additional metadata

        Returns:
            True if stored successfully
        """
        if self._dispatcher:
            await self._dispatcher.emit(
                EventType.MEMORY_STORE.value,
                data={
                    "user_id": user_id,
                    "content": content,
                    "memory_type": memory_type,
                    "metadata": metadata or {},
                },
                priority=EventPriority.LOW,
                source="memory_router",
            )
        return True

    def clear_cache(self) -> None:
        """Clear the memory cache."""
        self._cache_size = 0
        self._memory_cache.clear()


# Global router instance
_memory_router: Optional[MemoryRouter] = None


def get_memory_router() -> MemoryRouter:
    """Get the global memory router instance."""
    global _memory_router
    if _memory_router is None:
        _memory_router = MemoryRouter()
    return _memory_router


def set_memory_router(router: MemoryRouter) -> None:
    """Set the global memory router instance."""
    global _memory_router
    _memory_router = router
