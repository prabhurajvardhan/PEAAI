"""Pydantic schemas for User endpoints."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr = Field(description="User email address")
    username: str = Field(min_length=3, max_length=100, description="Username")
    display_name: Optional[str] = Field(default=None, max_length=200, description="Display name")
    bio: Optional[str] = Field(default=None, description="User bio")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(min_length=8, max_length=128, description="Password")
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = Field(default=None, description="Email address")
    username: Optional[str] = Field(default=None, min_length=3, max_length=100, description="Username")
    display_name: Optional[str] = Field(default=None, max_length=200, description="Display name")
    avatar_url: Optional[str] = Field(default=None, description="Avatar URL")
    bio: Optional[str] = Field(default=None, description="User bio")
    preferences: Optional[str] = Field(default=None, description="User preferences as JSON")


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str = Field(description="User UUID")
    email: str = Field(description="Email address")
    username: str = Field(description="Username")
    display_name: Optional[str] = Field(default=None, description="Display name")
    avatar_url: Optional[str] = Field(default=None, description="Avatar URL")
    is_active: bool = Field(description="Whether user is active")
    is_verified: bool = Field(description="Whether user is verified")
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Last update timestamp")
    last_login: Optional[datetime] = Field(default=None, description="Last login timestamp")
    bio: Optional[str] = Field(default=None, description="User bio")

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""
    items: list[UserResponse]
    total: int
    skip: int
    limit: int
    has_more: bool
