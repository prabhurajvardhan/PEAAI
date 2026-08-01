"""User model for authentication and profile management."""
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Boolean, Text, Index,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import bcrypt

from .. import Base


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(Text, nullable=False)
    display_name = Column(String(200), nullable=True)
    avatar_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
    preferences = Column(Text, nullable=True)  # JSON stored as text
    bio = Column(Text, nullable=True)

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    stories = relationship("Story", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_email_lower", "email", postgresql_where=email.isnot(None)),
        Index("ix_users_username_lower", "username", postgresql_where=username.isnot(None)),
        Index("ix_users_created_at", "created_at"),
        CheckConstraint("is_active IN (true, false)", name="chk_users_is_active"),
        CheckConstraint("is_verified IN (true, false)", name="chk_users_is_verified"),
    )

    def set_password(self, password: str) -> None:
        """Hash and set the user's password."""
        salt = bcrypt.gensalt()
        self.hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(self, password: str) -> bool:
        """Verify the user's password."""
        return bcrypt.checkpw(
            password.encode("utf-8"),
            self.hashed_password.encode("utf-8")
        )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username})>"
