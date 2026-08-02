"""Story model for storing generated stories and scenes."""
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Boolean, Text, ForeignKey, Integer,
    Index, CheckConstraint, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum

from .. import Base


class StoryStatus(str, enum.Enum):
    """Story generation status."""
    DRAFT = "draft"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class StoryGenre(str, enum.Enum):
    """Story genre types."""
    FANTASY = "fantasy"
    SCIFI = "scifi"
    MYSTERY = "mystery"
    ROMANCE = "romance"
    ADVENTURE = "adventure"
    HORROR = "horror"
    COMEDY = "comedy"
    DRAMA = "drama"
    OTHER = "other"


class Story(Base):
    """Story model for storing generated stories."""

    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(500), nullable=False)
    genre = Column(SQLEnum(StoryGenre), default=StoryGenre.OTHER, nullable=False)
    status = Column(SQLEnum(StoryStatus), default=StoryStatus.DRAFT, nullable=False)
    
    content = Column(Text, nullable=True)  # Full story text
    summary = Column(Text, nullable=True)  # AI-generated summary
    
    scene_count = Column(Integer, default=0, nullable=False)
    word_count = Column(Integer, default=0, nullable=False)
    
    rating = Column(Integer, nullable=True)  # User rating 1-5
    is_favorite = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    metadata = Column(JSONB, nullable=True)  # Additional story metadata
    tags = Column(JSONB, nullable=True)  # User-defined tags

    # Relationships
    user = relationship("User", back_populates="stories")
    conversation = relationship("Conversation", foreign_keys=[conversation_id])
    scenes = relationship(
        "StoryScene",
        back_populates="story",
        cascade="all, delete-orphan",
        order_by="StoryScene.scene_number"
    )

    __table_args__ = (
        Index("ix_stories_user_id", "user_id"),
        Index("ix_stories_conversation_id", "conversation_id"),
        Index("ix_stories_status", "status"),
        Index("ix_stories_genre", "genre"),
        Index("ix_stories_created_at", "created_at"),
        Index("ix_stories_user_status", "user_id", "status"),
        Index("ix_stories_user_created", "user_id", "created_at"),
        Index("ix_stories_is_favorite", "is_favorite"),
        Index("ix_stories_is_public", "is_public"),
        Index("ix_stories_rating", "rating"),
        CheckConstraint("scene_count >= 0", name="chk_stories_scene_count"),
        CheckConstraint("word_count >= 0", name="chk_stories_word_count"),
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="chk_stories_rating"),
    )

    def __repr__(self) -> str:
        return f"<Story(id={self.id}, title={self.title}, status={self.status})>"


class StoryScene(Base):
    """Individual scene within a story."""

    __tablename__ = "story_scenes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    
    scene_number = Column(Integer, nullable=False)
    title = Column(String(300), nullable=True)
    
    description = Column(Text, nullable=True)  # Scene description for rendering
    narrative = Column(Text, nullable=True)  # Narrative text
    
    background_prompt = Column(Text, nullable=True)  # AI prompt for background
    character_positions = Column(JSONB, nullable=True)  # Character placement data
    
    emotion = Column(String(100), nullable=True)  # Scene emotion
    duration_ms = Column(Integer, default=5000, nullable=False)  # Scene duration in milliseconds
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    story = relationship("Story", back_populates="scenes")

    __table_args__ = (
        Index("ix_story_scenes_story_id", "story_id"),
        Index("ix_story_scenes_scene_number", "scene_number"),
        Index("ix_story_scenes_story_scene", "story_id", "scene_number", unique=True),
        CheckConstraint("scene_number > 0", name="chk_story_scenes_scene_number"),
        CheckConstraint("duration_ms > 0", name="chk_story_scenes_duration_ms"),
    )

    def __repr__(self) -> str:
        return f"<StoryScene(id={self.id}, story_id={self.story_id}, number={self.scene_number})>"


# Version history for story content
class StoryVersion(Base):
    """Version history for story content."""

    __tablename__ = "story_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    
    change_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_story_versions_story_id", "story_id"),
        Index("ix_story_versions_story_version", "story_id", "version_number", unique=True),
        CheckConstraint("version_number > 0", name="chk_story_versions_version_number"),
    )
