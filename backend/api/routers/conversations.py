"""Conversation API endpoints."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.database.models import User, Conversation, Message
from backend.api.schemas import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationListResponse,
    MessageCreate,
    MessageResponseSchema,
    MessageListResponse,
)
from backend.api.dependencies import get_db, get_current_user
from backend.api.middleware import add_rate_limit_headers

router = APIRouter(prefix="/api/v1/conversations", tags=["Conversations"])


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    request: Request,
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum records to return"),
    mode: Optional[str] = Query(default=None, description="Filter by mode"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List conversations for the current user.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **mode**: Optional filter by conversation mode (companion/story)
    - **is_active**: Optional filter by active status
    """
    query = db.query(Conversation).filter(Conversation.user_id == str(current_user.id))
    
    if mode:
        query = query.filter(Conversation.mode == mode)
    if is_active is not None:
        query = query.filter(Conversation.is_active == is_active)
    
    total = query.count()
    conversations = query.options(
        joinedload(Conversation.messages)
    ).offset(skip).limit(limit).all()
    
    response = ConversationListResponse(
        items=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + len(conversations)) < total
    )
    
    add_rate_limit_headers(request, response)
    return response


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new conversation.
    """
    db_conversation = Conversation(
        user_id=str(current_user.id),
        title=conversation.title,
        mode=conversation.mode.value,
    )
    
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    
    return ConversationResponse.model_validate(db_conversation)


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a conversation by ID.
    
    - **conversation_id**: UUID of the conversation
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == str(current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return ConversationResponse.model_validate(conversation)


@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    conversation_update: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a conversation.
    
    - **conversation_id**: UUID of the conversation to update
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == str(current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    update_data = conversation_update.model_dump(exclude_unset=True)
    if "mode" in update_data and update_data["mode"]:
        update_data["mode"] = update_data["mode"].value
    
    for field, value in update_data.items():
        setattr(conversation, field, value)
    
    if conversation_update.is_active is False and conversation.is_active:
        conversation.ended_at = datetime.utcnow()
    
    db.commit()
    db.refresh(conversation)
    
    return ConversationResponse.model_validate(conversation)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a conversation and all its messages.
    
    - **conversation_id**: UUID of the conversation to delete
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == str(current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    db.delete(conversation)
    db.commit()
    
    return None


# Message endpoints nested under conversations
@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
async def list_messages(
    request: Request,
    conversation_id: str,
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum records to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List messages in a conversation.
    
    - **conversation_id**: UUID of the conversation
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    # Verify conversation ownership
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == str(current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    total = query.count()
    messages = query.order_by(Message.sequence_number).offset(skip).limit(limit).all()
    
    response = MessageListResponse(
        items=[MessageResponseSchema.model_validate(m) for m in messages],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + len(messages)) < total
    )
    
    add_rate_limit_headers(request, response)
    return response


@router.post("/{conversation_id}/messages", response_model=MessageResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_message(
    conversation_id: str,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new message in a conversation.
    
    - **conversation_id**: UUID of the conversation
    """
    # Verify conversation ownership
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == str(current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get next sequence number
    last_message = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.sequence_number.desc()).first()
    
    next_sequence = (last_message.sequence_number + 1) if last_message else 1
    
    db_message = Message(
        conversation_id=conversation_id,
        role=message.role.value,
        content=message.content,
        sequence_number=next_sequence,
    )
    
    db.add(db_message)
    
    # Update conversation
    conversation.message_count += 1
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_message)
    
    return MessageResponseSchema.model_validate(db_message)


@router.get("/{conversation_id}/messages/{message_id}", response_model=MessageResponseSchema)
async def get_message(
    conversation_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific message.
    
    - **conversation_id**: UUID of the conversation
    - **message_id**: UUID of the message
    """
    # Verify conversation ownership
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == str(current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.conversation_id == conversation_id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return MessageResponseSchema.model_validate(message)


@router.delete("/{conversation_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    conversation_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a message.
    
    - **conversation_id**: UUID of the conversation
    - **message_id**: UUID of the message to delete
    """
    # Verify conversation ownership
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == str(current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.conversation_id == conversation_id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    db.delete(message)
    
    # Update conversation message count
    conversation.message_count = max(0, conversation.message_count - 1)
    
    db.commit()
    
    return None
