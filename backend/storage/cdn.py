"""CDN integration for file delivery."""
import hashlib
import logging
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from urllib.parse import urljoin

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.api.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CDNManager:
    """
    Manages CDN integration for file delivery.
    
    Supports local storage with CDN URL generation,
    with extensibility for cloud storage providers.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        storage_path: Optional[str] = None,
    ):
        """
        Initialize the CDN manager.
        
        Args:
            base_url: Base URL for CDN (e.g., https://cdn.example.com)
            storage_path: Local storage path for files
        """
        self.base_url = base_url or settings.CDN_BASE_URL if hasattr(settings, 'CDN_BASE_URL') else ""
        self.storage_path = storage_path or settings.STORAGE_PATH if hasattr(settings, 'STORAGE_PATH') else "./storage"
        
        self._ensure_storage_dir()

    def _ensure_storage_dir(self) -> None:
        """Create storage directory if it doesn't exist."""
        if not os.path.isabs(self.storage_path):
            base_path = path(__file__).parent.parent.parent
            self.storage_path = os.path.join(base_path, self.storage_path)
        
        os.makedirs(self.storage_path, exist_ok=True)

    def generate_file_key(self, user_id: str, filename: str) -> str:
        """
        Generate a unique file key for storage.
        
        Args:
            user_id: User identifier
            filename: Original filename
        
        Returns:
            Unique file key/path
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        hash_input = f"{user_id}:{filename}:{timestamp}"
        file_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:12]
        
        ext = os.path.splitext(filename)[1]
        unique_name = f"{timestamp}_{file_hash}{ext}"
        
        return f"users/{user_id}/{unique_name}"

    def get_local_path(self, file_key: str) -> str:
        """
        Get the local filesystem path for a file key.
        
        Args:
            file_key: File key
        
        Returns:
            Absolute filesystem path
        """
        return os.path.join(self.storage_path, file_key)

    def get_cdn_url(self, file_key: str, expiry_seconds: int = 3600) -> str:
        """
        Generate a CDN URL for a file.
        
        Args:
            file_key: File key
            expiry_seconds: URL expiry for signed URLs (if applicable)
        
        Returns:
            CDN URL
        """
        if not self.base_url:
            return f"/storage/{file_key}"
        
        return urljoin(self.base_url, f"/{file_key}")

    def get_signed_url(
        self,
        file_key: str,
        expiry_seconds: int = 3600,
        secret_key: Optional[str] = None,
    ) -> str:
        """
        Generate a signed URL for secure access.
        
        Args:
            file_key: File key
            expiry_seconds: URL expiry time
            secret_key: Secret key for signing
        
        Returns:
            Signed URL
        """
        if not self.base_url:
            return f"/storage/{file_key}?expires={expiry_seconds}"
        
        expires = int((datetime.utcnow() + timedelta(seconds=expiry_seconds)).timestamp())
        
        secret = secret_key or settings.SECRET_KEY
        
        signature_base = f"{file_key}:{expires}:{secret}"
        signature = hashlib.sha256(signature_base.encode()).hexdigest()[:32]
        
        base_url = self.get_cdn_url(file_key)
        return f"{base_url}?expires={expires}&signature={signature}"

    def parse_signed_url(self, url: str, secret_key: Optional[str] = None) -> Optional[Dict]:
        """
        Parse and validate a signed URL.
        
        Args:
            url: Signed URL
            secret_key: Secret key for validation
        
        Returns:
            Parsed data if valid, None otherwise
        """
        try:
            from urllib.parse import urlparse, parse_qs
            
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            
            file_key = parsed.path.lstrip("/")
            expires = int(params.get("expires", [0])[0])
            signature = params.get("signature", [""])[0]
            
            if expires < int(datetime.utcnow().timestamp()):
                logger.warning("Signed URL expired")
                return None
            
            secret = secret_key or settings.SECRET_KEY
            signature_base = f"{file_key}:{expires}:{secret}"
            expected_signature = hashlib.sha256(signature_base.encode()).hexdigest()[:32]
            
            if signature != expected_signature:
                logger.warning("Invalid signature")
                return None
            
            return {
                "file_key": file_key,
                "expires": expires,
            }
            
        except Exception as e:
            logger.error(f"Error parsing signed URL: {e}")
            return None

    def is_cdn_configured(self) -> bool:
        """Check if CDN is properly configured."""
        return bool(self.base_url)

    def get_storage_stats(self) -> Dict:
        """Get storage statistics."""
        total_files = 0
        total_size = 0
        
        for root, dirs, files in os.walk(self.storage_path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    total_size += os.path.getsize(file_path)
                    total_files += 1
                except OSError:
                    pass
        
        return {
            "storage_path": self.storage_path,
            "base_url": self.base_url,
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
        }


cdn_manager = CDNManager()
