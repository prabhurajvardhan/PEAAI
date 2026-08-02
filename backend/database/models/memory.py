"""Memory model for AI memory and context storage."""
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Boolean, Text, ForeignKey, Float, Integer,
    Index, CheckConstraint, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum

from .. import Base


class MemoryType(str, enum.Enum):
    """Memory type enum."""
    USER_PREFERENCE = "user_preference"
    USER_FACT = "user_fact"
    RELATIONSHIP = "relationship"
    CONVERSATION_SUMMARY = "conversation_summary"
    CONTEXT = "context"
    LONG_TERM = "long_term"


class MemoryImportance(str, enum.Enum):
    """Memory importance level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Memory(Base):
    """Memory model for storing AI memory and context."""

    __tablename__ = "memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True)
    
    memory_type = Column(SQLEnum(MemoryType), nullable=False)
    importance = Column(SQLEnum(MemoryImportance), default=MemoryImportance.MEDIUM, nullable=False)
    
    content = Column(Text, nullable=False)
    summary = Column(String(500), nullable=True)
    
    embedding = Column(Text, nullable=True)  # Vector embedding for semantic search
    
    relevance_score = Column(Float, default=1.0, nullable=False)
    access_count = Column(Integer, default=0, nullable=False)
    last_accessed = Column(DateTime, nullable=True)
    
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    meta = Column(JSONB, nullable=True)
    tags = Column(JSONB, nullable=True)  # Array of tags for categorization

    # Relationships
    user = relationship("User", back_populates="memories")
    conversation = relationship("Conversation", foreign_keys=[conversation_id])

    __table_args__ = (
        Index("ix_memories_user_id", "user_id"),
        Index("ix_memories_conversation_id", "conversation_id"),
        Index("ix_memories_memory_type", "memory_type"),
        Index("ix_memories_importance", "importance"),
        Index("ix_memories_created_at", "created_at"),
        Index("ix_memories_user_type", "user_id", "memory_type"),
        Index("ix_memories_user_importance", "user_id", "importance"),
        Index("ix_memories_relevance_score", "relevance_score"),
        Index("ix_memories_is_pinned", "is_pinned"),
        Index("ix_memories_is_active", "is_active"),
        Index("ix_memories_expires_at", "expires_at"),
        CheckConstraint("relevance_score >= 0 AND relevance_score <= 1", name="chk_memories_relevance_score"),
        CheckConstraint("access_count >= 0", name="chk_memories_access_count"),
    )

    def __repr__(self) -> str:
        return f"<Memory(id={self.id}, type={self.memory_type}, user_id={self.user_id})>"


# Helper table for memory relationships
class MemoryRelation(Base):
    """Defines relationships between memories for associative retrieval."""

    __tablename__ = "memory_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_memory_id = Column(UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), nullable=False)
    target_memory_id = Column(UUID(as_uuid=True), ForeignKey("memories.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(100), nullable=False)  # e.g., "related_to", "caused_by", "similar_to"
    strength = Column(Float, default=0.5, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_memory_relations_source", "source_memory_id"),
        Index("ix_memory_relations_target", "target_memory_id"),
        Index("ix_memory_relations_type", "relation_type"),
        Index("ix_memory_relations_source_target", "source_memory_id", "target_memory_id", unique=True),
        CheckConstraint("strength >= 0 AND strength <= 1", name="chk_memory_relations_strength"),
    )
