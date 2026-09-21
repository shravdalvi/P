from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Event(BaseModel):
    id: str
    name: str
    startTime: datetime
    endTime: Optional[datetime] = None
    status: str = 'active'
    totalOccupancy: int = 0
    capacity: int = 0

class Zone(BaseModel):
    id: str
    name: str
    capacity: int
    occupancy: int = 0
    occupancyPercentage: float = 0.0
    netFlow: int = 0
    risk: str = 'safe'
    lng: float
    lat: float
    active: bool = True
    w: Optional[int] = 90
    h: Optional[int] = 60
    neighbors: Optional[List[str]] = Field(default_factory=list)

class ZoneTelemetry(BaseModel):
    zoneId: str
    timestamp: datetime
    occupancy: int
    occupancyPercentage: float
    netFlow: int
    incoming: int = 0
    outgoing: int = 0
    risk: str = 'safe'

class OperationalIssue(BaseModel):
    id: str
    zoneId: str
    type: str
    severity: str
    description: str
    timestamp: datetime
    status: str = 'active'

class PredictionProjection(BaseModel):
    min: int
    value: int

class Prediction(BaseModel):
    zoneId: str
    breachIn: Optional[int] = None
    projections: List[PredictionProjection] = Field(default_factory=list)
    timestamp: datetime

class Action(BaseModel):
    id: str
    actionType: str
    target: str
    parameters: Dict[str, Any]
    reason: str
    expectedImpact: str
    status: str = 'pending'
    createdAt: datetime

class Recommendation(BaseModel):
    id: str
    zoneId: str
    zone: str
    altZoneId: Optional[str] = None
    altZone: Optional[str] = None
    before: int
    projectedAfter: int
    altBefore: Optional[int] = None
    altAfter: Optional[int] = None
    reduction: int
    steps: List[str] = Field(default_factory=list)
    status: str = 'pending'
    actions: Optional[List[Action]] = Field(default_factory=list)

class SystemHealth(BaseModel):
    status: str
    latency: int
    uptime: int
    lastCheck: datetime

class WebsocketEnvelope(BaseModel):
    type: str
    timestamp: str
    entityId: str
    data: Dict[str, Any]
