import asyncio
import json
from datetime import datetime, timezone, timedelta
from app.services.redis_client import get_redis, get_all_positions
from app.services.state import state_manager

# Basic ray-casting point-in-polygon algorithm
def is_point_in_polygon(lng, lat, polygon):
    x, y = lng, lat
    inside = False
    n = len(polygon)
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if min(p1y, p2y) < y <= max(p1y, p2y) and x <= max(p1x, p2x):
            if p1y != p2y:
                xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
            if p1x == p2x or x <= xints:
                inside = not inside
        p1x, p1y = p2x, p2y
    return inside

# Mock zone definitions since we don't have a DB of zones yet.
# We map from state_manager's zones which lack polygon data by default in backend state,
# but let's assume we fetch it or use a default bbox. 
# For true implementation we'd sync mockData.js polygons.
ZONES_MOCK = {
    "zone-a": [[-0.006978,0.00635],[-0.001022,0.00635],[-0.00036,0.00365],[-0.00764,0.00365],[-0.006978,0.00635]],
    "zone-b": [[[0.000522,0.00635],[0.006478,0.00635],[0.00714,0.00365],[-0.00014,0.00365],[0.000522,0.00635]][0]], # simplified
    "zone-c": [[[0.000522,0.002683],[0.006478,0.002683],[0.00714,-0.000017],[-0.00014,-0.000017],[0.000522,0.002683]][0]],
}
# To make it robust, we'll just skip precise PIP if polygon missing

seq_counter = 0

async def aggregator_loop(event_id: str):
    global seq_counter
    r = await get_redis()
    
    while True:
        # Leader lock check could go here using r.set(..., nx=True, ex=3)
        lock_key = f"event:{event_id}:aggregator_lock"
        acquired = await r.set(lock_key, "1", nx=True, ex=3)
        if not acquired:
            await asyncio.sleep(1)
            continue
            
        try:
            positions_raw = await get_all_positions(event_id)
            now = datetime.now(timezone.utc)
            
            zone_counts = {}
            active_devices = 0
            
            for pid, p_json in positions_raw.items():
                try:
                    p = json.loads(p_json)
                    server_time = datetime.fromisoformat(p["server_time"])
                    age = (now - server_time).total_seconds()
                    
                    if age > 60:
                        # Stale eviction: clean up redis
                        await r.hdel(f"event:{event_id}:pos", pid)
                        continue
                        
                    active_devices += 1
                    
                    # Point in polygon mapping (simplified)
                    assigned_zone = "unknown"
                    for zid, poly in ZONES_MOCK.items():
                        if isinstance(poly[0], list) and is_point_in_polygon(p["longitude"], p["latitude"], poly):
                            assigned_zone = zid
                            break
                            
                    # fallback mock:
                    if assigned_zone == "unknown":
                        assigned_zone = p.get("zone", "zone-a")

                    zone_counts[assigned_zone] = zone_counts.get(assigned_zone, 0) + 1
                except Exception:
                    continue
            
            seq_counter += 1
            
            zones_output = []
            for zid, count in zone_counts.items():
                capacity = 5000  # Default or fetch from config
                ratio = count / capacity
                
                level = "LOW"
                if ratio >= 0.95: level = "CRITICAL"
                elif ratio >= 0.8: level = "HIGH"
                elif ratio >= 0.6: level = "MODERATE"
                
                zones_output.append({
                    "zone_id": zid,
                    "occupancy": count,
                    "capacity": capacity,
                    "level": level,
                    "movement_index": 1.0,
                    "predicted_breach_min": None
                })
                
            snapshot = {
                "type": "SNAPSHOT",
                "seq": seq_counter,
                "event_id": event_id,
                "server_time": now.isoformat(),
                "active_devices": active_devices,
                "zones": zones_output,
                "flow": [],
                "gates": [],
                "alerts": []
            }
            
            # Save latest to redis
            await r.set(f"event:{event_id}:snapshot", json.dumps(snapshot))
            
            # Publish to pub/sub
            await r.publish(f"channel:{event_id}:dashboard", json.dumps(snapshot))
            
        except Exception as e:
            print(f"Aggregator error: {e}")
            
        await asyncio.sleep(2) # Run every 2s

def start_aggregator(event_id: str):
    asyncio.create_task(aggregator_loop(event_id))

