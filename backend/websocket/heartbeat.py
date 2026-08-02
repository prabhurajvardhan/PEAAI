"""WebSocket heartbeat management for connection health monitoring."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

import sys
from pathlib import Path as path
sys.path.insert(0, str(path(__file__).parent.parent.parent))

logger = logging.getLogger(__name__)


@dataclass
class HeartbeatConfig:
    """Configuration for heartbeat monitoring."""
    
    check_interval: float = 30.0
    heartbeat_timeout: float = 60.0
    max_missed_heartbeats: int = 3


class HeartbeatManager:
    """
    Manages heartbeat monitoring for WebSocket connections.
    
    Periodically checks connection health and removes stale connections.
    """

    def __init__(
        self,
        ws_manager,
        config: Optional[HeartbeatConfig] = None
    ):
        """
        Initialize the heartbeat manager.
        
        Args:
            ws_manager: WebSocket manager instance
            config: Heartbeat configuration
        """
        self.ws_manager = ws_manager
        self.config = config or HeartbeatConfig()
        
        self._last_heartbeat: Dict[str, datetime] = {}
        self._missed_count: Dict[str, int] = {}
        self._check_task: Optional[asyncio.Task] = None
        self._running = False

    def start(self, connection_id: str) -> None:
        """
        Start monitoring a connection.
        
        Args:
            connection_id: Connection to monitor
        """
        self._last_heartbeat[connection_id] = datetime.utcnow()
        self._missed_count[connection_id] = 0
        
        if not self._running:
            self._start_check_loop()

    def stop(self, connection_id: str) -> None:
        """
        Stop monitoring a connection.
        
        Args:
            connection_id: Connection to stop monitoring
        """
        self._last_heartbeat.pop(connection_id, None)
        self._missed_count.pop(connection_id, None)
        
        if not self._last_heartbeat and self._running:
            self._stop_check_loop()

    def record_heartbeat(self, connection_id: str) -> None:
        """
        Record a heartbeat from a connection.
        
        Args:
            connection_id: Connection that sent heartbeat
        """
        self._last_heartbeat[connection_id] = datetime.utcnow()
        self._missed_count[connection_id] = 0

    def get_heartbeat_age(self, connection_id: str) -> float:
        """
        Get the age of the last heartbeat in seconds.
        
        Args:
            connection_id: Connection ID
        
        Returns:
            Seconds since last heartbeat
        """
        if connection_id not in self._last_heartbeat:
            return float('inf')
        
        delta = datetime.utcnow() - self._last_heartbeat[connection_id]
        return delta.total_seconds()

    def get_missed_count(self, connection_id: str) -> int:
        """
        Get the count of missed heartbeats.
        
        Args:
            connection_id: Connection ID
        
        Returns:
            Number of missed heartbeats
        """
        return self._missed_count.get(connection_id, 0)

    def get_stale_connections(self, max_age_seconds: float) -> List[str]:
        """
        Get connections that haven't sent a heartbeat within the max age.
        
        Args:
            max_age_seconds: Maximum allowed age
        
        Returns:
            List of stale connection IDs
        """
        stale = []
        for conn_id in list(self._last_heartbeat.keys()):
            if self.get_heartbeat_age(conn_id) > max_age_seconds:
                stale.append(conn_id)
        return stale

    async def _check_connections(self) -> None:
        """Periodically check connection health."""
        while self._running:
            try:
                await asyncio.sleep(self.config.check_interval)
                
                stale_connections = self.get_stale_connections(
                    self.config.heartbeat_timeout
                )
                
                for conn_id in stale_connections:
                    self._missed_count[conn_id] = self._missed_count.get(conn_id, 0) + 1
                    
                    missed = self._missed_count[conn_id]
                    
                    if missed >= self.config.max_missed_heartbeats:
                        logger.warning(
                            f"Connection {conn_id} missed {missed} heartbeats, disconnecting"
                        )
                        await self.ws_manager.disconnect(conn_id)
                    else:
                        logger.debug(
                            f"Connection {conn_id} missed heartbeat "
                            f"({missed}/{self.config.max_missed_heartbeats})"
                        )
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat check: {e}")

    def _start_check_loop(self) -> None:
        """Start the heartbeat check loop."""
        if self._running:
            return
        
        self._running = True
        self._check_task = asyncio.create_task(self._check_connections())
        logger.debug("Heartbeat check loop started")

    def _stop_check_loop(self) -> None:
        """Stop the heartbeat check loop."""
        if not self._running:
            return
        
        self._running = False
        
        if self._check_task:
            self._check_task.cancel()
            self._check_task = None
        
        logger.debug("Heartbeat check loop stopped")

    def get_stats(self) -> Dict:
        """
        Get heartbeat manager statistics.
        
        Returns:
            Dictionary of statistics
        """
        return {
            "monitored_connections": len(self._last_heartbeat),
            "running": self._running,
            "check_interval": self.config.check_interval,
            "heartbeat_timeout": self.config.heartbeat_timeout,
            "max_missed_heartbeats": self.config.max_missed_heartbeats,
            "stale_count": len(self.get_stale_connections(self.config.heartbeat_timeout)),
        }
