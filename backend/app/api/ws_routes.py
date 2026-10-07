
async def verify_ws_token(token: str, event_id: str):
    from app.services.redis_client import get_redis
    r = await get_redis()
    revoked = await r.get(f"event:{event_id}:revoked")
    if revoked:
        return False
    if not token.endswith(f"_{event_id}") and token != "dev_token":
        return False
    return True

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.redis_client import get_redis

ws_router = APIRouter()

# Mock function to check role permissions
def has_permission(token: str, permission: str) -> bool:
    # In a real app this would decode JWT and check scopes.
    # For now, admin_token gets all permissions.
    if "admin" in token or token == "dev_token":
        return True
    return False

async def ws_pubsub_forwarder(websocket: WebSocket, channel_name: str, event_id: str):
    r = await get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(channel_name)
    
    # Send the latest snapshot immediately
    if channel_name.endswith(":dashboard"):
        latest = await r.get(f"event:{event_id}:snapshot")
        if latest:
            await websocket.send_text(latest)
    # Send full positions immediately
    elif channel_name.endswith(":positions"):
        latest_full = await r.get(f"event:{event_id}:positions_full")
        if latest_full:
            await websocket.send_text(latest_full)

    try:
        while True:
            # We need to multiplex reading from websocket (for disconnects/heartbeats)
            # and reading from pubsub.
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message['type'] == 'message':
                await websocket.send_text(message['data'])
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        await pubsub.unsubscribe(channel_name)
        await pubsub.close()

@ws_router.websocket("/events/{event_id}/dashboard")
async def dashboard_websocket(event_id: str, websocket: WebSocket, token: str = Query(...)):
    if not await verify_ws_token(token, event_id):
        await websocket.close(code=1008, reason="Unauthorized")
        return
        
    await websocket.accept()
    await ws_pubsub_forwarder(websocket, f"channel:{event_id}:dashboard", event_id)

@ws_router.websocket("/events/{event_id}/dashboard/positions")
async def positions_websocket(event_id: str, websocket: WebSocket, token: str = Query(...)):
    if not await verify_ws_token(token, event_id):
        await websocket.close(code=1008, reason="Unauthorized")
        return
        
    if not has_permission(token, "view_individual_locations"):
        await websocket.close(code=1008, reason="Missing view_individual_locations permission")
        return
        
    # Log access audit
    print(f"AUDIT: Access to positions socket by token {token[:5]}... at {asyncio.get_event_loop().time()}")
        
    await websocket.accept()
    await ws_pubsub_forwarder(websocket, f"channel:{event_id}:positions", event_id)

@ws_router.websocket("/events/{event_id}/stream")
async def app_websocket(event_id: str, websocket: WebSocket, token: str = Query(...)):
    if not await verify_ws_token(token, event_id):
        await websocket.close(code=1008, reason="Unauthorized")
        return
        
    await websocket.accept()
    await ws_pubsub_forwarder(websocket, f"channel:{event_id}:stream", event_id)
