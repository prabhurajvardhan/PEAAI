"""Session management API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.api.dependencies import get_current_user
from backend.database.models import User
from backend.session.manager import session_manager

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])


class SessionResponse(BaseModel):
    """Session response schema."""
    
    session_id: str = Field(description="Session identifier")
    user_id: str = Field(description="User identifier")
    created_at: str = Field(description="Session creation time")
    last_accessed: str = Field(description="Last access time")
    expires_at: str = Field(description="Session expiration time")
    user_agent: Optional[str] = Field(None, description="User agent")
    ip_address: Optional[str] = Field(None, description="IP address")
    is_current: bool = Field(False, description="Is this the current session")


class SessionListResponse(BaseModel):
    """List of sessions response."""
    
    sessions: List[SessionResponse]
    total: int
    max_concurrent: int


class SessionCreateRequest(BaseModel):
    """Create session request."""
    
    ttl_hours: Optional[int] = Field(
        None,
        ge=1,
        le=720,
        description="Session TTL in hours (1-720)"
    )


class SessionDataUpdateRequest(BaseModel):
    """Update session data request."""
    
    data: dict = Field(description="Session data to update")


@router.get("/", response_model=SessionListResponse)
async def list_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    List all active sessions for the current user.
    
    Returns session information including creation time,
    last accessed time, and expiration.
    """
    sessions = await session_manager.get_user_sessions(str(current_user.id))
    
    current_session_id = request.headers.get("X-Session-ID")
    
    session_responses = [
        SessionResponse(
            session_id=s.session_id,
            user_id=s.user_id,
            created_at=s.created_at.isoformat(),
            last_accessed=s.last_accessed.isoformat(),
            expires_at=s.expires_at.isoformat(),
            user_agent=s.user_agent,
            ip_address=s.ip_address,
            is_current=s.session_id == current_session_id,
        )
        for s in sessions
    ]
    
    return SessionListResponse(
        sessions=session_responses,
        total=len(session_responses),
        max_concurrent=session_manager.max_concurrent_sessions,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get details of a specific session.
    """
    is_valid, session = await session_manager.validate_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return SessionResponse(
        session_id=session.session_id,
        user_id=session.user_id,
        created_at=session.created_at.isoformat(),
        last_accessed=session.last_accessed.isoformat(),
        expires_at=session.expires_at.isoformat(),
        user_agent=session.user_agent,
        ip_address=session.ip_address,
        is_current=False,
    )


@router.post("/", response_model=SessionResponse)
async def create_session(
    request: Request,
    session_request: Optional[SessionCreateRequest] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Create a new session for the current user.
    
    If the maximum concurrent sessions is reached, the oldest
    session will be automatically revoked.
    """
    ttl_hours = session_request.ttl_hours if session_request else None
    user_agent = request.headers.get("User-Agent")
    client_host = request.client.host if request.client else None
    
    session = await session_manager.create_session(
        user_id=str(current_user.id),
        user_agent=user_agent,
        ip_address=client_host,
        ttl_hours=ttl_hours,
    )
    
    return SessionResponse(
        session_id=session.session_id,
        user_id=session.user_id,
        created_at=session.created_at.isoformat(),
        last_accessed=session.last_accessed.isoformat(),
        expires_at=session.expires_at.isoformat(),
        user_agent=session.user_agent,
        ip_address=session.ip_address,
        is_current=True,
    )


@router.post("/{session_id}/refresh", response_model=SessionResponse)
async def refresh_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Refresh a session's expiration time.
    """
    session = await session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    updated = await session_manager.refresh_session(session_id)
    
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to refresh session"
        )
    
    return SessionResponse(
        session_id=updated.session_id,
        user_id=updated.user_id,
        created_at=updated.created_at.isoformat(),
        last_accessed=updated.last_accessed.isoformat(),
        expires_at=updated.expires_at.isoformat(),
        user_agent=updated.user_agent,
        ip_address=updated.ip_address,
        is_current=False,
    )


@router.put("/{session_id}/data")
async def update_session_data(
    session_id: str,
    update_request: SessionDataUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update session data.
    """
    session = await session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    updated = await session_manager.update_session(session_id, update_request.data)
    
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update session"
        )
    
    return {"message": "Session data updated", "data": updated.data}


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Revoke a specific session.
    """
    session = await session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await session_manager.revoke_session(session_id)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
):
    """
    Revoke all sessions for the current user except the current one.
    """
    await session_manager.revoke_all_user_sessions(str(current_user.id))


@router.post("/cleanup", status_code=status.HTTP_200_OK)
async def cleanup_expired_sessions():
    """
    Clean up all expired sessions (admin endpoint).
    """
    count = await session_manager.cleanup_expired()
    return {"message": "Cleanup complete", "cleaned": count}
