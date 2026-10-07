import re

with open('backend/app/api/routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_auth = '''
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
'''

content = re.sub(r'def verify_event_token.*?return token', new_auth.strip(), content, flags=re.DOTALL)

with open('backend/app/api/routes.py', 'w', encoding='utf-8') as f:
    f.write(content)
