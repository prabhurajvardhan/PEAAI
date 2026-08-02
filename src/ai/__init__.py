"""
M08 AI Engine - Main Orchestrator

Coordinates all AI subsystems including LLM, Memory, Story, and Expression routing.
"""
import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, AsyncGenerator

from .llm import (
    Message,
    MessageRole,
    LLMClient,
    LLMResponse,
    StreamChunk,
    get_llm_client,
    set_llm_client,
)
from .event_dispatcher import (
    EventDispatcher,
    EventType,
    EventPriority,
    get_dispatcher,
    set_dispatcher,
)
from .routing.memory import (
    MemoryRouter,
    MemoryQuery,
    MemoryQueryType,
    get_memory_router,
    set_memory_router,
)
from .routing.story import (
    StoryRouter,
    StoryQuery,
    StoryResponse,
    StoryState,
    get_story_router,
    set_story_router,
)
from .routing.expression import (
    ExpressionRouter,
    ExpressionQuery,
    ExpressionResponse,
    EmotionType,
    get_expression_router,
    set_expression_router,
)

logger = logging.getLogger(__name__)


@dataclass
class AIEngineConfig:
    """Configuration for AI Engine."""
    llm_client: Optional[LLMClient] = None
    dispatcher: Optional[EventDispatcher] = None
    memory_router: Optional[MemoryRouter] = None
    story_router: Optional[StoryRouter] = None
    expression_router: Optional[ExpressionRouter] = None

    # Behavior settings
    enable_story_mode: bool = True
    enable_expression_routing: bool = True
    enable_memory_injection: bool = True
    default_system_prompt: str = "You are PEAAI, a friendly AI companion with a pixel art face."
    max_conversation_turns: int = 50


@dataclass
class ConversationContext:
    """Context for a conversation."""
    user_id: str
    conversation_id: str
    message_history: List[Message] = field(default_factory=list)
    system_prompt: str = ""
    current_emotion: EmotionType = EmotionType.NEUTRAL
    is_story_mode: bool = False
    story_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class AIEngine:
    """
    Main AI Engine orchestrator.

    Coordinates:
    - LLM interactions
    - Memory routing and context injection
    - Story routing
    - Expression routing
    - Event dispatching
    """

    def __init__(self, config: Optional[AIEngineConfig] = None):
        """
        Initialize the AI Engine.

        Args:
            config: AI Engine configuration
        """
        self._config = config or AIEngineConfig()

        # Initialize or use provided components
        self._llm = self._config.llm_client or get_llm_client()
        self._dispatcher = self._config.dispatcher or get_dispatcher()
        self._memory_router = self._config.memory_router or get_memory_router()
        self._story_router = self._config.story_router or get_story_router()
        self._expression_router = self._config.expression_router or get_expression_router()

        # Conversation contexts
        self._contexts: Dict[str, ConversationContext] = {}

        # Set global instances
        set_llm_client(self._llm)
        set_dispatcher(self._dispatcher)
        set_memory_router(self._memory_router)
        set_story_router(self._story_router)
        set_expression_router(self._expression_router)

        # Register event handlers
        self._register_event_handlers()

    def _register_event_handlers(self) -> None:
        """Register internal event handlers."""
        self._dispatcher.register(
            EventType.USER_MESSAGE.value,
            self._on_user_message,
            EventPriority.HIGH,
        )
        self._dispatcher.register(
            EventType.STORY_DETECTED.value,
            self._on_story_detected,
            EventPriority.HIGH,
        )

    async def _on_user_message(self, event) -> None:
        """Handle user message event."""
        logger.debug(f"User message event: {event.data}")

    async def _on_story_detected(self, event) -> None:
        """Handle story detected event."""
        logger.debug(f"Story detected event: {event.data}")

    def get_context(self, user_id: str) -> ConversationContext:
        """
        Get or create conversation context for a user.

        Args:
            user_id: User identifier

        Returns:
            ConversationContext
        """
        if user_id not in self._contexts:
            import uuid
            self._contexts[user_id] = ConversationContext(
                user_id=user_id,
                conversation_id=str(uuid.uuid4()),
                system_prompt=self._config.default_system_prompt,
            )
        return self._contexts[user_id]

    async def process_message(
        self,
        user_id: str,
        message: str,
        stream: bool = False,
    ) -> LLMResponse:
        """
        Process a user message and return AI response.

        Args:
            user_id: User identifier
            message: User's message
            stream: Whether to stream the response

        Returns:
            LLMResponse with AI's response
        """
        context = self.get_context(user_id)

        # Emit user message event
        await self._dispatcher.emit(
            EventType.USER_MESSAGE.value,
            data={"user_id": user_id, "message": message},
            priority=EventPriority.NORMAL,
            source="ai_engine",
        )

        # Check for story routing
        if self._config.enable_story_mode:
            story_response = await self._route_story(user_id, message)
            if story_response.should_tell_story:
                context.is_story_mode = True
                context.story_id = story_response.story.story_id if story_response.story else None

        # Check for expression routing
        if self._config.enable_expression_routing:
            await self._route_expression(user_id, message)

        # Build messages with memory context
        messages = await self._build_messages(context, message)

        # Call LLM
        response = await self._llm.complete(
            messages=messages,
            system_prompt=context.system_prompt,
        )

        # Update context
        context.message_history.append(Message(role=MessageRole.USER, content=message))
        context.message_history.append(Message(role=MessageRole.ASSISTANT, content=response.content))

        # Trim history if too long
        if len(context.message_history) > self._config.max_conversation_turns * 2:
            context.message_history = context.message_history[-self._config.max_conversation_turns * 2:]

        # Emit AI response event
        await self._dispatcher.emit(
            EventType.AI_MESSAGE.value,
            data={"user_id": user_id, "response": response.content},
            priority=EventPriority.NORMAL,
            source="ai_engine",
        )

        return response

    async def stream_message(
        self,
        user_id: str,
        message: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a user message and yield response chunks.

        Args:
            user_id: User identifier
            message: User's message

        Yields:
            Response text chunks
        """
        context = self.get_context(user_id)

        # Emit stream start event
        await self._dispatcher.emit(
            EventType.AI_STREAM_START.value,
            data={"user_id": user_id},
            priority=EventPriority.NORMAL,
            source="ai_engine",
        )

        # Build messages
        messages = await self._build_messages(context, message)

        # Stream response
        full_response = ""
        async for chunk in self._llm.stream_complete(
            messages=messages,
            system_prompt=context.system_prompt,
        ):
            full_response += chunk.delta
            yield chunk.delta

            # Emit stream chunk event
            await self._dispatcher.emit(
                EventType.AI_STREAM_CHUNK.value,
                data={"user_id": user_id, "chunk": chunk.delta},
                priority=EventPriority.LOW,
                source="ai_engine",
            )

        # Update context
        context.message_history.append(Message(role=MessageRole.USER, content=message))
        context.message_history.append(Message(role=MessageRole.ASSISTANT, content=full_response))

        # Emit stream end event
        await self._dispatcher.emit(
            EventType.AI_STREAM_END.value,
            data={"user_id": user_id, "full_response": full_response},
            priority=EventPriority.NORMAL,
            source="ai_engine",
        )

    async def _build_messages(
        self,
        context: ConversationContext,
        user_message: str,
    ) -> List[Message]:
        """Build messages for LLM with memory context."""
        messages = []

        # Inject memory context
        if self._config.enable_memory_injection:
            memory_query = MemoryQuery(
                user_id=context.user_id,
                query_text=user_message,
                query_type=MemoryQueryType.GENERAL,
                conversation_id=context.conversation_id,
            )
            memory_context = await self._memory_router.retrieve_context(memory_query)

            # Add memory context as system message
            if memory_context.system_prompt:
                messages.append(Message(
                    role=MessageRole.SYSTEM,
                    content=f"## Memory Context\n{memory_context.system_prompt}"
                ))

        # Add conversation history
        messages.extend(context.message_history)

        # Add user message
        messages.append(Message(role=MessageRole.USER, content=user_message))

        return messages

    async def _route_story(self, user_id: str, message: str) -> StoryResponse:
        """Route story detection."""
        story_query = StoryQuery(
            user_id=user_id,
            message=message,
            allow_story_start=self._config.enable_story_mode,
        )
        return await self._story_router.route_story(story_query)

    async def _route_expression(self, user_id: str, message: str) -> ExpressionResponse:
        """Route expression detection."""
        context = self.get_context(user_id)

        expression_query = ExpressionQuery(
            text=message,
            context={"user_id": user_id},
            current_emotion=context.current_emotion,
        )
        response = await self._expression_router.route_expression(expression_query)

        if response.should_change_expression and response.command:
            context.current_emotion = response.command.emotion

        return response

    async def start_story(
        self,
        user_id: str,
        story_prompt: Optional[str] = None,
    ) -> StoryResponse:
        """
        Start a story for a user.

        Args:
            user_id: User identifier
            story_prompt: Optional story prompt

        Returns:
            StoryResponse
        """
        context = self.get_context(user_id)
        context.is_story_mode = True

        story_query = StoryQuery(
            user_id=user_id,
            message=story_prompt or "Tell me a story",
            allow_story_start=True,
        )

        response = await self._story_router.route_story(story_query)

        if response.story:
            context.story_id = response.story.story_id

        return response

    async def end_story(self, user_id: str) -> bool:
        """
        End the current story for a user.

        Args:
            user_id: User identifier

        Returns:
            True if story was ended
        """
        context = self.get_context(user_id)
        context.is_story_mode = False
        context.story_id = None

        return self._story_router.clear_story(user_id)

    def set_expression(self, user_id: str, emotion: EmotionType) -> None:
        """
        Set the expression for a user.

        Args:
            user_id: User identifier
            emotion: Emotion to set
        """
        context = self.get_context(user_id)
        context.current_emotion = emotion
        self._expression_router.set_current_emotion(emotion)

    async def clear_context(self, user_id: str) -> None:
        """
        Clear conversation context for a user.

        Args:
            user_id: User identifier
        """
        if user_id in self._contexts:
            del self._contexts[user_id]
        self._story_router.clear_story(user_id)
        self._expression_router.clear_queue()

    async def close(self) -> None:
        """Close the AI Engine and cleanup."""
        await self._llm.close()
        self._contexts.clear()


# Global engine instance
_ai_engine: Optional[AIEngine] = None


def get_ai_engine() -> AIEngine:
    """Get the global AI engine instance."""
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = AIEngine()
    return _ai_engine


def set_ai_engine(engine: AIEngine) -> None:
    """Set the global AI engine instance."""
    global _ai_engine
    _ai_engine = engine
