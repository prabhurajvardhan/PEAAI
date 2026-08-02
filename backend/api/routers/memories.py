"""Memory API endpoints."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.database.models import User, Memory
from backend.api.schemas import (
    MemoryCreate,
    MemoryUpdate,
    MemoryResponse,
    MemoryListResponse,
)
from backend.api.dependencies import get_db, get_current_user
from backend.api.middleware import add_rate_limit_headers

router = APIRouter(prefix="/api/v1/memories", tags=["Memories"])


@router.get("", response_model=MemoryListResponse)
async def list_memories(
    request: Request,
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum records to return"),
    memory_type: Optional[str] = Query(default=None, description="Filter by memory type"),
    importance: Optional[str] = Query(default=None, description="Filter by importance level"),
    is_pinned: Optional[bool] = Query(default=None, description="Filter by pinned status"),
    is_active: Optional[bool] = Query(default=True, description="Filter by active status"),
    conversation_id: Optional[str] = Query(default=None, description="Filter by conversation"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List memories for the current user.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **memory_type**: Optional filter by memory type
    - **importance**: Optional filter by importance level
    - **is_pinned**: Optional filter by pinned status
    - **is_active**: Optional filter by active status
    - **conversation_id**: Optional filter by conversation
    """
    query = db.query(Memory).filter(Memory.user_id == str(current_user.id))
    
    if memory_type:
        query = query.filter(Memory.memory_type == memory_type)
    if importance:
        query = query.filter(Memory.importance == importance)
    if is_pinned is not None:
        query = query.filter(Memory.is_pinned == is_pinned)
    if is_active is not None:
        query = query.filter(Memory.is_active == is_active)
    if conversation_id:
        query = query.filter(Memory.conversation_id == conversation_id)
    
    # Order by pinned first, then by relevance score
    query = query.order_by(Memory.is_pinned.desc(), Memory.relevance_score.desc())
    
    total = query.count()
    memories = query.offset(skip).limit(limit).all()
    
    response = MemoryListResponse(
        items=[MemoryResponse.model_validate(m) for m in memories],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + len(memories)) < total
    )
    
    add_rate_limit_headers(request, response)
    return response


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    memory: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new memory.
    """
    db_memory = Memory(
        user_id=str(current_user.id),
        conversation_id=memory.conversation_id,
        memory_type=memory.memory_type.value,
        importance=memory.importance.value,
        content=memory.content,
        summary=memory.summary,
        is_pinned=memory.is_pinned,
        tags=memory.tags,
        meta=memory.metadata,
    )
    
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    
    return MemoryResponse.model_validate(db_memory)


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a memory by ID.
    
    - **memory_id**: UUID of the memory
    """
    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == str(current_user.id)
    ).first()
    
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    # Update access tracking
    memory.access_count += 1
    memory.last_accessed = datetime.utcnow()
    db.commit()
    
    return MemoryResponse.model_validate(memory)


@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    memory_update: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a memory.
    
    - **memory_id**: UUID of the memory to update
    """
    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == str(current_user.id)
    ).first()
    
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    update_data = memory_update.model_dump(exclude_unset=True)
    
    # Handle enum values and field renames
    if "importance" in update_data and update_data["importance"]:
        update_data["importance"] = update_data["importance"].value
    # Handle metadata -> meta field rename
    if "metadata" in update_data:
        update_data["meta"] = update_data.pop("metadata")
    
    for field, value in update_data.items():
        setattr(memory, field, value)
    
    db.commit()
    db.refresh(memory)
    
    return MemoryResponse.model_validate(memory)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a memory.
    
    - **memory_id**: UUID of the memory to delete
    """
    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == str(current_user.id)
    ).first()
    
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    db.delete(memory)
    db.commit()
    
    return None


@router.post("/{memory_id}/pin", response_model=MemoryResponse)
async def toggle_memory_pin(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Toggle the pinned status of a memory.
    
    - **memory_id**: UUID of the memory
    """
    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == str(current_user.id)
    ).first()
    
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    memory.is_pinned = not memory.is_pinned
    db.commit()
    db.refresh(memory)
    
    return MemoryResponse.model_validate(memory)


@router.post("/{memory_id}/access", response_model=MemoryResponse)
async def record_memory_access(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record an access to a memory (for relevance tracking).
    
    - **memory_id**: UUID of the memory
    """
    memory = db.query(Memory).filter(
        Memory.id == memory_id,
        Memory.user_id == str(current_user.id)
    ).first()
    
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    memory.access_count += 1
    memory.last_accessed = datetime.utcnow()
    
    # Adjust relevance score based on access
    if memory.relevance_score < 1.0:
        memory.relevance_score = min(1.0, memory.relevance_score + 0.01)
    
    db.commit()
    db.refresh(memory)
    
    return MemoryResponse.model_validate(memory)
