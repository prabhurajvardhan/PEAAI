"""
Story Storage - Handles low-level storage operations for stories.

Provides:
- Efficient story storage and retrieval
- Content chunking for large stories
- Version history support
- Storage analytics
"""

from typing import Dict, List, Optional, Any, Iterator
from dataclasses import dataclass
from datetime import datetime
import json
import uuid


@dataclass
class StoryChunk:
    """A chunk of story content for large stories."""
    
    chunk_id: str
    story_id: str
    chunk_index: int
    content: str
    char_start: int
    char_end: int
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert chunk to dictionary."""
        return {
            "chunk_id": self.chunk_id,
            "story_id": self.story_id,
            "chunk_index": self.chunk_index,
            "content": self.content,
            "char_start": self.char_start,
            "char_end": self.char_end,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class StoryVersion:
    """Version record for story history."""
    
    version_id: str
    story_id: str
    version_number: int
    content: str
    summary: Optional[str]
    created_at: datetime
    change_description: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert version to dictionary."""
        return {
            "version_id": self.version_id,
            "story_id": self.story_id,
            "version_number": self.version_number,
            "content": self.content,
            "summary": self.summary,
            "created_at": self.created_at.isoformat(),
            "change_description": self.change_description,
        }


@dataclass
class StorageStats:
    """Storage statistics for a user."""
    
    user_id: str
    total_stories: int
    total_size_bytes: int
    average_story_size_bytes: int
    largest_story_size_bytes: int
    storage_used_percent: float
    chunk_count: int
    version_count: int
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert stats to dictionary."""
        return {
            "user_id": self.user_id,
            "total_stories": self.total_stories,
            "total_size_bytes": self.total_size_bytes,
            "average_story_size_bytes": self.average_story_size_bytes,
            "largest_story_size_bytes": self.largest_story_size_bytes,
            "storage_used_percent": self.storage_used_percent,
            "chunk_count": self.chunk_count,
            "version_count": self.version_count,
        }


class StoryStorage:
    """
    Low-level story storage manager.
    
    Handles:
    - Story content storage
    - Chunking for large stories
    - Version history
    - Storage analytics
    """
    
    # Constants
    MAX_CHUNK_SIZE = 10000  # Characters per chunk
    MAX_STORAGE_BYTES = 100 * 1024 * 1024  # 100 MB default limit
    MAX_VERSIONS_PER_STORY = 10
    
    def __init__(self, max_storage_bytes: int = MAX_STORAGE_BYTES):
        """
        Initialize story storage.
        
        Args:
            max_storage_bytes: Maximum storage allowed per user
        """
        self._max_storage = max_storage_bytes
        
        # In-memory storage (would be database in production)
        self._content: Dict[str, str] = {}
        self._chunks: Dict[str, List[StoryChunk]] = {}
        self._versions: Dict[str, List[StoryVersion]] = {}
        self._storage_used: Dict[str, int] = {}  # user_id -> bytes used
        
        # Indexes
        self._story_metadata: Dict[str, Dict[str, Any]] = {}
        self._user_stories: Dict[str, List[str]] = {}
    
    def store(
        self,
        user_id: str,
        story_id: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Store story content.
        
        Args:
            user_id: User identifier
            story_id: Story identifier
            content: Story content
            metadata: Optional metadata
            
        Returns:
            True if storage was successful
        """
        content_size = len(content.encode('utf-8'))
        
        # Check storage limit
        current_usage = self._storage_used.get(user_id, 0)
        if current_usage + content_size > self._max_storage:
            return False
        
        # Store content
        self._content[story_id] = content
        
        # Chunk if necessary
        if len(content) > self.MAX_CHUNK_SIZE:
            self._chunk_story(story_id, content)
        
        # Update storage tracking
        self._storage_used[user_id] = current_usage + content_size
        
        # Store metadata
        self._story_metadata[story_id] = {
            "user_id": user_id,
            "story_id": story_id,
            "content_size": content_size,
            "chunked": len(content) > self.MAX_CHUNK_SIZE,
            "created_at": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }
        
        # Update user index
        self._user_stories.setdefault(user_id, []).append(story_id)
        
        return True
    
    def retrieve(self, story_id: str) -> Optional[str]:
        """
        Retrieve story content.
        
        Args:
            story_id: Story identifier
            
        Returns:
            Story content or None if not found
        """
        # Check if story is chunked
        if story_id in self._chunks:
            return self._reconstruct_from_chunks(story_id)
        
        return self._content.get(story_id)
    
    def retrieve_chunk(
        self,
        story_id: str,
        chunk_index: int,
    ) -> Optional[StoryChunk]:
        """
        Retrieve a specific chunk of a story.
        
        Args:
            story_id: Story identifier
            chunk_index: Index of chunk to retrieve
            
        Returns:
            StoryChunk or None if not found
        """
        chunks = self._chunks.get(story_id, [])
        if 0 <= chunk_index < len(chunks):
            return chunks[chunk_index]
        return None
    
    def get_chunks(self, story_id: str) -> List[StoryChunk]:
        """
        Get all chunks for a story.
        
        Args:
            story_id: Story identifier
            
        Returns:
            List of StoryChunks
        """
        return self._chunks.get(story_id, [])
    
    def iter_chunks(self, story_id: str) -> Iterator[StoryChunk]:
        """
        Iterate over story chunks.
        
        Args:
            story_id: Story identifier
            
        Yields:
            StoryChunks
        """
        chunks = self._chunks.get(story_id, [])
        for chunk in chunks:
            yield chunk
    
    def delete(self, story_id: str) -> bool:
        """
        Delete story content.
        
        Args:
            story_id: Story identifier
            
        Returns:
            True if deletion was successful
        """
        if story_id not in self._content:
            return False
        
        # Get metadata for storage calculation
        metadata = self._story_metadata.get(story_id, {})
        user_id = metadata.get("user_id")
        content_size = metadata.get("content_size", 0)
        
        # Remove content
        del self._content[story_id]
        
        # Remove chunks
        if story_id in self._chunks:
            del self._chunks[story_id]
        
        # Remove versions
        if story_id in self._versions:
            del self._versions[story_id]
        
        # Update storage tracking
        if user_id:
            current = self._storage_used.get(user_id, 0)
            self._storage_used[user_id] = max(0, current - content_size)
            
            # Remove from user index
            if user_id in self._user_stories:
                self._user_stories[user_id] = [
                    sid for sid in self._user_stories[user_id] if sid != story_id
                ]
        
        # Remove metadata
        if story_id in self._story_metadata:
            del self._story_metadata[story_id]
        
        return True
    
    def store_version(
        self,
        story_id: str,
        content: str,
        summary: Optional[str] = None,
        change_description: Optional[str] = None,
    ) -> Optional[StoryVersion]:
        """
        Store a new version of a story.
        
        Args:
            story_id: Story identifier
            content: Version content
            summary: Optional version summary
            change_description: Optional description of changes
            
        Returns:
            StoryVersion or None if limit reached
        """
        # Get existing versions
        versions = self._versions.setdefault(story_id, [])
        
        # Check version limit
        if len(versions) >= self.MAX_VERSIONS_PER_STORY:
            # Remove oldest version
            versions.pop(0)
        
        # Create new version
        version = StoryVersion(
            version_id=str(uuid.uuid4()),
            story_id=story_id,
            version_number=len(versions) + 1,
            content=content,
            summary=summary,
            created_at=datetime.utcnow(),
            change_description=change_description,
        )
        
        versions.append(version)
        return version
    
    def get_versions(
        self,
        story_id: str,
        limit: Optional[int] = None,
    ) -> List[StoryVersion]:
        """
        Get versions for a story.
        
        Args:
            story_id: Story identifier
            limit: Optional limit on number of versions
            
        Returns:
            List of StoryVersions (newest first)
        """
        versions = self._versions.get(story_id, [])
        if limit:
            return versions[-limit:]
        return versions
    
    def get_version(
        self,
        story_id: str,
        version_number: int,
    ) -> Optional[StoryVersion]:
        """
        Get a specific version.
        
        Args:
            story_id: Story identifier
            version_number: Version number
            
        Returns:
            StoryVersion or None
        """
        versions = self._versions.get(story_id, [])
        for version in versions:
            if version.version_number == version_number:
                return version
        return None
    
    def get_storage_stats(self, user_id: str) -> StorageStats:
        """
        Get storage statistics for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            StorageStats object
        """
        story_ids = self._user_stories.get(user_id, [])
        
        total_size = 0
        largest_size = 0
        chunk_count = 0
        version_count = 0
        
        for story_id in story_ids:
            metadata = self._story_metadata.get(story_id, {})
            size = metadata.get("content_size", 0)
            total_size += size
            largest_size = max(largest_size, size)
            
            if story_id in self._chunks:
                chunk_count += len(self._chunks[story_id])
            
            if story_id in self._versions:
                version_count += len(self._versions[story_id])
        
        avg_size = total_size / len(story_ids) if story_ids else 0
        
        return StorageStats(
            user_id=user_id,
            total_stories=len(story_ids),
            total_size_bytes=total_size,
            average_story_size_bytes=avg_size,
            largest_story_size_bytes=largest_size,
            storage_used_percent=(total_size / self._max_storage) * 100 if self._max_storage > 0 else 0,
            chunk_count=chunk_count,
            version_count=version_count,
        )
    
    def get_storage_remaining(self, user_id: str) -> int:
        """
        Get remaining storage for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Remaining bytes
        """
        used = self._storage_used.get(user_id, 0)
        return max(0, self._max_storage - used)
    
    def clear_user_storage(self, user_id: str) -> int:
        """
        Clear all storage for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of stories deleted
        """
        story_ids = self._user_stories.get(user_id, [])
        
        for story_id in story_ids:
            self.delete(story_id)
        
        return len(story_ids)
    
    def _chunk_story(self, story_id: str, content: str) -> List[StoryChunk]:
        """
        Split story into chunks.
        
        Args:
            story_id: Story identifier
            content: Story content
            
        Returns:
            List of StoryChunks
        """
        chunks = []
        chunk_size = self.MAX_CHUNK_SIZE
        
        for i in range(0, len(content), chunk_size):
            chunk_content = content[i:i + chunk_size]
            chunk = StoryChunk(
                chunk_id=str(uuid.uuid4()),
                story_id=story_id,
                chunk_index=i // chunk_size,
                content=chunk_content,
                char_start=i,
                char_end=i + len(chunk_content),
                created_at=datetime.utcnow(),
            )
            chunks.append(chunk)
        
        self._chunks[story_id] = chunks
        return chunks
    
    def _reconstruct_from_chunks(self, story_id: str) -> Optional[str]:
        """
        Reconstruct story from chunks.
        
        Args:
            story_id: Story identifier
            
        Returns:
            Reconstructed content or None
        """
        chunks = self._chunks.get(story_id)
        if not chunks:
            return None
        
        # Sort by index and join
        sorted_chunks = sorted(chunks, key=lambda c: c.chunk_index)
        return "".join(chunk.content for chunk in sorted_chunks)
    
    def export_stories(
        self,
        user_id: str,
        format: str = "json",
    ) -> str:
        """
        Export all stories for a user.
        
        Args:
            user_id: User identifier
            format: Export format ("json" or "text")
            
        Returns:
            Exported data as string
        """
        story_ids = self._user_stories.get(user_id, [])
        stories_data = []
        
        for story_id in story_ids:
            content = self.retrieve(story_id)
            if content:
                metadata = self._story_metadata.get(story_id, {}).copy()
                metadata.pop("user_id", None)
                
                stories_data.append({
                    "story_id": story_id,
                    "content": content,
                    "metadata": metadata,
                    "versions": [v.to_dict() for v in self.get_versions(story_id)],
                })
        
        if format == "json":
            return json.dumps(stories_data, indent=2)
        elif format == "text":
            # Simple text format
            lines = []
            for story in stories_data:
                lines.append(f"=== {story['metadata'].get('title', 'Untitled')} ===")
                lines.append(f"ID: {story['story_id']}")
                lines.append(f"Content:\n{story['content']}")
                lines.append("")
            return "\n".join(lines)
        
        return json.dumps(stories_data)
