import os
import asyncio
from typing import List, Dict, Any

PG_URL = os.getenv("PG_URL", "postgresql://vibecheck:vibecheck_password@localhost:5432/vibecheck_db")

_batch_queue = []
_batch_lock = asyncio.Lock()

async def queue_telemetry_for_db(records: List[Dict[str, Any]]):
    async with _batch_lock:
        _batch_queue.extend(records)

async def flush_telemetry_batch():
    async with _batch_lock:
        if not _batch_queue:
            return
        to_insert = list(_batch_queue)
        _batch_queue.clear()
        
    print(f"Mock PG: Flushed {len(to_insert)} records to DB.")
