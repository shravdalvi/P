import asyncio
from typing import Dict
from app.workers.aggregator import aggregator_loop
from app.workers.position_publisher import position_publisher_loop

# Track running background tasks per event
event_tasks: Dict[str, Dict[str, asyncio.Task]] = {}

def start_event_workers(event_id: str):
    if event_id not in event_tasks:
        event_tasks[event_id] = {}
        
    if "aggregator" not in event_tasks[event_id] or event_tasks[event_id]["aggregator"].done():
        task = asyncio.create_task(aggregator_loop(event_id))
        event_tasks[event_id]["aggregator"] = task
        
    if "publisher" not in event_tasks[event_id] or event_tasks[event_id]["publisher"].done():
        task = asyncio.create_task(position_publisher_loop(event_id))
        event_tasks[event_id]["publisher"] = task

def stop_event_workers(event_id: str):
    if event_id in event_tasks:
        for task_name, task in event_tasks[event_id].items():
            task.cancel()
        del event_tasks[event_id]
