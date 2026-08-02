"""File validation utilities."""
import mimetypes
from dataclasses import dataclass
from typing import List, Optional, Tuple
from enum import Enum


class ValidationError(Exception):
    """File validation error."""
    pass


class FileCategory(str, Enum):
    """File category types."""
    
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    OTHER = "other"


@dataclass
class FileValidationResult:
    """Result of file validation."""
    
    is_valid: bool
    file_type: str
    category: FileCategory
    errors: List[str]
    warnings: List[str]
    metadata: dict

    @classmethod
    def success(
        cls,
        file_type: str,
        category: FileCategory,
        metadata: Optional[dict] = None
    ) -> "FileValidationResult":
        """Create a successful validation result."""
        return cls(
            is_valid=True,
            file_type=file_type,
            category=category,
            errors=[],
            warnings=[],
            metadata=metadata or {},
        )

    @classmethod
    def failure(
        cls,
        errors: List[str],
        file_type: Optional[str] = None,
        category: FileCategory = FileCategory.OTHER,
    ) -> "FileValidationResult":
        """Create a failed validation result."""
        return cls(
            is_valid=False,
            file_type=file_type or "unknown",
            category=category,
            errors=errors,
            warnings=[],
            metadata={},
        )


class FileValidator:
    """
    Validates uploaded files for security and compliance.
    
    Checks file type, size, and content to ensure safe storage.
    """

    ALLOWED_IMAGE_TYPES = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
    }

    ALLOWED_VIDEO_TYPES = {
        "video/mp4",
        "video/webm",
        "video/ogg",
    }

    ALLOWED_AUDIO_TYPES = {
        "audio/mpeg",
        "audio/ogg",
        "audio/wav",
        "audio/webm",
    }

    ALLOWED_DOCUMENT_TYPES = {
        "application/pdf",
        "text/plain",
        "application/json",
        "application/xml",
        "text/html",
        "text/css",
        "text/javascript",
    }

    DEFAULT_MAX_SIZES = {
        FileCategory.IMAGE: 10 * 1024 * 1024,      # 10 MB
        FileCategory.VIDEO: 100 * 1024 * 1024,    # 100 MB
        FileCategory.AUDIO: 50 * 1024 * 1024,     # 50 MB
        FileCategory.DOCUMENT: 5 * 1024 * 1024,   # 5 MB
        FileCategory.OTHER: 1 * 1024 * 1024,      # 1 MB
    }

    DANGEROUS_EXTENSIONS = {
        ".exe", ".bat", ".cmd", ".msi", ".dll",
        ".sh", ".bash", ".zsh", ".ps1",
        ".php", ".phtml", ".phar",
        ".asp", ".aspx", ".jsp", ".jspx",
        ".cgi", ".pl", ".py",
        ".htaccess", ".htpasswd",
    }

    def __init__(
        self,
        max_sizes: Optional[dict] = None,
        allowed_types: Optional[dict] = None,
    ):
        """
        Initialize the file validator.
        
        Args:
            max_sizes: Max file sizes by category (bytes)
            allowed_types: Allowed MIME types by category
        """
        self.max_sizes = max_sizes or self.DEFAULT_MAX_SIZES
        self.allowed_types = allowed_types or {
            FileCategory.IMAGE: self.ALLOWED_IMAGE_TYPES,
            FileCategory.VIDEO: self.ALLOWED_VIDEO_TYPES,
            FileCategory.AUDIO: self.ALLOWED_AUDIO_TYPES,
            FileCategory.DOCUMENT: self.ALLOWED_DOCUMENT_TYPES,
        }

    def get_category(self, mime_type: str) -> FileCategory:
        """
        Determine file category from MIME type.
        
        Args:
            mime_type: MIME type string
        
        Returns:
            FileCategory enum value
        """
        if mime_type.startswith("image/"):
            return FileCategory.IMAGE
        elif mime_type.startswith("video/"):
            return FileCategory.VIDEO
        elif mime_type.startswith("audio/"):
            return FileCategory.AUDIO
        elif (
            mime_type.startswith("application/")
            or mime_type.startswith("text/")
        ):
            return FileCategory.DOCUMENT
        return FileCategory.OTHER

    def get_max_size(self, category: FileCategory) -> int:
        """Get max file size for a category."""
        return self.max_sizes.get(category, self.max_sizes[FileCategory.OTHER])

    def get_allowed_types(self, category: FileCategory) -> set:
        """Get allowed MIME types for a category."""
        return self.allowed_types.get(category, set())

    def validate_extension(self, filename: str) -> Tuple[bool, Optional[str]]:
        """
        Check if file extension is allowed and safe.
        
        Args:
            filename: Original filename
        
        Returns:
            Tuple of (is_safe, extension)
        """
        if not filename or "." not in filename:
            return False, None
        
        extension = "." + filename.rsplit(".", 1)[1].lower()
        
        if extension in self.DANGEROUS_EXTENSIONS:
            return False, extension
        
        return True, extension

    def validate_mime_type(self, mime_type: str) -> Tuple[bool, FileCategory]:
        """
        Validate MIME type and return category.
        
        Args:
            mime_type: MIME type string
        
        Returns:
            Tuple of (is_allowed, category)
        """
        category = self.get_category(mime_type)
        allowed = self.get_allowed_types(category)
        
        if allowed and mime_type not in allowed:
            return False, category
        
        return True, category

    def validate_size(self, size: int, category: FileCategory) -> bool:
        """
        Validate file size.
        
        Args:
            size: File size in bytes
            category: File category
        
        Returns:
            True if size is acceptable
        """
        return size <= self.get_max_size(category)

    async def validate(
        self,
        file_content: bytes,
        filename: str,
        content_type: Optional[str] = None,
    ) -> FileValidationResult:
        """
        Validate a file for upload.
        
        Args:
            file_content: File bytes
            filename: Original filename
            content_type: MIME type (optional, will be detected if not provided)
        
        Returns:
            FileValidationResult with validation outcome
        """
        errors = []
        warnings = []
        metadata = {}

        is_safe, extension = self.validate_extension(filename)
        if not is_safe:
            errors.append(f"Dangerous file extension: {extension}")
            return FileValidationResult.failure(errors)

        if not content_type:
            content_type, _ = mimetypes.guess_type(filename)
            if not content_type:
                content_type = "application/octet-stream"
                warnings.append("Could not detect MIME type, using generic type")

        is_allowed, category = self.validate_mime_type(content_type)
        if not is_allowed:
            errors.append(f"File type not allowed: {content_type}")
            return FileValidationResult.failure(errors, content_type, category)

        file_size = len(file_content)
        metadata["size"] = file_size
        metadata["extension"] = extension
        metadata["original_name"] = filename

        if not self.validate_size(file_size, category):
            max_size = self.get_max_size(category)
            errors.append(
                f"File too large: {file_size} bytes "
                f"(max: {max_size} bytes for {category.value})"
            )
            return FileValidationResult.failure(errors, content_type, category)

        if category == FileCategory.IMAGE:
            try:
                await self._validate_image(file_content, content_type)
            except ValidationError as e:
                errors.append(str(e))
                return FileValidationResult.failure(errors, content_type, category)

        return FileValidationResult.success(content_type, category, metadata)

    async def _validate_image(self, content: bytes, mime_type: str) -> None:
        """
        Validate image content matches declared type.
        
        Args:
            content: Image bytes
            mime_type: Declared MIME type
        
        Raises:
            ValidationError: If validation fails
        """
        if mime_type == "image/jpeg":
            if not content[:2] == b"\xff\xd8":
                raise ValidationError("JPEG magic bytes not found")

        elif mime_type == "image/png":
            if not content[:8] == b"\x89PNG\r\n\x1a\n":
                raise ValidationError("PNG magic bytes not found")

        elif mime_type == "image/gif":
            if not content[:6] in (b"GIF87a", b"GIF89a"):
                raise ValidationError("GIF magic bytes not found")


validator = FileValidator()


async def validate_file(
    file_content: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> FileValidationResult:
    """
    Convenience function to validate a file.
    
    Args:
        file_content: File bytes
        filename: Original filename
        content_type: MIME type
    
    Returns:
        FileValidationResult
    """
    return await validator.validate(file_content, filename, content_type)
