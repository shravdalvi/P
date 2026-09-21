from fastapi import WebSocket
from typing import List, Dict, Any
from datetime import datetime, timezone
import json
from app.models.domain import WebsocketEnvelope

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_event(self, event_type: str, entity_id: str, data: Dict[str, Any]):
        envelope = WebsocketEnvelope(
            type=event_type,
            timestamp=datetime.now(timezone.utc).isoformat(),
            entityId=entity_id,
            data=data
        )
        message = envelope.model_dump_json()

        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()
