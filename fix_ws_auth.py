import re

with open('backend/app/api/ws_routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_auth = '''
async def verify_ws_token(token: str, event_id: str):
    from app.services.redis_client import get_redis
    r = await get_redis()
    revoked = await r.get(f"event:{event_id}:revoked")
    if revoked:
        return False
    if not token.endswith(f"_{event_id}") and token != "dev_token":
        return False
    return True
'''

content = new_auth + "\\n" + content
content = content.replace(
    'if not token.endswith(f"_{event_id}") and token != "dev_token":',
    'if not await verify_ws_token(token, event_id):'
)

with open('backend/app/api/ws_routes.py', 'w', encoding='utf-8') as f:
    f.write(content)
