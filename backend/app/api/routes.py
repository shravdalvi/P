from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request, Response
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.services.state import state_manager
from app.realtime.connection import manager
from app.models.telemetry import TelemetryRequest, TelemetryResponse
from app.services.redis_client import save_participant_position
from app.services.pg_client import queue_telemetry_for_db

router = APIRouter()

# Simple mock for Event-scoped token auth
async def verify_event_token(request: Request, event_id: str):
    from app.services.redis_client import get_redis
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    
    # Check if event is revoked
    r = await get_redis()
    revoked = await r.get(f"event:{event_id}:revoked")
    if revoked:
        raise HTTPException(status_code=401, detail="Event Ended")
        
    # Check if token is scoped to event
    if not token.endswith(f"_{event_id}") and token != "dev_token":
        raise HTTPException(status_code=403, detail="Forbidden: Token not scoped to this event")
    return token

# Simple mock for rate limiting
_ip_rates = {}
def rate_limit(request: Request):
    ip = request.client.host
    now = datetime.now(timezone.utc)
    # 50 requests per second per IP
    if ip not in _ip_rates:
        _ip_rates[ip] = []
    _ip_rates[ip] = [t for t in _ip_rates[ip] if now - t < timedelta(seconds=1)]
    if len(_ip_rates[ip]) >= 50:
        return False
    _ip_rates[ip].append(now)
    return True

VENUE_BOUNDS = {
    "min_lat": -0.05, "max_lat": 0.05,
    "min_lng": -0.05, "max_lng": 0.05
}

@router.post("/events/{event_id}/telemetry", response_model=TelemetryResponse)
async def ingest_telemetry(
    event_id: str, 
    payload: TelemetryRequest, 
    request: Request,
    response: Response,
    token: str = Depends(verify_event_token)
):
    if not rate_limit(request):
        return JSONResponse(status_code=429, content={"detail": "Too Many Requests"}, headers={"Retry-After": "1"})

    if len(payload.records) > 100:
        raise HTTPException(status_code=400, detail="Batch size cap exceeded (max 100)")

    server_time = datetime.now(timezone.utc)
    valid_records = []
    dropped_outside_bounds = 0

    for rec in payload.records:
        # Schema is implicitly validated by Pydantic
        
        # Check coordinate range
        if not (-90 <= rec.latitude <= 90) or not (-180 <= rec.longitude <= 180):
            continue
            
        # Accuracy cap (e.g. <= 100m)
        if rec.accuracy_m > 100:
            continue
            
        # Stale timestamps (allow max 60s offset)
        device_time_utc = rec.device_time
        if device_time_utc.tzinfo is None:
            device_time_utc = device_time_utc.replace(tzinfo=timezone.utc)
        
        age = (server_time - device_time_utc).total_seconds()
        if age > 60 or age < -60: # Stale or too far in future
            continue
            
        # Reject simulated in production
        is_production = False # Mocked state
        if rec.is_simulated and is_production:
            continue

        # Drop points outside bounds
        if not (VENUE_BOUNDS["min_lat"] <= rec.latitude <= VENUE_BOUNDS["max_lat"] and 
                VENUE_BOUNDS["min_lng"] <= rec.longitude <= VENUE_BOUNDS["max_lng"]):
            dropped_outside_bounds += 1
            continue

        # Convert to dict for saving
        rec_dict = rec.model_dump()
        rec_dict["server_time"] = server_time.isoformat()
        rec_dict["device_time"] = rec_dict["device_time"].isoformat()
        rec_dict["event_id"] = event_id
        
        valid_records.append(rec_dict)

        # Write latest position to Redis
        await save_participant_position(event_id, rec.participant_id, rec_dict)

    if valid_records:
        # Append history to PostgreSQL asynchronously
        await queue_telemetry_for_db(valid_records)

    # Fetch config version
    from app.services.redis_client import get_redis
    r = await get_redis()
    cv = await r.get(f"event:{event_id}:config_version")
    config_version = int(cv) if cv else 1

    # Return contract response
    return TelemetryResponse(
        zone="zone-a", # Mock mapping for now, aggregator does real mapping
        zone_level="moderate",
        recommendation=None,
        config_version=config_version,
        event_status="live",
        server_time=server_time
    )

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "vibecheck-controller-backend"}

@router.get("/api/event")
async def get_event():
    return state_manager.event

@router.get("/api/zones")
async def get_zones():
    from datetime import datetime, timezone
    return {
        "zones": list(state_manager.zones.values()),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/api/issues")
async def get_issues():
    return list(state_manager.issues.values())

@router.get("/api/recommendations")
async def get_recommendations():
    return list(state_manager.recommendations.values())

@router.post("/api/ingest/simulator")
async def ingest_simulator_data(data: List[Dict[str, Any]]):
    """
    Adapter endpoint to receive raw data from the local simulator,
    which is then normalized and processed incrementally.
    """
    await state_manager.ingest_simulator_zones(data)
    return {"status": "ingested", "count": len(data)}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming commands from frontend if necessary
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from app.models.telemetry import PresenceRequest
from app.services.redis_client import remove_participant_position

@router.post("/events/{event_id}/presence")
async def update_presence(
    event_id: str,
    payload: PresenceRequest,
    request: Request,
    token: str = Depends(verify_event_token)
):
    participant_id = payload.participant_id
    # If participant_id not explicitly sent, infer it from mock token if possible
    if not participant_id:
        if "_" in token:
            parts = token.split("_")
            if len(parts) >= 3:
                participant_id = parts[2]
            else:
                participant_id = "unknown"
        else:
            participant_id = "unknown"
            
    if payload.state in ("PAUSED", "LEFT"):
        await remove_participant_position(event_id, participant_id)
        # The position_publisher will pick up this removal on the next tick and send a POSITIONS_DELTA remove.
        # But we could also explicitly publish to redis here for lower latency.
        # For now, position_publisher diffing is sufficient.

    return {"status": "ok", "state": payload.state}

from pydantic import BaseModel

class AnnouncementRequest(BaseModel):
    message: str
    level: str = "info"

class ConfigUpdateRequest(BaseModel):
    map: dict = None
    zones: list = None
    thresholds: dict = None

@router.post("/events/{event_id}/announcements")
async def send_announcement(
    event_id: str,
    payload: AnnouncementRequest,
    token: str = Depends(verify_event_token)
):
    from app.services.redis_client import get_redis
    import json
    from datetime import datetime, timezone
    
    r = await get_redis()
    msg = {
        "type": "ANNOUNCEMENT",
        "message": payload.message,
        "level": payload.level,
        "server_time": datetime.now(timezone.utc).isoformat()
    }
    await r.publish(f"channel:{event_id}:stream", json.dumps(msg))
    return {"status": "sent"}

@router.post("/events/{event_id}/recommendations")
async def send_recommendation(
    event_id: str,
    payload: dict,
    token: str = Depends(verify_event_token)
):
    from app.services.redis_client import get_redis
    import json
    from datetime import datetime, timezone
    
    r = await get_redis()
    msg = {
        "type": "RECOMMENDATION",
        "recommendation": payload,
        "server_time": datetime.now(timezone.utc).isoformat()
    }
    await r.publish(f"channel:{event_id}:stream", json.dumps(msg))
    return {"status": "sent"}

@router.post("/events/{event_id}/config")
async def update_config(
    event_id: str,
    payload: ConfigUpdateRequest,
    token: str = Depends(verify_event_token)
):
    from app.services.redis_client import get_redis
    import json
    from datetime import datetime, timezone
    
    r = await get_redis()
    # Bump config version
    current_version = await r.get(f"event:{event_id}:config_version")
    new_version = int(current_version) + 1 if current_version else 1
    
    await r.set(f"event:{event_id}:config_version", new_version)
    
    msg = {
        "type": "CONFIG_UPDATE",
        "config_version": new_version,
        "server_time": datetime.now(timezone.utc).isoformat()
    }
    await r.publish(f"channel:{event_id}:stream", json.dumps(msg))
    return {"status": "updated", "config_version": new_version}

class EventStatusRequest(BaseModel):
    status: str

@router.post("/events/{event_id}/status")
async def update_event_status(
    event_id: str,
    payload: EventStatusRequest,
    token: str = Depends(verify_event_token)
):
    from app.workers.manager import start_event_workers, stop_event_workers
    from app.services.redis_client import get_redis
    import json
    from datetime import datetime, timezone
    
    r = await get_redis()
    status = payload.status.upper()
    
    if status == "LIVE":
        start_event_workers(event_id)
        msg = {
            "type": "EVENT_STARTED",
            "server_time": datetime.now(timezone.utc).isoformat()
        }
        await r.publish(f"channel:{event_id}:stream", json.dumps(msg))
        
    elif status == "ENDED":
        stop_event_workers(event_id)
        msg = {
            "type": "EVENT_ENDED",
            "server_time": datetime.now(timezone.utc).isoformat()
        }
        await r.publish(f"channel:{event_id}:stream", json.dumps(msg))
        
        # Schedule deletion / Revoke tokens
        await r.set(f"event:{event_id}:revoked", "true")
        await r.delete(f"event:{event_id}:pos")
        await r.delete(f"event:{event_id}:positions_full")
        await r.delete(f"event:{event_id}:snapshot")
        
    return {"status": "ok", "event_status": status}

@router.get("/metrics")
async def get_metrics():
    from app.services.redis_client import get_redis
    r = await get_redis()
    
    # Just an example mock metrics output
    return {
        "active_devices_per_event": {"test-event": 0},
        "telemetry_per_second": 0,
        "aggregator_lag_ms": 12,
        "websocket_clients": 0,
        "dropped_outside_bounds": 0
    }
