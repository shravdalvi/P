from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TelemetryRecord(BaseModel):
    schema_version: str
    record_id: str
    seq: int
    participant_id: str
    source_type: str
    is_simulated: bool
    device_time: datetime
    clock_offset_ms: int
    latitude: float
    longitude: float
    accuracy_m: float
    speed_mps: float
    heading_deg: float
    mock_location_flag: bool
    movement_score: float
    movement_state: str
    accel_variance: float
    motion_intensity_raw: float
    battery_level: float
    gps_enabled: bool
    network_status: str
    app_status: str

class TelemetryRequest(BaseModel):
    records: List[TelemetryRecord]

class RecommendationDTO(BaseModel):
    id: str
    version: int
    expires_at: datetime
    target_zone: str
    route: str
    walk_minutes: int
    message: str
    reason: str

class TelemetryResponse(BaseModel):
    zone: Optional[str] = None
    zone_level: Optional[str] = None
    recommendation: Optional[RecommendationDTO] = None
    config_version: int
    event_status: str
    server_time: datetime

class PresenceRequest(BaseModel):
    state: str
    participant_id: Optional[str] = None
