import os
import json
from typing import Dict, Any, Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

_fake_redis = None

async def get_redis():
    global _fake_redis
    if _fake_redis is None:
        try:
            import fakeredis.aioredis
            _fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        except ImportError:
            import redis.asyncio as redis
            redis_pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)
            _fake_redis = redis.Redis(connection_pool=redis_pool)
    return _fake_redis

async def save_participant_position(event_id: str, participant_id: str, data: Dict[str, Any]):
    r = await get_redis()
    key = f"event:{event_id}:pos"
    await r.hset(key, participant_id, json.dumps(data))

async def remove_participant_position(event_id: str, participant_id: str):
    r = await get_redis()
    key = f"event:{event_id}:pos"
    await r.hdel(key, participant_id)

async def get_all_positions(event_id: str) -> Dict[str, str]:
    r = await get_redis()
    key = f"event:{event_id}:pos"
    res = await r.hgetall(key)
    return res if res else {}
