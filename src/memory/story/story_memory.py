"""
Story Memory - Manages storage and retrieval of generated stories.

This module handles:
- Story storage
- Story summaries
- Story retrieval
- Story deletion
- Story metadata management
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
import uuid


class StoryStatus(str, Enum):
    """Story generation status."""
    DRAFT = "draft"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class StoryGenre(str, Enum):
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


@dataclass
class StorySummary:
    """AI-generated summary of a story."""
    
    story_id: str
    summary_text: str
    key_characters: List[str] = field(default_factory=list)
    key_locations: List[str] = field(default_factory=list)
    key_themes: List[str] = field(default_factory=list)
    main_conflict: Optional[str] = None
    resolution: Optional[str] = None
    sentiment_arc: str = "neutral"  # positive, negative, neutral, mixed
    generated_at: datetime = field(default_factory=datetime.utcnow)
    model_version: str = "v1"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert summary to dictionary."""
        return {
            "story_id": self.story_id,
            "summary_text": self.summary_text,
            "key_characters": self.key_characters,
            "key_locations": self.key_locations,
            "key_themes": self.key_themes,
            "main_conflict": self.main_conflict,
            "resolution": self.resolution,
            "sentiment_arc": self.sentiment_arc,
            "generated_at": self.generated_at.isoformat(),
            "model_version": self.model_version,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StorySummary":
        """Create summary from dictionary."""
        generated_at = data.get("generated_at")
        if isinstance(generated_at, str):
            generated_at = datetime.fromisoformat(generated_at)
        elif generated_at is None:
            generated_at = datetime.utcnow()
        
        return cls(
            story_id=data.get("story_id", ""),
            summary_text=data.get("summary_text", ""),
            key_characters=data.get("key_characters", []),
            key_locations=data.get("key_locations", []),
            key_themes=data.get("key_themes", []),
            main_conflict=data.get("main_conflict"),
            resolution=data.get("resolution"),
            sentiment_arc=data.get("sentiment_arc", "neutral"),
            generated_at=generated_at,
            model_version=data.get("model_version", "v1"),
        )


@dataclass
class StoryMetadata:
    """Metadata for a story."""
    
    story_id: str
    title: str
    genre: StoryGenre
    status: StoryStatus
    
    # Counts
    scene_count: int = 0
    word_count: int = 0
    
    # User engagement
    rating: Optional[int] = None  # 1-5
    is_favorite: bool = False
    is_public: bool = False
    
    # Timestamps
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    # Tags and metadata
    tags: List[str] = field(default_factory=list)
    characters: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Relationships
    conversation_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary."""
        return {
            "story_id": self.story_id,
            "title": self.title,
            "genre": self.genre.value if isinstance(self.genre, Enum) else self.genre,
            "status": self.status.value if isinstance(self.status, Enum) else self.status,
            "scene_count": self.scene_count,
            "word_count": self.word_count,
            "rating": self.rating,
            "is_favorite": self.is_favorite,
            "is_public": self.is_public,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "tags": self.tags,
            "characters": self.characters,
            "metadata": self.metadata,
            "conversation_id": self.conversation_id,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StoryMetadata":
        """Create metadata from dictionary."""
        genre = data.get("genre", "other")
        if isinstance(genre, str):
            genre = StoryGenre(genre.lower())
        
        status = data.get("status", "draft")
        if isinstance(status, str):
            status = StoryStatus(status.lower())
        
        def parse_datetime(dt):
            if isinstance(dt, str):
                return datetime.fromisoformat(dt)
            return dt
        
        return cls(
            story_id=data.get("story_id", ""),
            title=data.get("title", ""),
            genre=genre,
            status=status,
            scene_count=data.get("scene_count", 0),
            word_count=data.get("word_count", 0),
            rating=data.get("rating"),
            is_favorite=data.get("is_favorite", False),
            is_public=data.get("is_public", False),
            started_at=parse_datetime(data.get("started_at")),
            completed_at=parse_datetime(data.get("completed_at")),
            created_at=parse_datetime(data.get("created_at")) or datetime.utcnow(),
            updated_at=parse_datetime(data.get("updated_at")) or datetime.utcnow(),
            tags=data.get("tags", []),
            characters=data.get("characters", []),
            metadata=data.get("metadata", {}),
            conversation_id=data.get("conversation_id"),
        )


@dataclass
class StoryQuery:
    """Query parameters for searching stories."""
    
    user_id: str
    query: Optional[str] = None  # Text search query
    
    # Filters
    genre: Optional[StoryGenre] = None
    status: Optional[StoryStatus] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    is_public: Optional[bool] = None
    min_rating: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    
    # Sorting
    sort_by: str = "created_at"  # created_at, updated_at, rating, word_count
    sort_order: str = "desc"  # asc, desc
    
    # Pagination
    limit: int = 20
    offset: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert query to dictionary."""
        return {
            "user_id": self.user_id,
            "query": self.query,
            "genre": self.genre.value if isinstance(self.genre, Enum) else self.genre,
            "status": self.status.value if isinstance(self.status, Enum) else self.status,
            "tags": self.tags,
            "is_favorite": self.is_favorite,
            "is_public": self.is_public,
            "min_rating": self.min_rating,
            "date_from": self.date_from.isoformat() if self.date_from else None,
            "date_to": self.date_to.isoformat() if self.date_to else None,
            "sort_by": self.sort_by,
            "sort_order": self.sort_order,
            "limit": self.limit,
            "offset": self.offset,
        }


class StoryMemory:
    """
    Story Memory manager for storing and retrieving generated stories.
    
    Provides:
    - Story storage and retrieval
    - AI-generated summaries
    - Story metadata management
    - Story deletion with cleanup
    """
    
    def __init__(self, db_session=None):
        """
        Initialize Story Memory.
        
        Args:
            db_session: Optional database session for persistence
        """
        self._db_session = db_session
        self._stories: Dict[str, StoryMetadata] = {}
        self._summaries: Dict[str, StorySummary] = {}
        self._contents: Dict[str, str] = {}  # Full story content
        self._index_by_user: Dict[str, List[str]] = {}  # user_id -> [story_ids]
        self._index_by_genre: Dict[str, List[str]] = {}  # genre -> [story_ids]
        self._index_by_tag: Dict[str, List[str]] = {}  # tag -> [story_ids]
    
    def store_story(
        self,
        user_id: str,
        title: str,
        content: str,
        genre: StoryGenre = StoryGenre.OTHER,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Store a new story.
        
        Args:
            user_id: User identifier
            title: Story title
            content: Full story content
            genre: Story genre
            conversation_id: Optional conversation ID
            metadata: Optional additional metadata
            
        Returns:
            Story ID
        """
        story_id = str(uuid.uuid4())
        
        # Create metadata
        story_metadata = StoryMetadata(
            story_id=story_id,
            title=title,
            genre=genre,
            status=StoryStatus.COMPLETED,
            word_count=len(content.split()),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            conversation_id=conversation_id,
            metadata=metadata or {},
        )
        
        # Store content and metadata
        self._stories[story_id] = story_metadata
        self._contents[story_id] = content
        
        # Update indexes
        self._index_by_user.setdefault(user_id, []).append(story_id)
        self._index_by_genre.setdefault(genre.value, []).append(story_id)
        
        # Tag indexing
        tags = metadata.get("tags", []) if metadata else []
        for tag in tags:
            self._index_by_tag.setdefault(tag, []).append(story_id)
        
        # Persist to database if session available
        if self._db_session:
            self._save_story_to_db(story_id, story_metadata, content)
        
        return story_id
    
    def get_story(self, story_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a story with metadata and content.
        
        Args:
            story_id: Story identifier
            
        Returns:
            Story data dictionary or None if not found
        """
        if story_id not in self._stories:
            # Try loading from database
            if self._db_session:
                self._load_story_from_db(story_id)
            else:
                return None
        
        if story_id not in self._stories:
            return None
        
        metadata = self._stories[story_id]
        content = self._contents.get(story_id, "")
        summary = self._summaries.get(story_id)
        
        return {
            "metadata": metadata.to_dict(),
            "content": content,
            "summary": summary.to_dict() if summary else None,
        }
    
    def get_story_metadata(self, story_id: str) -> Optional[StoryMetadata]:
        """
        Get story metadata only.
        
        Args:
            story_id: Story identifier
            
        Returns:
            StoryMetadata object or None
        """
        if story_id not in self._stories and self._db_session:
            self._load_story_from_db(story_id)
        
        return self._stories.get(story_id)
    
    def get_story_content(self, story_id: str) -> Optional[str]:
        """
        Get story content only.
        
        Args:
            story_id: Story identifier
            
        Returns:
            Story content or None
        """
        if story_id not in self._contents and self._db_session:
            self._load_story_content_from_db(story_id)
        
        return self._contents.get(story_id)
    
    def set_summary(self, story_id: str, summary: StorySummary) -> None:
        """
        Set AI-generated summary for a story.
        
        Args:
            story_id: Story identifier
            summary: StorySummary object
        """
        self._summaries[story_id] = summary
        
        if self._db_session:
            self._save_summary_to_db(story_id, summary)
    
    def get_summary(self, story_id: str) -> Optional[StorySummary]:
        """
        Get story summary.
        
        Args:
            story_id: Story identifier
            
        Returns:
            StorySummary object or None
        """
        if story_id not in self._summaries and self._db_session:
            self._load_summary_from_db(story_id)
        
        return self._summaries.get(story_id)
    
    def update_story(
        self,
        story_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Update a story.
        
        Args:
            story_id: Story identifier
            title: Optional new title
            content: Optional new content
            metadata: Optional new metadata
            
        Returns:
            True if update was successful
        """
        if story_id not in self._stories:
            if self._db_session:
                self._load_story_from_db(story_id)
            if story_id not in self._stories:
                return False
        
        story_metadata = self._stories[story_id]
        
        if title is not None:
            story_metadata.title = title
        
        if content is not None:
            self._contents[story_id] = content
            story_metadata.word_count = len(content.split())
        
        if metadata is not None:
            if "rating" in metadata:
                story_metadata.rating = metadata["rating"]
            if "is_favorite" in metadata:
                story_metadata.is_favorite = metadata["is_favorite"]
            if "is_public" in metadata:
                story_metadata.is_public = metadata["is_public"]
            if "tags" in metadata:
                story_metadata.tags = metadata["tags"]
            if "characters" in metadata:
                story_metadata.characters = metadata["characters"]
            story_metadata.metadata.update(metadata)
        
        story_metadata.updated_at = datetime.utcnow()
        
        if self._db_session:
            self._save_story_to_db(story_id, story_metadata, self._contents.get(story_id))
        
        return True
    
    def delete_story(self, story_id: str, user_id: Optional[str] = None) -> bool:
        """
        Delete a story.
        
        Args:
            story_id: Story identifier
            user_id: Optional user ID for verification
            
        Returns:
            True if deletion was successful
        """
        if story_id not in self._stories:
            return False
        
        # Verify ownership if user_id provided
        story = self._stories[story_id]
        if user_id and story.conversation_id:
            # Additional verification would happen here
            pass
        
        # Remove from indexes
        genre_key = story.genre.value if isinstance(story.genre, Enum) else str(story.genre)
        if genre_key in self._index_by_genre:
            self._index_by_genre[genre_key] = [
                sid for sid in self._index_by_genre[genre_key] if sid != story_id
            ]
        
        for tag in story.tags:
            if tag in self._index_by_tag:
                self._index_by_tag[tag] = [
                    sid for sid in self._index_by_tag[tag] if sid != story_id
                ]
        
        # Remove from user index
        if story.conversation_id:
            # Try to find user from conversation
            for uid, story_ids in self._index_by_user.items():
                if story_id in story_ids:
                    self._index_by_user[uid] = [sid for sid in story_ids if sid != story_id]
                    break
        
        # Remove data
        del self._stories[story_id]
        self._contents.pop(story_id, None)
        self._summaries.pop(story_id, None)
        
        if self._db_session:
            self._delete_story_from_db(story_id)
        
        return True
    
    def query_stories(self, query: StoryQuery) -> List[Dict[str, Any]]:
        """
        Query stories based on criteria.
        
        Args:
            query: StoryQuery object
            
        Returns:
            List of story data dictionaries
        """
        # Get candidate stories from user index
        story_ids = set(self._index_by_user.get(query.user_id, []))
        
        # Apply filters
        results = []
        for story_id in story_ids:
            if story_id not in self._stories:
                continue
            
            story = self._stories[story_id]
            
            # Filter by genre
            if query.genre:
                story_genre = story.genre.value if isinstance(story.genre, Enum) else str(story.genre)
                if story_genre != query.genre.value:
                    continue
            
            # Filter by status
            if query.status:
                story_status = story.status.value if isinstance(story.status, Enum) else str(story.status)
                if story_status != query.status.value:
                    continue
            
            # Filter by favorite
            if query.is_favorite is not None:
                if story.is_favorite != query.is_favorite:
                    continue
            
            # Filter by public
            if query.is_public is not None:
                if story.is_public != query.is_public:
                    continue
            
            # Filter by rating
            if query.min_rating is not None:
                if story.rating is None or story.rating < query.min_rating:
                    continue
            
            # Filter by date range
            if query.date_from:
                if story.created_at < query.date_from:
                    continue
            
            if query.date_to:
                if story.created_at > query.date_to:
                    continue
            
            # Filter by tags
            if query.tags:
                if not any(tag in story.tags for tag in query.tags):
                    continue
            
            results.append({
                "metadata": story.to_dict(),
                "summary": self._summaries.get(story_id).to_dict() if story_id in self._summaries else None,
            })
        
        # Sort results
        sort_field = query.sort_by
        reverse = query.sort_order == "desc"
        
        def get_sort_key(item):
            metadata = item["metadata"]
            if sort_field == "created_at":
                return metadata.get("created_at", "")
            elif sort_field == "updated_at":
                return metadata.get("updated_at", "")
            elif sort_field == "rating":
                return metadata.get("rating") or 0
            elif sort_field == "word_count":
                return metadata.get("word_count", 0)
            return metadata.get("created_at", "")
        
        results.sort(key=get_sort_key, reverse=reverse)
        
        # Apply pagination
        return results[query.offset:query.offset + query.limit]
    
    def get_user_stories(
        self,
        user_id: str,
        limit: int = 20,
        include_favorites_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Get user's stories.
        
        Args:
            user_id: User identifier
            limit: Maximum number of stories
            include_favorites_only: Only return favorite stories
            
        Returns:
            List of story data dictionaries
        """
        query = StoryQuery(
            user_id=user_id,
            is_favorite=True if include_favorites_only else None,
            sort_by="updated_at",
            sort_order="desc",
            limit=limit,
        )
        
        return self.query_stories(query)
    
    def get_recent_stories(
        self,
        user_id: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Get user's most recent stories.
        
        Args:
            user_id: User identifier
            limit: Maximum number of stories
            
        Returns:
            List of recent story data dictionaries
        """
        query = StoryQuery(
            user_id=user_id,
            status=StoryStatus.COMPLETED,
            sort_by="updated_at",
            sort_order="desc",
            limit=limit,
        )
        
        return self.query_stories(query)
    
    def get_story_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get story statistics for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Statistics dictionary
        """
        story_ids = self._index_by_user.get(user_id, [])
        
        total_stories = len(story_ids)
        completed_stories = 0
        total_words = 0
        genres: Dict[str, int] = {}
        favorite_count = 0
        total_rating = 0
        rated_count = 0
        
        for story_id in story_ids:
            if story_id not in self._stories:
                continue
            
            story = self._stories[story_id]
            
            if story.status == StoryStatus.COMPLETED:
                completed_stories += 1
            
            total_words += story.word_count
            
            genre_key = story.genre.value if isinstance(story.genre, Enum) else str(story.genre)
            genres[genre_key] = genres.get(genre_key, 0) + 1
            
            if story.is_favorite:
                favorite_count += 1
            
            if story.rating is not None:
                total_rating += story.rating
                rated_count += 1
        
        return {
            "total_stories": total_stories,
            "completed_stories": completed_stories,
            "total_words": total_words,
            "average_words_per_story": total_words / total_stories if total_stories > 0 else 0,
            "genres": genres,
            "favorite_count": favorite_count,
            "average_rating": total_rating / rated_count if rated_count > 0 else None,
            "rated_count": rated_count,
        }
    
    # Database integration methods
    
    def _save_story_to_db(self, story_id: str, metadata: StoryMetadata, content: Optional[str]) -> None:
        """Save story to database."""
        pass
    
    def _load_story_from_db(self, story_id: str) -> None:
        """Load story from database."""
        pass
    
    def _load_story_content_from_db(self, story_id: str) -> None:
        """Load story content from database."""
        pass
    
    def _save_summary_to_db(self, story_id: str, summary: StorySummary) -> None:
        """Save summary to database."""
        pass
    
    def _load_summary_from_db(self, story_id: str) -> None:
        """Load summary from database."""
        pass
    
    def _delete_story_from_db(self, story_id: str) -> None:
        """Delete story from database."""
        pass
