import asyncio
import json
import hashlib
from datetime import datetime, timezone
from app.services.redis_client import get_redis, get_all_positions

def get_short_id(participant_id: str) -> str:
    # Deterministic short ID from participant ID
    return hashlib.md5(participant_id.encode()).hexdigest()[:8]

seq_counter = 0
last_published_state = {}

async def position_publisher_loop(event_id: str):
    global seq_counter, last_published_state
    r = await get_redis()
    
    while True:
        try:
            positions_raw = await get_all_positions(event_id)
            now = datetime.now(timezone.utc)
            
            current_state = {}
            full_points = []
            upsert_points = []
            
            # Reconstruct current state and full points
            for pid, p_json in positions_raw.items():
                p = json.loads(p_json)
                short_id = get_short_id(pid)
                
                # Check for staleness
                server_time = datetime.fromisoformat(p["server_time"])
                age = (now - server_time).total_seconds()
                if age > 60:
                    continue
                    
                # Format: [short_id, lat, lng, acc_m, zone, movement_score]
                point = [
                    short_id,
                    round(p["latitude"], 6),
                    round(p["longitude"], 6),
                    round(p.get("accuracy_m", 10.0), 1),
                    p.get("zone", "unknown"),
                    round(p.get("movement_score", 0.0), 2)
                ]
                
                current_state[short_id] = point
                full_points.append(point)
                
                # Check if new or updated
                if short_id not in last_published_state or last_published_state[short_id] != point:
                    upsert_points.append(point)
            
            # Find removals
            remove_points = [sid for sid in last_published_state if sid not in current_state]
            
            seq_counter += 1
            
            # Build full and delta
            positions_full = {
                "type": "POSITIONS_FULL",
                "seq": seq_counter,
                "server_time": now.isoformat(),
                "points": full_points
            }
            
            positions_delta = {
                "type": "POSITIONS_DELTA",
                "seq": seq_counter,
                "upsert": upsert_points,
                "remove": remove_points
            }
            
            # Store full for new connections
            await r.set(f"event:{event_id}:positions_full", json.dumps(positions_full))
            
            # Only publish delta if there are changes
            if upsert_points or remove_points:
                await r.publish(f"channel:{event_id}:positions", json.dumps(positions_delta))
                
            last_published_state = current_state
            
        except Exception as e:
            print(f"Position publisher error: {e}")
            
        await asyncio.sleep(1) # Run every 1s

def start_position_publisher(event_id: str):
    asyncio.create_task(position_publisher_loop(event_id))

