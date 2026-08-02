"""Session data models."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional, Any
from enum import Enum


class SessionStatus(str, Enum):
    """Session status values."""
    
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    INVALID = "invalid"


@dataclass
class SessionData:
    """Session data container."""
    
    session_id: str
    user_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=datetime.utcnow)
    status: SessionStatus = SessionStatus.ACTIVE
    
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    
    data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_valid(self) -> bool:
        """Check if session is still valid."""
        return (
            self.status == SessionStatus.ACTIVE
            and datetime.utcnow() < self.expires_at
        )

    def is_expired(self) -> bool:
        """Check if session has expired."""
        return datetime.utcnow() >= self.expires_at

    def update_access(self) -> None:
        """Update last accessed timestamp."""
        self.last_accessed = datetime.utcnow()

    def revoke(self) -> None:
        """Revoke this session."""
        self.status = SessionStatus.REVOKED

    def get(self, key: str, default: Any = None) -> Any:
        """Get session data value."""
        return self.data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """Set session data value."""
        self.data[key] = value

    def delete(self, key: str) -> None:
        """Delete session data value."""
        self.data.pop(key, None)

    def clear_data(self) -> None:
        """Clear all session data."""
        self.data.clear()

    def to_dict(self) -> Dict:
        """Convert session to dictionary."""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "status": self.status.value,
            "user_agent": self.user_agent,
            "ip_address": self.ip_address,
            "data": self.data,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "SessionData":
        """Create session from dictionary."""
        return cls(
            session_id=data["session_id"],
            user_id=data["user_id"],
            created_at=datetime.fromisoformat(data["created_at"]),
            last_accessed=datetime.fromisoformat(data["last_accessed"]),
            expires_at=datetime.fromisoformat(data["expires_at"]),
            status=SessionStatus(data.get("status", "active")),
            user_agent=data.get("user_agent"),
            ip_address=data.get("ip_address"),
            data=data.get("data", {}),
            metadata=data.get("metadata", {}),
        )


@dataclass
class Session:
    """
    Session object for backward compatibility.
    
    Wraps SessionData with additional methods.
    """
    
    session_id: str
    user_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=datetime.utcnow)
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    _data: Dict[str, Any] = field(default_factory=dict)
    _status: SessionStatus = SessionStatus.ACTIVE

    @classmethod
    def create(
        cls,
        session_id: str,
        user_id: str,
        expires_at: datetime,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> "Session":
        """Create a new session."""
        return cls(
            session_id=session_id,
            user_id=user_id,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )

    @property
    def is_active(self) -> bool:
        """Check if session is active."""
        return self._status == SessionStatus.ACTIVE

    @property
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() >= self.expires_at

    @property
    def data(self) -> Dict[str, Any]:
        """Get session data."""
        return self._data

    def get_data(self, key: str, default: Any = None) -> Any:
        """Get data value."""
        return self._data.get(key, default)

    def set_data(self, key: str, value: Any) -> None:
        """Set data value."""
        self._data[key] = value

    def touch(self) -> None:
        """Update last accessed time."""
        self.last_accessed = datetime.utcnow()

    def revoke(self) -> None:
        """Revoke the session."""
        self._status = SessionStatus.REVOKED

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "status": self._status.value,
            "user_agent": self.user_agent,
            "ip_address": self.ip_address,
            "data": self._data,
        }
