"""WebSocket connection manager for real-time communication."""
import asyncio
import json
import logging
from typing import Dict, List, Optional, Set
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.websocket.connection import WebSocketConnection
from backend.websocket.heartbeat import HeartbeatManager

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages all active WebSocket connections.
    
    Handles connection lifecycle, message routing, and broadcasting.
    """

    def __init__(self):
        """Initialize the WebSocket manager."""
        self._connections: Dict[str, WebSocketConnection] = {}
        self._user_connections: Dict[str, Set[str]] = {}
        self._room_members: Dict[str, Set[str]] = {}
        self._heartbeat_manager = HeartbeatManager(self)
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        user_id: str,
        connection_id: str,
        metadata: Optional[Dict] = None
    ) -> WebSocketConnection:
        """
        Accept and register a new WebSocket connection.
        
        Args:
            websocket: FastAPI WebSocket instance
            user_id: Authenticated user ID
            connection_id: Unique connection identifier
            metadata: Optional connection metadata
        
        Returns:
            WebSocketConnection instance
        """
        await websocket.accept()
        
        connection = WebSocketConnection(
            websocket=websocket,
            user_id=user_id,
            connection_id=connection_id,
            metadata=metadata or {}
        )
        
        async with self._lock:
            self._connections[connection_id] = connection
            
            if user_id not in self._user_connections:
                self._user_connections[user_id] = set()
            self._user_connections[user_id].add(connection_id)
        
        self._heartbeat_manager.start(connection_id)
        
        logger.info(f"WebSocket connected: user={user_id}, connection={connection_id}")
        
        return connection

    async def disconnect(self, connection_id: str) -> None:
        """
        Remove and clean up a WebSocket connection.
        
        Args:
            connection_id: Connection identifier to remove
        """
        connection = await self.get_connection(connection_id)
        if not connection:
            return
        
        user_id = connection.user_id
        
        self._heartbeat_manager.stop(connection_id)
        
        async with self._lock:
            if connection_id in self._connections:
                del self._connections[connection_id]
            
            if user_id in self._user_connections:
                self._user_connections[user_id].discard(connection_id)
                if not self._user_connections[user_id]:
                    del self._user_connections[user_id]
            
            for room_id in list(self._room_members.keys()):
                self._room_members[room_id].discard(connection_id)
                if not self._room_members[room_id]:
                    del self._room_members[room_id]
        
        logger.info(f"WebSocket disconnected: user={user_id}, connection={connection_id}")

    async def get_connection(self, connection_id: str) -> Optional[WebSocketConnection]:
        """
        Get a connection by ID.
        
        Args:
            connection_id: Connection identifier
        
        Returns:
            WebSocketConnection if found, None otherwise
        """
        async with self._lock:
            return self._connections.get(connection_id)

    async def get_user_connections(self, user_id: str) -> List[WebSocketConnection]:
        """
        Get all connections for a specific user.
        
        Args:
            user_id: User identifier
        
        Returns:
            List of user's connections
        """
        async with self._lock:
            connection_ids = self._user_connections.get(user_id, set())
            return [
                self._connections[cid]
                for cid in connection_ids
                if cid in self._connections
            ]

    async def get_user_connection_count(self, user_id: str) -> int:
        """
        Get the number of active connections for a user.
        
        Args:
            user_id: User identifier
        
        Returns:
            Number of active connections
        """
        async with self._lock:
            return len(self._user_connections.get(user_id, set()))

    async def send_to_connection(
        self,
        connection_id: str,
        message: Dict,
        message_type: str = "message"
    ) -> bool:
        """
        Send a message to a specific connection.
        
        Args:
            connection_id: Target connection ID
            message: Message data to send
            message_type: Type of message
        
        Returns:
            True if sent successfully, False otherwise
        """
        connection = await self.get_connection(connection_id)
        if not connection:
            return False
        
        try:
            payload = {
                "type": message_type,
                "data": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            await connection.websocket.send_json(payload)
            return True
        except Exception as e:
            logger.error(f"Failed to send to {connection_id}: {e}")
            return False

    async def send_to_user(
        self,
        user_id: str,
        message: Dict,
        message_type: str = "message",
        exclude_connection_id: Optional[str] = None
    ) -> int:
        """
        Send a message to all connections of a user.
        
        Args:
            user_id: Target user ID
            message: Message data to send
            message_type: Type of message
            exclude_connection_id: Optional connection to exclude
        
        Returns:
            Number of successful sends
        """
        connections = await self.get_user_connections(user_id)
        success_count = 0
        
        for conn in connections:
            if conn.connection_id != exclude_connection_id:
                if await self.send_to_connection(conn.connection_id, message, message_type):
                    success_count += 1
        
        return success_count

    async def broadcast(
        self,
        message: Dict,
        message_type: str = "broadcast",
        room_id: Optional[str] = None,
        exclude_user_id: Optional[str] = None
    ) -> int:
        """
        Broadcast a message to all connections or room members.
        
        Args:
            message: Message data to send
            message_type: Type of message
            room_id: Optional room to broadcast to
            exclude_user_id: Optional user to exclude
        
        Returns:
            Number of successful sends
        """
        async with self._lock:
            if room_id:
                target_ids = self._room_members.get(room_id, set())
                targets = [
                    self._connections[cid]
                    for cid in target_ids
                    if cid in self._connections
                ]
            else:
                targets = list(self._connections.values())
            
            if exclude_user_id:
                targets = [
                    t for t in targets
                    if t.user_id != exclude_user_id
                ]
        
        success_count = 0
        for conn in targets:
            if await self.send_to_connection(conn.connection_id, message, message_type):
                success_count += 1
        
        return success_count

    async def join_room(self, connection_id: str, room_id: str) -> bool:
        """
        Add a connection to a room.
        
        Args:
            connection_id: Connection to add
            room_id: Room to join
        
        Returns:
            True if successful
        """
        connection = await self.get_connection(connection_id)
        if not connection:
            return False
        
        async with self._lock:
            if room_id not in self._room_members:
                self._room_members[room_id] = set()
            self._room_members[room_id].add(connection_id)
        
        logger.info(f"Connection {connection_id} joined room {room_id}")
        return True

    async def leave_room(self, connection_id: str, room_id: str) -> bool:
        """
        Remove a connection from a room.
        
        Args:
            connection_id: Connection to remove
            room_id: Room to leave
        
        Returns:
            True if successful
        """
        connection = await self.get_connection(connection_id)
        if not connection:
            return False
        
        async with self._lock:
            if room_id in self._room_members:
                self._room_members[room_id].discard(connection_id)
                if not self._room_members[room_id]:
                    del self._room_members[room_id]
        
        logger.info(f"Connection {connection_id} left room {room_id}")
        return True

    async def get_room_members(self, room_id: str) -> List[str]:
        """
        Get all connection IDs in a room.
        
        Args:
            room_id: Room identifier
        
        Returns:
            List of connection IDs
        """
        async with self._lock:
            return list(self._room_members.get(room_id, set()))

    async def get_room_size(self, room_id: str) -> int:
        """
        Get the number of members in a room.
        
        Args:
            room_id: Room identifier
        
        Returns:
            Number of members
        """
        async with self._lock:
            return len(self._room_members.get(room_id, set()))

    def get_active_count(self) -> int:
        """Get the total number of active connections."""
        return len(self._connections)

    async def handle_reconnection(
        self,
        old_connection_id: str,
        new_websocket: WebSocket,
        user_id: str,
        metadata: Optional[Dict] = None
    ) -> Optional[WebSocketConnection]:
        """
        Handle reconnection with previous session state.
        
        Args:
            old_connection_id: Previous connection ID
            new_websocket: New WebSocket connection
            user_id: User identifier
            metadata: Optional connection metadata
        
        Returns:
            New WebSocketConnection if reconnection successful
        """
        old_connection = await self.get_connection(old_connection_id)
        
        await self.disconnect(old_connection_id)
        
        import uuid
        new_connection_id = str(uuid.uuid4())
        
        return await self.connect(new_websocket, user_id, new_connection_id, metadata)

    async def cleanup_stale_connections(self, max_age_seconds: int = 300) -> int:
        """
        Remove connections that haven't sent heartbeats.
        
        Args:
            max_age_seconds: Maximum age without heartbeat
        
        Returns:
            Number of cleaned up connections
        """
        stale_ids = self._heartbeat_manager.get_stale_connections(max_age_seconds)
        cleaned = 0
        
        for conn_id in stale_ids:
            await self.disconnect(conn_id)
            cleaned += 1
        
        return cleaned


ws_manager = WebSocketManager()
