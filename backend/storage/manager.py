"""File storage management."""
import hashlib
import logging
import os
import aiofiles
from datetime import datetime
from pathlib import Path as path
from typing import Optional, BinaryIO, List
from dataclasses import dataclass
import uuid

import sys
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.storage.validator import FileValidator, validator, FileValidationResult
from backend.storage.cdn import CDNManager, cdn_manager

logger = logging.getLogger(__name__)


@dataclass
class StoredFile:
    """Metadata for a stored file."""
    
    file_id: str
    file_key: str
    user_id: str
    original_name: str
    stored_name: str
    file_type: str
    file_size: int
    cdn_url: str
    local_path: str
    created_at: datetime
    metadata: dict

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "file_id": self.file_id,
            "file_key": self.file_key,
            "user_id": self.user_id,
            "original_name": self.original_name,
            "stored_name": self.stored_name,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "cdn_url": self.cdn_url,
            "local_path": self.local_path,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata,
        }


class StorageManager:
    """
    Manages file storage operations.
    
    Handles file upload, download, deletion, and URL generation
    with validation and CDN integration.
    """

    def __init__(
        self,
        validator: Optional[FileValidator] = None,
        cdn: Optional[CDNManager] = None,
    ):
        """
        Initialize the storage manager.
        
        Args:
            validator: File validator instance
            cdn: CDN manager instance
        """
        self.validator = validator or validator
        self.cdn = cdn or cdn_manager

    async def upload(
        self,
        file_content: bytes,
        filename: str,
        user_id: str,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> tuple[Optional[StoredFile], Optional[str]]:
        """
        Upload a file.
        
        Args:
            file_content: File bytes
            filename: Original filename
            user_id: User identifier
            content_type: MIME type
            metadata: Additional metadata
        
        Returns:
            Tuple of (StoredFile if successful, error message if failed)
        """
        validation_result = await self.validator.validate(
            file_content, filename, content_type
        )
        
        if not validation_result.is_valid:
            error_msg = "; ".join(validation_result.errors)
            logger.warning(f"File validation failed for {filename}: {error_msg}")
            return None, error_msg

        file_id = str(uuid.uuid4())
        file_key = self.cdn.generate_file_key(user_id, filename)
        local_path = self.cdn.get_local_path(file_key)
        
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        try:
            async with aiofiles.open(local_path, "wb") as f:
                await f.write(file_content)
            
            cdn_url = self.cdn.get_cdn_url(file_key)
            
            stored_file = StoredFile(
                file_id=file_id,
                file_key=file_key,
                user_id=user_id,
                original_name=filename,
                stored_name=os.path.basename(file_key),
                file_type=validation_result.file_type,
                file_size=len(file_content),
                cdn_url=cdn_url,
                local_path=local_path,
                created_at=datetime.utcnow(),
                metadata=metadata or {},
            )
            
            stored_file.metadata.update(validation_result.metadata)
            
            logger.info(f"File uploaded: {file_id} for user {user_id}")
            
            return stored_file, None
            
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            
            if os.path.exists(local_path):
                try:
                    os.remove(local_path)
                except OSError:
                    pass
            
            return None, str(e)

    async def upload_stream(
        self,
        file_stream: BinaryIO,
        filename: str,
        user_id: str,
        content_type: Optional[str] = None,
        chunk_size: int = 8192,
    ) -> tuple[Optional[StoredFile], Optional[str]]:
        """
        Upload a file from a stream.
        
        Args:
            file_stream: File-like object
            filename: Original filename
            user_id: User identifier
            content_type: MIME type
            chunk_size: Read chunk size
        
        Returns:
            Tuple of (StoredFile if successful, error message if failed)
        """
        file_content = b""
        
        while True:
            chunk = file_stream.read(chunk_size)
            if not chunk:
                break
            file_content += chunk
        
        return await self.upload(
            file_content, filename, user_id, content_type
        )

    async def download(self, file_key: str) -> tuple[Optional[bytes], Optional[str]]:
        """
        Download a file.
        
        Args:
            file_key: File key
        
        Returns:
            Tuple of (file bytes if successful, error message if failed)
        """
        local_path = self.cdn.get_local_path(file_key)
        
        if not os.path.exists(local_path):
            return None, "File not found"
        
        try:
            async with aiofiles.open(local_path, "rb") as f:
                content = await f.read()
            return content, None
            
        except Exception as e:
            logger.error(f"Error downloading file: {e}")
            return None, str(e)

    async def delete(self, file_key: str) -> bool:
        """
        Delete a file.
        
        Args:
            file_key: File key
        
        Returns:
            True if deleted successfully
        """
        local_path = self.cdn.get_local_path(file_key)
        
        if not os.path.exists(local_path):
            return False
        
        try:
            os.remove(local_path)
            
            dir_path = os.path.dirname(local_path)
            if os.path.isdir(dir_path) and not os.listdir(dir_path):
                os.rmdir(dir_path)
            
            logger.info(f"File deleted: {file_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False

    async def exists(self, file_key: str) -> bool:
        """
        Check if a file exists.
        
        Args:
            file_key: File key
        
        Returns:
            True if file exists
        """
        local_path = self.cdn.get_local_path(file_key)
        return os.path.exists(local_path)

    def get_url(self, file_key: str, signed: bool = False) -> str:
        """
        Get the URL for a file.
        
        Args:
            file_key: File key
            signed: Generate signed URL
        
        Returns:
            File URL
        """
        if signed:
            return self.cdn.get_signed_url(file_key)
        return self.cdn.get_cdn_url(file_key)

    def get_stats(self) -> dict:
        """Get storage statistics."""
        return self.cdn.get_storage_stats()

    async def list_user_files(
        self,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> List[StoredFile]:
        """
        List files for a user (metadata only, not actual listing).
        
        Note: This requires a database to store file metadata.
        For now, returns an empty list.
        
        Args:
            user_id: User identifier
            limit: Max results
            offset: Offset for pagination
        
        Returns:
            List of stored files
        """
        return []


storage_manager = StorageManager()
