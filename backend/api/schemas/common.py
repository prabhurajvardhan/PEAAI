"""Common Pydantic schemas for API responses and pagination."""
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field


T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""
    skip: int = Field(default=0, ge=0, description="Number of records to skip")
    limit: int = Field(default=20, ge=1, le=100, description="Maximum number of records to return")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: list[T]
    total: int = Field(description="Total number of items")
    skip: int = Field(description="Number of items skipped")
    limit: int = Field(description="Maximum items per page")
    has_more: bool = Field(description="Whether there are more items")

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        skip: int,
        limit: int
    ) -> "PaginatedResponse[T]":
        """Create a paginated response."""
        return cls(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(items)) < total
        )


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str = Field(description="Response message")


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str = Field(description="Error type")
    detail: Optional[str] = Field(default=None, description="Error details")
    status_code: int = Field(description="HTTP status code")
