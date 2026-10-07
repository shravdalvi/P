import re

with open('backend/app/api/routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_routes = '''
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
'''

with open('backend/app/api/routes.py', 'a', encoding='utf-8') as f:
    f.write(new_routes)
