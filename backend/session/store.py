"""Session storage implementation."""
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.session.models import SessionData, SessionStatus

logger = logging.getLogger(__name__)


class SessionStore:
    """
    Abstract session storage interface.
    
    Provides a common interface for different storage backends
    (Redis, database, in-memory).
    """

    async def get(self, session_id: str) -> Optional[SessionData]:
        """
        Get a session by ID.
        
        Args:
            session_id: Session identifier
        
        Returns:
            SessionData if found, None otherwise
        """
        raise NotImplementedError

    async def set(self, session: SessionData) -> None:
        """
        Store a session.
        
        Args:
            session: Session data to store
        """
        raise NotImplementedError

    async def delete(self, session_id: str) -> bool:
        """
        Delete a session.
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if deleted, False if not found
        """
        raise NotImplementedError

    async def exists(self, session_id: str) -> bool:
        """
        Check if a session exists.
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if exists
        """
        raise NotImplementedError

    async def get_user_sessions(self, user_id: str) -> List[SessionData]:
        """
        Get all sessions for a user.
        
        Args:
            user_id: User identifier
        
        Returns:
            List of user's sessions
        """
        raise NotImplementedError

    async def delete_user_sessions(self, user_id: str) -> int:
        """
        Delete all sessions for a user.
        
        Args:
            user_id: User identifier
        
        Returns:
            Number of sessions deleted
        """
        raise NotImplementedError

    async def cleanup_expired(self) -> int:
        """
        Remove all expired sessions.
        
        Returns:
            Number of sessions cleaned up
        """
        raise NotImplementedError


class RedisSessionStore(SessionStore):
    """
    Redis-backed session storage.
    
    Uses Redis for fast session storage with TTL support.
    """

    def __init__(self, redis_client=None):
        """
        Initialize the Redis session store.
        
        Args:
            redis_client: Redis client instance
        """
        self.redis = redis_client
        self._user_sessions_key = "session:user:{user_id}"
        self._session_key = "session:{session_id}"
        self._all_sessions_pattern = "session:*"

    def _get_session_key(self, session_id: str) -> str:
        """Get the Redis key for a session."""
        return self._session_key.format(session_id=session_id)

    def _get_user_sessions_key(self, user_id: str) -> str:
        """Get the Redis key for user's session set."""
        return self._user_sessions_key.format(user_id=user_id)

    async def get(self, session_id: str) -> Optional[SessionData]:
        """Get a session from Redis."""
        if not self.redis:
            return None
        
        try:
            key = self._get_session_key(session_id)
            data = await self.redis.get(key)
            
            if not data:
                return None
            
            session_dict = json.loads(data)
            return SessionData.from_dict(session_dict)
            
        except Exception as e:
            logger.error(f"Error getting session {session_id}: {e}")
            return None

    async def set(self, session: SessionData) -> None:
        """Store a session in Redis."""
        if not self.redis:
            return
        
        try:
            key = self._get_session_key(session.session_id)
            data = json.dumps(session.to_dict())
            
            ttl = max(1, int((session.expires_at - datetime.utcnow()).total_seconds()))
            
            await self.redis.setex(key, ttl, data)
            
            user_key = self._get_user_sessions_key(session.user_id)
            await self.redis.sadd(user_key, session.session_id)
            await self.redis.expire(user_key, ttl + 3600)
            
        except Exception as e:
            logger.error(f"Error setting session {session.session_id}: {e}")

    async def delete(self, session_id: str) -> bool:
        """Delete a session from Redis."""
        if not self.redis:
            return False
        
        try:
            session = await self.get(session_id)
            if not session:
                return False
            
            key = self._get_session_key(session_id)
            await self.redis.delete(key)
            
            user_key = self._get_user_sessions_key(session.user_id)
            await self.redis.srem(user_key, session_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False

    async def exists(self, session_id: str) -> bool:
        """Check if a session exists in Redis."""
        if not self.redis:
            return False
        
        try:
            key = self._get_session_key(session_id)
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking session {session_id}: {e}")
            return False

    async def get_user_sessions(self, user_id: str) -> List[SessionData]:
        """Get all sessions for a user from Redis."""
        if not self.redis:
            return []
        
        try:
            user_key = self._get_user_sessions_key(user_id)
            session_ids = await self.redis.smembers(user_key)
            
            sessions = []
            for session_id in session_ids:
                session = await self.get(session_id)
                if session and session.is_valid():
                    sessions.append(session)
                elif session:
                    await self.redis.srem(user_key, session_id)
            
            return sessions
            
        except Exception as e:
            logger.error(f"Error getting user sessions for {user_id}: {e}")
            return []

    async def delete_user_sessions(self, user_id: str) -> int:
        """Delete all sessions for a user."""
        if not self.redis:
            return 0
        
        try:
            sessions = await self.get_user_sessions(user_id)
            count = 0
            
            for session in sessions:
                if await self.delete(session.session_id):
                    count += 1
            
            user_key = self._get_user_sessions_key(user_id)
            await self.redis.delete(user_key)
            
            return count
            
        except Exception as e:
            logger.error(f"Error deleting user sessions for {user_id}: {e}")
            return 0

    async def cleanup_expired(self) -> int:
        """Clean up expired sessions (requires iterating all keys)."""
        if not self.redis:
            return 0
        
        try:
            keys = await self.redis.keys(self._all_sessions_pattern)
            cleaned = 0
            
            for key in keys:
                data = await self.redis.get(key)
                if data:
                    try:
                        session_dict = json.loads(data)
                        session = SessionData.from_dict(session_dict)
                        if session.is_expired():
                            await self.redis.delete(key)
                            cleaned += 1
                    except (json.JSONDecodeError, KeyError):
                        await self.redis.delete(key)
                        cleaned += 1
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Error cleaning up sessions: {e}")
            return 0


class InMemorySessionStore(SessionStore):
    """
    In-memory session storage for development/testing.
    
    Not suitable for production use.
    """

    def __init__(self):
        """Initialize the in-memory store."""
        self._sessions: Dict[str, SessionData] = {}
        self._user_sessions: Dict[str, set] = {}

    async def get(self, session_id: str) -> Optional[SessionData]:
        """Get a session from memory."""
        session = self._sessions.get(session_id)
        
        if session and session.is_expired():
            await self.delete(session_id)
            return None
        
        return session

    async def set(self, session: SessionData) -> None:
        """Store a session in memory."""
        self._sessions[session.session_id] = session
        
        if session.user_id not in self._user_sessions:
            self._user_sessions[session.user_id] = set()
        self._user_sessions[session.user_id].add(session.session_id)

    async def delete(self, session_id: str) -> bool:
        """Delete a session from memory."""
        session = self._sessions.pop(session_id, None)
        
        if session:
            user_sessions = self._user_sessions.get(session.user_id, set())
            user_sessions.discard(session_id)
            return True
        
        return False

    async def exists(self, session_id: str) -> bool:
        """Check if a session exists in memory."""
        session = await self.get(session_id)
        return session is not None

    async def get_user_sessions(self, user_id: str) -> List[SessionData]:
        """Get all sessions for a user."""
        session_ids = self._user_sessions.get(user_id, set())
        
        sessions = []
        for session_id in list(session_ids):
            session = await self.get(session_id)
            if session:
                sessions.append(session)
            else:
                self._user_sessions[user_id].discard(session_id)
        
        return sessions

    async def delete_user_sessions(self, user_id: str) -> int:
        """Delete all sessions for a user."""
        sessions = await self.get_user_sessions(user_id)
        count = 0
        
        for session in sessions:
            if await self.delete(session.session_id):
                count += 1
        
        return count

    async def cleanup_expired(self) -> int:
        """Clean up expired sessions."""
        expired_ids = [
            sid for sid, session in list(self._sessions.items())
            if session.is_expired()
        ]
        
        for session_id in expired_ids:
            await self.delete(session_id)
        
        return len(expired_ids)

    def get_stats(self) -> Dict:
        """Get store statistics."""
        return {
            "total_sessions": len(self._sessions),
            "total_users": len(self._user_sessions),
            "active_sessions": sum(
                1 for s in self._sessions.values() if s.is_valid()
            ),
        }
