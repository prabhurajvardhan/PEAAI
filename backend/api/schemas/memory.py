"""Pydantic schemas for Memory endpoints."""
from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class MemoryTypeEnum(str, Enum):
    """Memory type enum."""
    USER_PREFERENCE = "user_preference"
    USER_FACT = "user_fact"
    RELATIONSHIP = "relationship"
    CONVERSATION_SUMMARY = "conversation_summary"
    CONTEXT = "context"
    LONG_TERM = "long_term"


class MemoryImportanceEnum(str, Enum):
    """Memory importance enum."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MemoryBase(BaseModel):
    """Base memory schema."""
    memory_type: MemoryTypeEnum = Field(description="Type of memory")
    content: str = Field(description="Memory content")
    summary: Optional[str] = Field(default=None, max_length=500, description="Memory summary")
    importance: MemoryImportanceEnum = Field(default=MemoryImportanceEnum.MEDIUM, description="Importance level")
    is_pinned: bool = Field(default=False, description="Whether memory is pinned")
    tags: Optional[list[str]] = Field(default=None, description="Tags for categorization")
    metadata: Optional[dict[str, Any]] = Field(default=None, description="Additional metadata")


class MemoryCreate(MemoryBase):
    """Schema for creating a memory."""
    conversation_id: Optional[str] = Field(default=None, description="Related conversation UUID")


class MemoryUpdate(BaseModel):
    """Schema for updating a memory."""
    content: Optional[str] = Field(default=None, description="Memory content")
    summary: Optional[str] = Field(default=None, max_length=500, description="Memory summary")
    importance: Optional[MemoryImportanceEnum] = Field(default=None, description="Importance level")
    is_pinned: Optional[bool] = Field(default=None, description="Whether memory is pinned")
    is_active: Optional[bool] = Field(default=None, description="Whether memory is active")
    tags: Optional[list[str]] = Field(default=None, description="Tags for categorization")
    meta: Optional[dict[str, Any]] = Field(default=None, description="Additional metadata")


class MemoryResponse(BaseModel):
    """Schema for memory response."""
    id: str = Field(description="Memory UUID")
    user_id: str = Field(description="User UUID")
    conversation_id: Optional[str] = Field(default=None, description="Related conversation UUID")
    memory_type: MemoryTypeEnum = Field(description="Type of memory")
    content: str = Field(description="Memory content")
    summary: Optional[str] = Field(default=None, description="Memory summary")
    importance: MemoryImportanceEnum = Field(description="Importance level")
    relevance_score: float = Field(description="Relevance score")
    access_count: int = Field(description="Number of times accessed")
    last_accessed: Optional[datetime] = Field(default=None, description="Last access timestamp")
    is_pinned: bool = Field(description="Whether memory is pinned")
    is_active: bool = Field(description="Whether memory is active")
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Last update timestamp")
    expires_at: Optional[datetime] = Field(default=None, description="Expiration timestamp")
    tags: Optional[list[str]] = Field(default=None, description="Tags")
    meta: Optional[dict] = Field(default=None, description="Additional metadata")

    model_config = {"from_attributes": True}


class MemoryListResponse(BaseModel):
    """Schema for paginated memory list response."""
    items: list[MemoryResponse]
    total: int
    skip: int
    limit: int
    has_more: bool
