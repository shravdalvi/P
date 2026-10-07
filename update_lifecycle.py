import re

with open('backend/app/api/routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_routes = '''
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
'''

with open('backend/app/api/routes.py', 'a', encoding='utf-8') as f:
    f.write(new_routes)
