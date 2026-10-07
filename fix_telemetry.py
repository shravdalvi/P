import re

with open('backend/app/api/routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace config_version=1 with config_version
new_code = '''
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
'''

content = re.sub(
    r'# Return contract response.*?server_time=server_time\n    \)',
    new_code.strip(),
    content,
    flags=re.DOTALL
)

with open('backend/app/api/routes.py', 'w', encoding='utf-8') as f:
    f.write(content)
