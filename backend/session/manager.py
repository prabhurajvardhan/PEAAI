"""Session management with concurrent session handling."""
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.session.models import SessionData, SessionStatus
from backend.session.store import SessionStore, InMemorySessionStore

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Manages user sessions with support for concurrent sessions.
    
    Handles session creation, validation, expiry, and concurrent
    session limits.
    """

    def __init__(
        self,
        store: Optional[SessionStore] = None,
        max_concurrent_sessions: int = 5,
        session_ttl_hours: int = 24,
    ):
        """
        Initialize the session manager.
        
        Args:
            store: Session storage backend
            max_concurrent_sessions: Maximum sessions per user
            session_ttl_hours: Default session TTL in hours
        """
        self.store = store or InMemorySessionStore()
        self.max_concurrent_sessions = max_concurrent_sessions
        self.session_ttl_hours = session_ttl_hours

    def generate_session_id(self) -> str:
        """
        Generate a unique session ID.
        
        Returns:
            UUID-based session identifier
        """
        return str(uuid.uuid4())

    async def create_session(
        self,
        user_id: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        ttl_hours: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SessionData:
        """
        Create a new session for a user.
        
        If the user has reached the maximum concurrent sessions,
        the oldest session will be revoked.
        
        Args:
            user_id: User identifier
            user_agent: Browser/client user agent
            ip_address: Client IP address
            ttl_hours: Session TTL in hours (default: session_ttl_hours)
            metadata: Optional session metadata
        
        Returns:
            New SessionData instance
        """
        existing_sessions = await self.store.get_user_sessions(user_id)
        
        if len(existing_sessions) >= self.max_concurrent_sessions:
            existing_sessions.sort(key=lambda s: s.last_accessed)
            
            oldest = existing_sessions[0]
            await self.revoke_session(oldest.session_id)
            logger.info(f"Revoked oldest session {oldest.session_id} for user {user_id}")

        session_id = self.generate_session_id()
        ttl = ttl_hours or self.session_ttl_hours
        expires_at = datetime.utcnow() + timedelta(hours=ttl)

        session = SessionData(
            session_id=session_id,
            user_id=user_id,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
            metadata=metadata or {},
        )

        await self.store.set(session)
        logger.info(f"Created session {session_id} for user {user_id}")
        
        return session

    async def get_session(self, session_id: str) -> Optional[SessionData]:
        """
        Get a session by ID.
        
        Args:
            session_id: Session identifier
        
        Returns:
            SessionData if valid, None otherwise
        """
        session = await self.store.get(session_id)
        
        if session and not session.is_valid():
            if session.is_expired():
                await self.store.delete(session_id)
            return None
        
        return session

    async def validate_session(self, session_id: str) -> tuple[bool, Optional[SessionData]]:
        """
        Validate a session and return its data.
        
        Args:
            session_id: Session identifier
        
        Returns:
            Tuple of (is_valid, session_data)
        """
        session = await self.get_session(session_id)
        
        if not session:
            return False, None
        
        if session.status != SessionStatus.ACTIVE:
            return False, session
        
        return True, session

    async def refresh_session(
        self,
        session_id: str,
        extend_hours: Optional[int] = None
    ) -> Optional[SessionData]:
        """
        Refresh a session's expiry time.
        
        Args:
            session_id: Session identifier
            extend_hours: Hours to extend (default: session_ttl_hours)
        
        Returns:
            Updated SessionData if successful, None otherwise
        """
        session = await self.get_session(session_id)
        
        if not session:
            return None
        
        if session.status == SessionStatus.REVOKED:
            return None

        ttl = extend_hours or self.session_ttl_hours
        session.expires_at = datetime.utcnow() + timedelta(hours=ttl)
        session.update_access()
        
        await self.store.set(session)
        
        return session

    async def update_session(
        self,
        session_id: str,
        data: Dict[str, Any]
    ) -> Optional[SessionData]:
        """
        Update session data.
        
        Args:
            session_id: Session identifier
            data: Data to update
        
        Returns:
            Updated SessionData if successful
        """
        session = await self.get_session(session_id)
        
        if not session:
            return None
        
        session.data.update(data)
        session.update_access()
        
        await self.store.set(session)
        
        return session

    async def revoke_session(self, session_id: str) -> bool:
        """
        Revoke a session.
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if revoked successfully
        """
        session = await self.store.get(session_id)
        
        if not session:
            return False
        
        session.revoke()
        await self.store.set(session)
        
        logger.info(f"Revoked session {session_id}")
        return True

    async def delete_session(self, session_id: str) -> bool:
        """
        Delete a session completely.
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if deleted
        """
        result = await self.store.delete(session_id)
        
        if result:
            logger.info(f"Deleted session {session_id}")
        
        return result

    async def get_user_sessions(self, user_id: str) -> List[SessionData]:
        """
        Get all active sessions for a user.
        
        Args:
            user_id: User identifier
        
        Returns:
            List of active sessions
        """
        sessions = await self.store.get_user_sessions(user_id)
        return [s for s in sessions if s.is_valid()]

    async def get_user_session_count(self, user_id: str) -> int:
        """
        Get the number of active sessions for a user.
        
        Args:
            user_id: User identifier
        
        Returns:
            Number of active sessions
        """
        sessions = await self.get_user_sessions(user_id)
        return len(sessions)

    async def revoke_all_user_sessions(self, user_id: str) -> int:
        """
        Revoke all sessions for a user.
        
        Args:
            user_id: User identifier
        
        Returns:
            Number of sessions revoked
        """
        sessions = await self.get_user_sessions(user_id)
        count = 0
        
        for session in sessions:
            if await self.revoke_session(session.session_id):
                count += 1
        
        return count

    async def delete_all_user_sessions(self, user_id: str) -> int:
        """
        Delete all sessions for a user.
        
        Args:
            user_id: User identifier
        
        Returns:
            Number of sessions deleted
        """
        count = await self.store.delete_user_sessions(user_id)
        logger.info(f"Deleted {count} sessions for user {user_id}")
        return count

    async def cleanup_expired(self) -> int:
        """
        Clean up all expired sessions.
        
        Returns:
            Number of sessions cleaned up
        """
        count = await self.store.cleanup_expired()
        logger.info(f"Cleaned up {count} expired sessions")
        return count

    async def is_concurrent_limit_reached(self, user_id: str) -> bool:
        """
        Check if user has reached concurrent session limit.
        
        Args:
            user_id: User identifier
        
        Returns:
            True if limit reached
        """
        count = await self.get_user_session_count(user_id)
        return count >= self.max_concurrent_sessions


session_manager = SessionManager()
