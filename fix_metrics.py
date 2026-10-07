import re

with open('backend/app/api/routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

metrics = '''
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
'''

with open('backend/app/api/routes.py', 'a', encoding='utf-8') as f:
    f.write(metrics)
