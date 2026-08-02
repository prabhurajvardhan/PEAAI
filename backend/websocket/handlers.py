"""WebSocket message handlers for routing and processing."""
import asyncio
import json
import logging
from typing import Dict, Callable, Awaitable, Optional
from dataclasses import dataclass
from enum import Enum

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.websocket.connection import WebSocketConnection

logger = logging.getLogger(__name__)


class MessageType(str, Enum):
    """Standard WebSocket message types."""
    
    # Connection management
    AUTH = "auth"
    HEARTBEAT = "heartbeat"
    HEARTBEAT_ACK = "heartbeat_ack"
    
    # Chat messages
    CHAT_MESSAGE = "chat_message"
    TYPING_START = "typing_start"
    TYPING_STOP = "typing_stop"
    
    # Room management
    JOIN_ROOM = "join_room"
    LEAVE_ROOM = "leave_room"
    ROOM_JOINED = "room_joined"
    ROOM_LEFT = "room_left"
    
    # System
    ERROR = "error"
    INFO = "info"
    NOTIFICATION = "notification"
    
    # Generic
    MESSAGE = "message"
    BROADCAST = "broadcast"
    PING = "ping"
    PONG = "pong"


@dataclass
class Message:
    """Parsed WebSocket message."""
    
    type: str
    data: Dict
    connection_id: str
    user_id: str
    raw: Optional[Dict] = None

    @classmethod
    def from_json(cls, data: Dict, connection_id: str, user_id: str) -> "Message":
        """Create Message from JSON data."""
        return cls(
            type=data.get("type", MessageType.MESSAGE),
            data=data.get("data", {}),
            connection_id=connection_id,
            user_id=user_id,
            raw=data
        )


MessageHandler = Callable[[Message, WebSocketConnection], Awaitable[None]]


class MessageRouter:
    """
    Routes incoming WebSocket messages to appropriate handlers.
    
    Provides a registry for message type handlers and
    handles message parsing and routing.
    """

    def __init__(self):
        """Initialize the message router."""
        self._handlers: Dict[str, MessageHandler] = {}
        self._middleware: list[Callable[[Message], Awaitable[Message]]] = []

    def register(self, message_type: str) -> Callable[[MessageHandler], MessageHandler]:
        """
        Decorator to register a handler for a message type.
        
        Args:
            message_type: Type of message to handle
        
        Returns:
            Decorator function
        """
        def decorator(handler: MessageHandler) -> MessageHandler:
            self._handlers[message_type] = handler
            return handler
        return decorator

    def add_middleware(self, middleware: Callable[[Message], Awaitable[Message]]) -> None:
        """
        Add middleware to process messages before handling.
        
        Args:
            middleware: Async middleware function
        """
        self._middleware.append(middleware)

    async def route(
        self,
        data: Dict,
        connection: WebSocketConnection
    ) -> Optional[Dict]:
        """
        Route a message to its handler.
        
        Args:
            data: Raw message data
            connection: WebSocket connection
        
        Returns:
            Response data if any
        """
        message = Message.from_json(data, connection.connection_id, connection.user_id)
        
        for mw in self._middleware:
            try:
                message = await mw(message)
            except Exception as e:
                logger.error(f"Middleware error: {e}")
                return {"type": MessageType.ERROR, "data": {"message": "Processing error"}}
        
        handler = self._handlers.get(message.type)
        
        if not handler:
            logger.warning(f"No handler for message type: {message.type}")
            return {"type": MessageType.ERROR, "data": {"message": f"Unknown message type: {message.type}"}}
        
        try:
            await handler(message, connection)
            return None
        except Exception as e:
            logger.error(f"Handler error for {message.type}: {e}")
            return {"type": MessageType.ERROR, "data": {"message": str(e)}}

    def has_handler(self, message_type: str) -> bool:
        """Check if a handler exists for the message type."""
        return message_type in self._handlers


class MessageHandler:
    """
    Handles specific message types.
    
    Contains the business logic for different message types.
    """

    def __init__(self, ws_manager):
        """
        Initialize the message handler.
        
        Args:
            ws_manager: WebSocket manager instance
        """
        self.ws_manager = ws_manager
        self.router = MessageRouter()
        self._setup_handlers()

    def _setup_handlers(self) -> None:
        """Set up all message type handlers."""
        self.router.register(MessageType.AUTH)(self.handle_auth)
        self.router.register(MessageType.HEARTBEAT)(self.handle_heartbeat)
        self.router.register(MessageType.CHAT_MESSAGE)(self.handle_chat_message)
        self.router.register(MessageType.TYPING_START)(self.handle_typing_start)
        self.router.register(MessageType.TYPING_STOP)(self.handle_typing_stop)
        self.router.register(MessageType.JOIN_ROOM)(self.handle_join_room)
        self.router.register(MessageType.LEAVE_ROOM)(self.handle_leave_room)
        self.router.register(MessageType.PING)(self.handle_ping)

    async def handle_auth(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle authentication message.
        
        Args:
            message: Auth message
            connection: WebSocket connection
        """
        token = message.data.get("token")
        if not token:
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"message": "Token required"},
                MessageType.ERROR
            )
            return
        
        try:
            from backend.auth.jwt_handler import verify_token
            payload = verify_token(token, "access")
            user_id = payload.get("sub")
            
            if user_id:
                connection.set_authenticated(True)
                connection.set_metadata("authenticated_user_id", user_id)
                
                await self.ws_manager.send_to_connection(
                    connection.connection_id,
                    {"message": "Authenticated", "user_id": user_id},
                    MessageType.INFO
                )
            else:
                await self.ws_manager.send_to_connection(
                    connection.connection_id,
                    {"message": "Invalid token"},
                    MessageType.ERROR
                )
        except Exception as e:
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"message": f"Authentication failed: {str(e)}"},
                MessageType.ERROR
            )

    async def handle_heartbeat(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle heartbeat message.
        
        Args:
            message: Heartbeat message
            connection: WebSocket connection
        """
        connection.update_heartbeat()
        await self.ws_manager.send_to_connection(
            connection.connection_id,
            {},
            MessageType.HEARTBEAT_ACK
        )

    async def handle_chat_message(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle chat message.
        
        Args:
            message: Chat message
            connection: WebSocket connection
        """
        if not connection.is_authenticated:
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"message": "Not authenticated"},
                MessageType.ERROR
            )
            return
        
        content = message.data.get("content", "")
        room_id = message.data.get("room_id")
        
        broadcast_data = {
            "user_id": connection.user_id,
            "content": content,
            "timestamp": message.raw.get("timestamp") if message.raw else None,
        }
        
        if room_id:
            await self.ws_manager.broadcast(
                broadcast_data,
                MessageType.CHAT_MESSAGE,
                room_id=room_id,
                exclude_user_id=connection.user_id
            )
        else:
            await self.ws_manager.broadcast(
                broadcast_data,
                MessageType.CHAT_MESSAGE,
                exclude_user_id=connection.user_id
            )

    async def handle_typing_start(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle typing start notification.
        
        Args:
            message: Typing start message
            connection: WebSocket connection
        """
        room_id = message.data.get("room_id")
        broadcast_data = {"user_id": connection.user_id}
        
        if room_id:
            await self.ws_manager.broadcast(
                broadcast_data,
                MessageType.TYPING_START,
                room_id=room_id,
                exclude_user_id=connection.user_id
            )
        else:
            await self.ws_manager.broadcast(
                broadcast_data,
                MessageType.TYPING_START,
                exclude_user_id=connection.user_id
            )

    async def handle_typing_stop(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle typing stop notification.
        
        Args:
            message: Typing stop message
            connection: WebSocket connection
        """
        room_id = message.data.get("room_id")
        broadcast_data = {"user_id": connection.user_id}
        
        if room_id:
            await self.ws_manager.broadcast(
                broadcast_data,
                MessageType.TYPING_STOP,
                room_id=room_id,
                exclude_user_id=connection.user_id
            )
        else:
            await self.ws_manager.broadcast(
                broadcast_data,
                MessageType.TYPING_STOP,
                exclude_user_id=connection.user_id
            )

    async def handle_join_room(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle join room request.
        
        Args:
            message: Join room message
            connection: WebSocket connection
        """
        room_id = message.data.get("room_id")
        if not room_id:
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"message": "Room ID required"},
                MessageType.ERROR
            )
            return
        
        if connection.current_room:
            await self.ws_manager.leave_room(connection.connection_id, connection.current_room)
        
        success = await self.ws_manager.join_room(connection.connection_id, room_id)
        
        if success:
            connection.set_room(room_id)
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"room_id": room_id, "message": "Joined room"},
                MessageType.ROOM_JOINED
            )
            
            await self.ws_manager.broadcast(
                {"user_id": connection.user_id, "room_id": room_id},
                MessageType.ROOM_JOINED,
                room_id=room_id
            )
        else:
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"message": "Failed to join room"},
                MessageType.ERROR
            )

    async def handle_leave_room(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle leave room request.
        
        Args:
            message: Leave room message
            connection: WebSocket connection
        """
        room_id = connection.current_room
        if not room_id:
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"message": "Not in a room"},
                MessageType.ERROR
            )
            return
        
        success = await self.ws_manager.leave_room(connection.connection_id, room_id)
        
        if success:
            connection.set_room(None)
            await self.ws_manager.send_to_connection(
                connection.connection_id,
                {"room_id": room_id, "message": "Left room"},
                MessageType.ROOM_LEFT
            )
            
            await self.ws_manager.broadcast(
                {"user_id": connection.user_id, "room_id": room_id},
                MessageType.ROOM_LEFT,
                room_id=room_id
            )

    async def handle_ping(self, message: Message, connection: WebSocketConnection) -> None:
        """
        Handle ping message.
        
        Args:
            message: Ping message
            connection: WebSocket connection
        """
        connection.update_last_message()
        await self.ws_manager.send_to_connection(
            connection.connection_id,
            {},
            MessageType.PONG
        )

    async def process_message(
        self,
        data: Dict,
        connection: WebSocketConnection
    ) -> Optional[Dict]:
        """
        Process an incoming message.
        
        Args:
            data: Raw message data
            connection: WebSocket connection
        
        Returns:
            Response data if any
        """
        connection.update_last_message()
        return await self.router.route(data, connection)
