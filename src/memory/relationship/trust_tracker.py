"""
Trust Tracker - Tracks and analyzes trust development.

Provides:
- Trust dimension tracking
- Trust event analysis
- Trust trajectory prediction
- Trust repair mechanisms
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import uuid


class TrustDimension(str, Enum):
    """Dimensions of trust."""
    HONESTY = "honesty"  # Belief in truthfulness
    COMPETENCE = "competence"  # Belief in ability
    BENEVOLENCE = "benevolence"  # Belief in good intentions
    PREDICTABILITY = "predictability"  # Consistency of behavior


class TrustEventType(str, Enum):
    """Types of trust-affecting events."""
    PROMISE_KEPT = "promise_kept"
    PROMISE_BROKEN = "promise_broken"
    SUPPORT_PROVIDED = "support_provided"
    SUPPORT_REFUSED = "support_refused"
    HONEST_FEEDBACK = "honest_feedback"
    MISLEADING_INFO = "misleading_info"
    CONSISTENT_BEHAVIOR = "consistent_behavior"
    INCONSISTENT_BEHAVIOR = "inconsistent_behavior"
    BOUNDARY_RESPECTED = "boundary_respected"
    BOUNDARY_VIOLATED = "boundary_violated"
    PRIVACY_RESPECTED = "privacy_respected"
    PRIVACY_BREACHED = "privacy_breached"
    VULNERABILITY_ACCEPTED = "vulnerability_accepted"
    VULNERABILITY_REJECTED = "vulnerability_rejected"


@dataclass
class TrustEvent:
    """A trust-affecting event."""
    
    id: str
    user_id: str
    event_type: TrustEventType
    timestamp: datetime
    
    # Event details
    description: str
    severity: float  # -1 to 1, how much it affected trust
    context: Optional[str] = None
    
    # Impact tracking
    dimension_impact: Dict[str, float] = field(default_factory=dict)
    
    # Recovery
    recovery_action: Optional[str] = None
    recovery_timestamp: Optional[datetime] = None
    
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_type": self.event_type.value if isinstance(self.event_type, Enum) else self.event_type,
            "timestamp": self.timestamp.isoformat(),
            "description": self.description,
            "severity": self.severity,
            "context": self.context,
            "dimension_impact": self.dimension_impact,
            "recovery_action": self.recovery_action,
            "recovery_timestamp": self.recovery_timestamp.isoformat() if self.recovery_timestamp else None,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TrustEvent":
        """Create event from dictionary."""
        event_type = data.get("event_type")
        if isinstance(event_type, str):
            event_type = TrustEventType(event_type.lower())
        
        timestamp = data.get("timestamp")
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        
        recovery_ts = data.get("recovery_timestamp")
        if isinstance(recovery_ts, str):
            recovery_ts = datetime.fromisoformat(recovery_ts)
        
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            user_id=data.get("user_id", ""),
            event_type=event_type,
            timestamp=timestamp or datetime.utcnow(),
            description=data.get("description", ""),
            severity=data.get("severity", 0.0),
            context=data.get("context"),
            dimension_impact=data.get("dimension_impact", {}),
            recovery_action=data.get("recovery_action"),
            recovery_timestamp=recovery_ts,
            metadata=data.get("metadata", {}),
        )


@dataclass
class TrustScore:
    """Current trust score with breakdown."""
    
    user_id: str
    overall: float
    honesty: float
    competence: float
    benevolence: float
    predictability: float
    
    # Confidence
    confidence: float  # How reliable this score is
    
    # Trajectory
    trend: str  # improving, stable, declining
    trend_strength: float  # How strong the trend is
    
    # Timestamps
    calculated_at: datetime
    last_update: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert score to dictionary."""
        return {
            "user_id": self.user_id,
            "overall": self.overall,
            "honesty": self.honesty,
            "competence": self.competence,
            "benevolence": self.benevolence,
            "predictability": self.predictability,
            "confidence": self.confidence,
            "trend": self.trend,
            "trend_strength": self.trend_strength,
            "calculated_at": self.calculated_at.isoformat(),
            "last_update": self.last_update.isoformat(),
        }


class TrustTracker:
    """
    Trust tracking and analysis system.
    
    Provides:
    - Multi-dimensional trust scoring
    - Trust event tracking
    - Trust trajectory analysis
    - Trust repair recommendations
    """
    
    # Trust dimension weights for overall score
    DIMENSION_WEIGHTS = {
        TrustDimension.HONESTY: 0.30,
        TrustDimension.COMPETENCE: 0.25,
        TrustDimension.BENEVOLENCE: 0.30,
        TrustDimension.PREDICTABILITY: 0.15,
    }
    
    # Event type impacts on dimensions
    EVENT_IMPACTS = {
        TrustEventType.PROMISE_KEPT: {
            TrustDimension.HONESTY: 0.1,
            TrustDimension.PREDICTABILITY: 0.05,
        },
        TrustEventType.PROMISE_BROKEN: {
            TrustDimension.HONESTY: -0.15,
            TrustDimension.PREDICTABILITY: -0.1,
        },
        TrustEventType.SUPPORT_PROVIDED: {
            TrustDimension.BENEVOLENCE: 0.1,
            TrustDimension.COMPETENCE: 0.05,
        },
        TrustEventType.SUPPORT_REFUSED: {
            TrustDimension.BENEVOLENCE: -0.05,
        },
        TrustEventType.HONEST_FEEDBACK: {
            TrustDimension.HONESTY: 0.1,
            TrustDimension.BENEVOLENCE: 0.05,
        },
        TrustEventType.MISLEADING_INFO: {
            TrustDimension.HONESTY: -0.2,
        },
        TrustEventType.CONSISTENT_BEHAVIOR: {
            TrustDimension.PREDICTABILITY: 0.1,
        },
        TrustEventType.INCONSISTENT_BEHAVIOR: {
            TrustDimension.PREDICTABILITY: -0.1,
        },
        TrustEventType.BOUNDARY_RESPECTED: {
            TrustDimension.BENEVOLENCE: 0.1,
            TrustDimension.HONESTY: 0.05,
        },
        TrustEventType.BOUNDARY_VIOLATED: {
            TrustDimension.BENEVOLENCE: -0.15,
            TrustDimension.HONESTY: -0.1,
        },
        TrustEventType.PRIVACY_RESPECTED: {
            TrustDimension.BENEVOLENCE: 0.1,
            TrustDimension.HONESTY: 0.05,
        },
        TrustEventType.PRIVACY_BREACHED: {
            TrustDimension.BENEVOLENCE: -0.25,
            TrustDimension.HONESTY: -0.15,
        },
        TrustEventType.VULNERABILITY_ACCEPTED: {
            TrustDimension.BENEVOLENCE: 0.15,
            TrustDimension.HONESTY: 0.1,
        },
        TrustEventType.VULNERABILITY_REJECTED: {
            TrustDimension.BENEVOLENCE: -0.1,
        },
    }
    
    def __init__(self):
        """Initialize trust tracker."""
        self._events: Dict[str, List[TrustEvent]] = {}  # user_id -> events
        self._scores: Dict[str, TrustScore] = {}  # user_id -> current score
        self._dimensions: Dict[str, Dict[str, float]] = {}  # user_id -> dimension -> value
    
    def record_event(
        self,
        user_id: str,
        event_type: TrustEventType,
        description: str,
        severity: Optional[float] = None,
        context: Optional[str] = None,
        dimension_override: Optional[Dict[TrustDimension, float]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Record a trust-affecting event.
        
        Args:
            user_id: User identifier
            event_type: Type of event
            description: Event description
            severity: Optional override for event severity
            context: Optional context
            dimension_override: Optional dimension impact overrides
            metadata: Optional metadata
            
        Returns:
            Event ID
        """
        # Calculate severity if not provided
        if severity is None:
            severity = self._calculate_event_severity(event_type)
        
        # Calculate dimension impacts
        dimension_impact = dimension_override or {}
        if event_type in self.EVENT_IMPACTS:
            for dim, impact in self.EVENT_IMPACTS[event_type].items():
                dimension_impact[dim.value] = dimension_impact.get(dim.value, 0) + impact
        
        event = TrustEvent(
            id=str(uuid.uuid4()),
            user_id=user_id,
            event_type=event_type,
            timestamp=datetime.utcnow(),
            description=description,
            severity=severity,
            context=context,
            dimension_impact={k.value if isinstance(k, Enum) else k: v for k, v in dimension_impact.items()},
            metadata=metadata or {},
        )
        
        # Store event
        self._events.setdefault(user_id, []).append(event)
        
        # Update dimensions
        self._update_dimensions(user_id, dimension_impact)
        
        # Recalculate score
        self._recalculate_score(user_id)
        
        return event.id
    
    def get_score(self, user_id: str) -> TrustScore:
        """
        Get current trust score.
        
        Args:
            user_id: User identifier
            
        Returns:
            TrustScore object
        """
        if user_id not in self._scores:
            self._initialize_score(user_id)
        
        return self._scores[user_id]
    
    def get_events(
        self,
        user_id: str,
        event_type: Optional[TrustEventType] = None,
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[TrustEvent]:
        """
        Get trust events.
        
        Args:
            user_id: User identifier
            event_type: Optional filter by type
            since: Optional start time filter
            limit: Maximum number of events
            
        Returns:
            List of TrustEvents
        """
        events = self._events.get(user_id, [])
        
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        
        if since:
            events = [e for e in events if e.timestamp >= since]
        
        return sorted(events, key=lambda e: e.timestamp, reverse=True)[:limit]
    
    def get_trust_history(
        self,
        user_id: str,
        days: int = 30,
    ) -> List[Dict[str, Any]]:
        """
        Get trust score history.
        
        Args:
            user_id: User identifier
            days: Number of days of history
            
        Returns:
            List of historical trust scores
        """
        since = datetime.utcnow() - timedelta(days=days)
        events = self.get_events(user_id, since=since, limit=10000)
        
        # Group events by day
        daily_scores: Dict[str, List[float]] = {}
        
        for event in events:
            day_key = event.timestamp.date().isoformat()
            daily_scores.setdefault(day_key, []).append(event.severity)
        
        # Calculate daily averages
        history = []
        for day, severities in sorted(daily_scores.items()):
            history.append({
                "date": day,
                "average_severity": sum(severities) / len(severities),
                "event_count": len(severities),
            })
        
        return history
    
    def analyze_trust_trajectory(
        self,
        user_id: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Analyze trust trajectory.
        
        Args:
            user_id: User identifier
            days: Number of days to analyze
            
        Returns:
            Trajectory analysis
        """
        history = self.get_trust_history(user_id, days)
        
        if len(history) < 2:
            return {
                "trend": "insufficient_data",
                "slope": 0,
                "confidence": 0,
            }
        
        # Calculate slope using simple linear regression
        scores = [h["average_severity"] for h in history]
        n = len(scores)
        
        x_mean = (n - 1) / 2
        y_mean = sum(scores) / n
        
        numerator = sum((i - x_mean) * (scores[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        slope = numerator / denominator if denominator != 0 else 0
        
        # Determine trend
        if slope > 0.01:
            trend = "improving"
        elif slope < -0.01:
            trend = "declining"
        else:
            trend = "stable"
        
        # Calculate confidence based on data points and variance
        variance = sum((s - y_mean) ** 2 for s in scores) / n
        confidence = min(1.0, n / 30) * (1.0 / (1.0 + variance))
        
        return {
            "trend": trend,
            "slope": slope,
            "confidence": confidence,
            "starting_score": scores[0] if scores else 0,
            "ending_score": scores[-1] if scores else 0,
            "change": (scores[-1] - scores[0]) if len(scores) >= 2 else 0,
            "data_points": n,
        }
    
    def get_trust_repair_recommendations(
        self,
        user_id: str,
    ) -> List[str]:
        """
        Get recommendations for repairing trust.
        
        Args:
            user_id: User identifier
            
        Returns:
            List of recommendations
        """
        score = self.get_score(user_id)
        recent_events = self.get_events(user_id, limit=20)
        recent_negative = [e for e in recent_events if e.severity < 0]
        
        recommendations = []
        
        # Analyze weakest dimensions
        dimensions = [
            ("honesty", score.honesty),
            ("competence", score.competence),
            ("benevolence", score.benevolence),
            ("predictability", score.predictability),
        ]
        
        weakest = min(dimensions, key=lambda x: x[1])
        if weakest[1] < 0.6:
            recommendations.append(
                f"Focus on building {weakest[0]} through consistent, reliable behavior."
            )
        
        # Analyze recent negative events
        if len(recent_negative) >= 3:
            event_types = [e.event_type for e in recent_negative]
            recommendations.append(
                "Multiple negative trust events detected. Consider acknowledging "
                "concerns and demonstrating commitment to improvement."
            )
        
        # Check for specific patterns
        for event in recent_negative[:5]:
            if event.event_type == TrustEventType.BOUNDARY_VIOLATED:
                recommendations.append(
                    "Respect user boundaries more carefully in future interactions."
                )
            elif event.event_type == TrustEventType.PRIVACY_BREACHED:
                recommendations.append(
                    "Ensure user privacy is maintained and their data is protected."
                )
            elif event.event_type == TrustEventType.PROMISE_BROKEN:
                recommendations.append(
                    "Follow through on commitments made to the user."
                )
        
        return recommendations
    
    def mark_recovery(
        self,
        user_id: str,
        event_id: str,
        recovery_action: str,
    ) -> bool:
        """
        Mark a negative event as recovered.
        
        Args:
            user_id: User identifier
            event_id: Event ID to mark as recovered
            recovery_action: Description of recovery action taken
            
        Returns:
            True if recovery was marked successfully
        """
        events = self._events.get(user_id, [])
        for event in events:
            if event.id == event_id and event.severity < 0:
                event.recovery_action = recovery_action
                event.recovery_timestamp = datetime.utcnow()
                
                # Slightly boost trust to reflect recovery
                self.record_event(
                    user_id,
                    TrustEventType.SUPPORT_PROVIDED,
                    f"Trust recovery: {recovery_action}",
                    severity=0.05,
                    metadata={"recovery_for": event_id},
                )
                
                return True
        
        return False
    
    def _initialize_score(self, user_id: str) -> None:
        """Initialize trust score for a new user."""
        self._dimensions[user_id] = {
            TrustDimension.HONESTY.value: 0.5,
            TrustDimension.COMPETENCE.value: 0.5,
            TrustDimension.BENEVOLENCE.value: 0.5,
            TrustDimension.PREDICTABILITY.value: 0.5,
        }
        
        self._recalculate_score(user_id)
    
    def _update_dimensions(
        self,
        user_id: str,
        impacts: Dict[str, float],
    ) -> None:
        """Update trust dimension values."""
        if user_id not in self._dimensions:
            self._initialize_score(user_id)
        
        dimensions = self._dimensions[user_id]
        
        for dim, impact in impacts.items():
            if dim in dimensions:
                dimensions[dim] = max(0, min(1, dimensions[dim] + impact))
    
    def _recalculate_score(self, user_id: str) -> None:
        """Recalculate overall trust score."""
        if user_id not in self._dimensions:
            self._initialize_score(user_id)
        
        dimensions = self._dimensions[user_id]
        
        # Calculate weighted overall
        overall = sum(
            dimensions[dim.value] * weight
            for dim, weight in self.DIMENSION_WEIGHTS.items()
        )
        
        # Analyze trajectory
        trajectory = self.analyze_trust_trajectory(user_id, days=7)
        
        # Calculate confidence based on number of events
        event_count = len(self._events.get(user_id, []))
        confidence = min(1.0, event_count / 50)
        
        self._scores[user_id] = TrustScore(
            user_id=user_id,
            overall=overall,
            honesty=dimensions[TrustDimension.HONESTY.value],
            competence=dimensions[TrustDimension.COMPETENCE.value],
            benevolence=dimensions[TrustDimension.BENEVOLENCE.value],
            predictability=dimensions[TrustDimension.PREDICTABILITY.value],
            confidence=confidence,
            trend=trajectory.get("trend", "stable"),
            trend_strength=abs(trajectory.get("slope", 0)),
            calculated_at=datetime.utcnow(),
            last_update=datetime.utcnow(),
        )
    
    def _calculate_event_severity(self, event_type: TrustEventType) -> float:
        """Calculate default severity for an event type."""
        severity_map = {
            TrustEventType.PROMISE_KEPT: 0.1,
            TrustEventType.PROMISE_BROKEN: -0.15,
            TrustEventType.SUPPORT_PROVIDED: 0.1,
            TrustEventType.SUPPORT_REFUSED: -0.05,
            TrustEventType.HONEST_FEEDBACK: 0.1,
            TrustEventType.MISLEADING_INFO: -0.2,
            TrustEventType.CONSISTENT_BEHAVIOR: 0.05,
            TrustEventType.INCONSISTENT_BEHAVIOR: -0.1,
            TrustEventType.BOUNDARY_RESPECTED: 0.1,
            TrustEventType.BOUNDARY_VIOLATED: -0.15,
            TrustEventType.PRIVACY_RESPECTED: 0.1,
            TrustEventType.PRIVACY_BREACHED: -0.25,
            TrustEventType.VULNERABILITY_ACCEPTED: 0.15,
            TrustEventType.VULNERABILITY_REJECTED: -0.1,
        }
        
        return severity_map.get(event_type, 0.0)
