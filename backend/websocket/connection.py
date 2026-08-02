"""WebSocket connection wrapper."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional
from fastapi import WebSocket
from starlette.websockets import WebSocketState


@dataclass
class WebSocketConnection:
    """
    Represents a single WebSocket connection.
    
    Stores connection state, metadata, and provides
    utility methods for connection management.
    """

    websocket: WebSocket
    user_id: str
    connection_id: str
    metadata: Dict = field(default_factory=dict)
    
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    last_message: datetime = field(default_factory=datetime.utcnow)
    
    current_room: Optional[str] = None
    is_authenticated: bool = False
    is_active: bool = True

    def update_heartbeat(self) -> None:
        """Update the last heartbeat timestamp."""
        self.last_heartbeat = datetime.utcnow()

    def update_last_message(self) -> None:
        """Update the last message timestamp."""
        self.last_message = datetime.utcnow()

    def set_room(self, room_id: Optional[str]) -> None:
        """Set the current room for this connection."""
        self.current_room = room_id

    def set_authenticated(self, authenticated: bool = True) -> None:
        """Mark the connection as authenticated."""
        self.is_authenticated = authenticated

    def deactivate(self) -> None:
        """Mark the connection as inactive."""
        self.is_active = False

    def get_idle_time(self) -> float:
        """
        Get the time since the last message in seconds.
        
        Returns:
            Seconds since last message
        """
        delta = datetime.utcnow() - self.last_message
        return delta.total_seconds()

    def get_heartbeat_age(self) -> float:
        """
        Get the time since the last heartbeat in seconds.
        
        Returns:
            Seconds since last heartbeat
        """
        delta = datetime.utcnow() - self.last_heartbeat
        return delta.total_seconds()

    def is_connected(self) -> bool:
        """
        Check if the WebSocket is still connected.
        
        Returns:
            True if connected
        """
        return (
            self.websocket.client_state == WebSocketState.CONNECTED
            and self.is_active
        )

    def get_metadata(self, key: str, default=None):
        """
        Get metadata value by key.
        
        Args:
            key: Metadata key
            default: Default value if not found
        
        Returns:
            Metadata value or default
        """
        return self.metadata.get(key, default)

    def set_metadata(self, key: str, value) -> None:
        """
        Set metadata value.
        
        Args:
            key: Metadata key
            value: Value to set
        """
        self.metadata[key] = value

    def get_session_duration(self) -> float:
        """
        Get the total session duration in seconds.
        
        Returns:
            Seconds since connection created
        """
        delta = datetime.utcnow() - self.created_at
        return delta.total_seconds()

    def to_dict(self) -> Dict:
        """
        Convert connection info to dictionary.
        
        Returns:
            Dictionary representation
        """
        return {
            "connection_id": self.connection_id,
            "user_id": self.user_id,
            "current_room": self.current_room,
            "is_authenticated": self.is_authenticated,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "last_message": self.last_message.isoformat(),
            "idle_seconds": self.get_idle_time(),
            "session_duration_seconds": self.get_session_duration(),
            "metadata": self.metadata,
        }
