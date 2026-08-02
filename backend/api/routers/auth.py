"""Authentication API endpoints."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.database import SessionLocal
from backend.database.models import User
from backend.api.dependencies import get_db, get_current_user
from backend.api.schemas.user import UserResponse
from backend.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    verify_token,
    create_password_reset_token,
)
from backend.auth.password import verify_password, hash_password, is_password_strong

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    email: EmailStr = Field(description="User email address")
    username: str = Field(min_length=3, max_length=100, description="Username")
    password: str = Field(min_length=8, max_length=128, description="Password")
    display_name: Optional[str] = Field(default=None, max_length=200, description="Display name")


class LoginRequest(BaseModel):
    """Request schema for user login."""
    email: EmailStr = Field(description="User email address")
    password: str = Field(description="Password")


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""
    access_token: str = Field(description="JWT access token")
    refresh_token: str = Field(description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Access token expiration in seconds")


class RefreshRequest(BaseModel):
    """Request schema for token refresh."""
    refresh_token: str = Field(description="JWT refresh token")


class PasswordResetRequest(BaseModel):
    """Request schema for password reset request."""
    email: EmailStr = Field(description="User email address")


class PasswordResetConfirmRequest(BaseModel):
    """Request schema for password reset confirmation."""
    token: str = Field(description="Password reset token")
    new_password: str = Field(min_length=8, max_length=128, description="New password")


class UserProfileResponse(BaseModel):
    """Response schema for authenticated user profile."""
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    registration: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new user account.
    
    - **email**: Valid email address (must be unique)
    - **username**: Unique username (3-100 characters)
    - **password**: Password (minimum 8 characters with uppercase, lowercase, and digit)
    - **display_name**: Optional display name
    """
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == registration.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == registration.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Validate password strength
    if not is_password_strong(registration.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 8 characters with uppercase, lowercase, and digit"
        )
    
    # Create new user
    user = User(
        email=registration.email,
        username=registration.username,
        display_name=registration.display_name,
    )
    user.set_password(registration.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return UserProfileResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800  # 30 minutes
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user and return JWT tokens.
    
    - **email**: User's email address
    - **password**: User's password
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not user.verify_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=1800  # 30 minutes
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
):
    """
    Log out the current user.
    
    Note: Since JWT tokens are stateless, this endpoint is primarily
    for client-side token cleanup. Server-side token invalidation
    would require a token blacklist (not implemented in this version).
    """
    return None


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid JWT refresh token
    """
    try:
        payload = verify_token(refresh_data.refresh_token, "refresh")
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Generate new tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=1800
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


@router.post("/password-reset", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    request: Request,
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    """
    Request a password reset.
    
    Sends a password reset token to the user's email.
    Always returns 202 to prevent email enumeration attacks.
    
    - **email**: User's email address
    """
    user = db.query(User).filter(User.email == reset_request.email).first()
    
    # Always return 202 to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = create_password_reset_token(user.email)
    
    # TODO: Send email with reset token
    # For now, we'll log it (in production, use a proper email service)
    print(f"Password reset token for {user.email}: {reset_token}")
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
async def confirm_password_reset(
    request: Request,
    reset_confirm: PasswordResetConfirmRequest,
    db: Session = Depends(get_db),
):
    """
    Confirm password reset with token.
    
    - **token**: Password reset token from email
    - **new_password**: New password (must meet strength requirements)
    """
    try:
        payload = verify_token(reset_confirm.token, "password_reset")
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate new password
        if not is_password_strong(reset_confirm.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least 8 characters with uppercase, lowercase, and digit"
            )
        
        # Update password
        user.hashed_password = hash_password(reset_confirm.new_password)
        user.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Password successfully reset"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )


@router.get("/me", response_model=UserResponse)
async def get_authenticated_user(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current authenticated user's profile.
    """
    return UserResponse.model_validate(current_user)
