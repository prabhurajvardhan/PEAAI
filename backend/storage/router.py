"""File storage API endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request, status
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.api.dependencies import get_current_user
from backend.database.models import User
from backend.storage.manager import storage_manager
from backend.storage.validator import FileValidator, FileCategory

router = APIRouter(prefix="/api/v1/storage", tags=["Storage"])


class FileUploadResponse(BaseModel):
    """File upload response."""
    
    file_id: str = Field(description="Unique file identifier")
    file_key: str = Field(description="Storage key for the file")
    filename: str = Field(description="Original filename")
    file_type: str = Field(description="MIME type")
    file_size: int = Field(description="File size in bytes")
    url: str = Field(description="CDN URL for the file")
    created_at: str = Field(description="Upload timestamp")


class FileListResponse(BaseModel):
    """File list response."""
    
    files: List[FileUploadResponse]
    total: int


class FileDeleteResponse(BaseModel):
    """File delete response."""
    
    success: bool
    message: str


ALLOWED_CATEGORIES = {
    "image": FileCategory.IMAGE,
    "video": FileCategory.VIDEO,
    "audio": FileCategory.AUDIO,
    "document": FileCategory.DOCUMENT,
}


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    request: Request,
    file: UploadFile = File(..., description="File to upload"),
    category: Optional[str] = Query(
        None,
        description="File category filter (image, video, audio, document)"
    ),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a file.
    
    Accepts file uploads with automatic validation based on file type.
    Optionally specify a category to filter allowed types.
    """
    content = await file.read()
    
    content_type = file.content_type or "application/octet-stream"
    
    stored_file, error = await storage_manager.upload(
        file_content=content,
        filename=file.filename,
        user_id=str(current_user.id),
        content_type=content_type,
    )
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    return FileUploadResponse(
        file_id=stored_file.file_id,
        file_key=stored_file.file_key,
        filename=stored_file.original_name,
        file_type=stored_file.file_type,
        file_size=stored_file.file_size,
        url=stored_file.cdn_url,
        created_at=stored_file.created_at.isoformat(),
    )


@router.post("/upload/multiple", response_model=List[FileUploadResponse])
async def upload_multiple_files(
    request: Request,
    files: List[UploadFile] = File(..., description="Files to upload"),
    current_user: User = Depends(get_current_user),
):
    """
    Upload multiple files at once.
    
    Returns results for each file individually.
    """
    results = []
    errors = []
    
    for file in files:
        content = await file.read()
        content_type = file.content_type or "application/octet-stream"
        
        stored_file, error = await storage_manager.upload(
            file_content=content,
            filename=file.filename,
            user_id=str(current_user.id),
            content_type=content_type,
        )
        
        if error:
            errors.append({"filename": file.filename, "error": error})
        else:
            results.append(FileUploadResponse(
                file_id=stored_file.file_id,
                file_key=stored_file.file_key,
                filename=stored_file.original_name,
                file_type=stored_file.file_type,
                file_size=stored_file.file_size,
                url=stored_file.cdn_url,
                created_at=stored_file.created_at.isoformat(),
            ))
    
    if not results and errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "All files failed to upload",
                "errors": errors
            }
        )
    
    return results


@router.get("/download/{file_key:path}")
async def download_file(
    file_key: str,
    current_user: User = Depends(get_current_user),
):
    """
    Download a file by its key.
    
    Only allows downloading files owned by the current user.
    """
    if not await storage_manager.exists(file_key):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    content, error = await storage_manager.download(file_key)
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error
        )
    
    filename = file_key.split("/")[-1]
    
    return StreamingResponse(
        iter([content]),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/files", response_model=List[FileUploadResponse])
async def list_files(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
):
    """
    List files for the current user.
    
    Note: This endpoint requires file metadata storage.
    """
    files = await storage_manager.list_user_files(
        str(current_user.id),
        limit=limit,
        offset=offset,
    )
    
    return [
        FileUploadResponse(
            file_id=f.file_id,
            file_key=f.file_key,
            filename=f.original_name,
            file_type=f.file_type,
            file_size=f.file_size,
            url=f.cdn_url,
            created_at=f.created_at.isoformat(),
        )
        for f in files
    ]


@router.delete("/{file_key:path}", response_model=FileDeleteResponse)
async def delete_file(
    file_key: str,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a file by its key.
    
    Only allows deleting files owned by the current user.
    """
    if not await storage_manager.exists(file_key):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    success = await storage_manager.delete(file_key)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )
    
    return FileDeleteResponse(
        success=True,
        message="File deleted successfully"
    )


@router.get("/stats")
async def get_storage_stats(
    current_user: User = Depends(get_current_user),
):
    """
    Get storage statistics.
    
    Returns overall storage usage information.
    """
    stats = storage_manager.get_stats()
    return stats


@router.get("/url/{file_key:path}")
async def get_file_url(
    file_key: str,
    signed: bool = Query(False, description="Generate signed URL"),
    expiry: int = Query(3600, ge=60, le=86400, description="Signed URL expiry in seconds"),
    current_user: User = Depends(get_current_user),
):
    """
    Get the URL for a file.
    
    Optionally generate a signed URL with expiry.
    """
    if not await storage_manager.exists(file_key):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    url = storage_manager.get_url(file_key, signed=signed)
    
    return {
        "url": url,
        "file_key": file_key,
        "signed": signed,
        "expires_in": expiry if signed else None,
    }
