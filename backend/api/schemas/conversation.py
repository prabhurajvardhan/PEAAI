"""Pydantic schemas for Conversation endpoints."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class ConversationModeEnum(str, Enum):
    """Conversation mode enum."""
    COMPANION = "companion"
    STORY = "story"


class MessageRoleEnum(str, Enum):
    """Message role enum."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConversationBase(BaseModel):
    """Base conversation schema."""
    title: Optional[str] = Field(default=None, max_length=500, description="Conversation title")
    mode: ConversationModeEnum = Field(default=ConversationModeEnum.COMPANION, description="Conversation mode")


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation."""
    pass


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation."""
    title: Optional[str] = Field(default=None, max_length=500, description="Conversation title")
    mode: Optional[ConversationModeEnum] = Field(default=None, description="Conversation mode")
    is_active: Optional[bool] = Field(default=None, description="Whether conversation is active")


class ConversationResponse(BaseModel):
    """Schema for conversation response."""
    id: str = Field(description="Conversation UUID")
    user_id: str = Field(description="Owner user UUID")
    title: Optional[str] = Field(default=None, description="Conversation title")
    mode: ConversationModeEnum = Field(description="Conversation mode")
    is_active: bool = Field(description="Whether conversation is active")
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Last update timestamp")
    ended_at: Optional[datetime] = Field(default=None, description="End timestamp")
    message_count: int = Field(description="Number of messages")
    meta: Optional[dict] = Field(default=None, description="Additional metadata")

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    """Schema for paginated conversation list response."""
    items: list[ConversationResponse]
    total: int
    skip: int
    limit: int
    has_more: bool


class MessageBase(BaseModel):
    """Base message schema."""
    content: str = Field(description="Message content")
    role: MessageRoleEnum = Field(description="Message role")


class MessageCreate(MessageBase):
    """Schema for creating a message."""
    conversation_id: str = Field(description="Conversation UUID")


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: str = Field(description="Message UUID")
    conversation_id: str = Field(description="Conversation UUID")
    role: MessageRoleEnum = Field(description="Message role")
    content: str = Field(description="Message content")
    sequence_number: int = Field(description="Sequence number in conversation")
    created_at: datetime = Field(description="Creation timestamp")
    meta: Optional[dict] = Field(default=None, description="Additional metadata")

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    """Schema for paginated message list response."""
    items: list[MessageResponse]
    total: int
    skip: int
    limit: int
    has_more: bool
