"""WebSocket endpoint router."""
import json
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

from backend.api.dependencies import get_db, verify_token
from backend.database.models import User
from backend.websocket.manager import ws_manager
from backend.websocket.handlers import MessageHandler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSocket"])


class WebSocketConnectionManager:
    """Manager for WebSocket connections with authentication."""

    def __init__(self):
        """Initialize the connection manager."""
        self.ws_manager = ws_manager
        self.message_handler = MessageHandler(self.ws_manager)

    async def authenticate_connection(
        self,
        websocket: WebSocket,
        token: Optional[str] = None,
        db: Optional[Session] = None
    ) -> tuple[str, Optional[str], Optional[str]]:
        """
        Authenticate a WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            token: Optional JWT token
            db: Optional database session
        
        Returns:
            Tuple of (user_id, connection_id, error_message)
        """
        if not token:
            return ("anonymous", str(uuid.uuid4()), None)
        
        try:
            payload = verify_token(token, "access")
            user_id = payload.get("sub")
            
            if not user_id:
                return ("anonymous", str(uuid.uuid4()), "Invalid token")
            
            if db:
                user = db.query(User).filter(User.id == user_id).first()
                if not user or not user.is_active:
                    return ("anonymous", str(uuid.uuid4()), "User not found or inactive")
            
            return (user_id, str(uuid.uuid4()), None)
            
        except Exception as e:
            logger.warning(f"WebSocket auth error: {e}")
            return ("anonymous", str(uuid.uuid4()), str(e))

    async def handle_connection(
        self,
        websocket: WebSocket,
        token: Optional[str] = None,
        db: Session = None
    ) -> None:
        """
        Handle a WebSocket connection lifecycle.
        
        Args:
            websocket: WebSocket connection
            token: Optional JWT token
            db: Database session
        """
        user_id, connection_id, auth_error = await self.authenticate_connection(
            websocket, token, db
        )
        
        metadata = {
            "auth_error": auth_error,
            "remote_addr": websocket.client.host if websocket.client else None,
        }
        
        connection = await self.ws_manager.connect(
            websocket, user_id, connection_id, metadata
        )
        
        try:
            while True:
                try:
                    raw_data = await websocket.receive_text()
                    data = json.loads(raw_data)
                    
                    response = await self.message_handler.process_message(
                        data, connection
                    )
                    
                    if response:
                        await websocket.send_json(response)
                        
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Invalid JSON"}
                    })
                    
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected: {connection_id}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            await self.ws_manager.disconnect(connection_id)


ws_connection_manager = WebSocketConnectionManager()


@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT access token"),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time communication.
    
    Connect with: ws://host/ws/?token=<jwt_token>
    
    Message format:
    {
        "type": "message_type",
        "data": {...}
    }
    
    Supported message types:
    - auth: Authenticate connection
    - heartbeat: Keep connection alive
    - chat_message: Send chat message
    - typing_start/stop: Typing indicators
    - join_room/leave_room: Room management
    """
    await ws_connection_manager.handle_connection(websocket, token, db)


@router.websocket("/chat/{room_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: Optional[str] = Query(None, description="JWT access token"),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for chat room communication.
    
    Automatically joins the specified room.
    """
    await ws_connection_manager.handle_connection(websocket, token, db)
    
    connection_id = str(uuid.uuid4())
    
    try:
        connection = await ws_connection_manager.ws_manager.connect(
            websocket, "anonymous", connection_id
        )
        
        await ws_connection_manager.ws_manager.join_room(connection_id, f"chat:{room_id}")
        
        while True:
            try:
                raw_data = await websocket.receive_text()
                data = json.loads(raw_data)
                
                response = await ws_connection_manager.message_handler.process_message(
                    data, connection
                )
                
                if response:
                    await websocket.send_json(response)
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": "Invalid JSON"}
                })
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Chat WebSocket error: {e}")
    finally:
        await ws_connection_manager.ws_manager.leave_room(connection_id, f"chat:{room_id}")
        await ws_connection_manager.ws_manager.disconnect(connection_id)
