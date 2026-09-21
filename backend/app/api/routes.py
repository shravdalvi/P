from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
from app.services.state import state_manager
from app.realtime.connection import manager

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "pulse-command-backend"}

@router.get("/api/event")
async def get_event():
    return state_manager.event

@router.get("/api/zones")
async def get_zones():
    return list(state_manager.zones.values())

@router.get("/api/issues")
async def get_issues():
    return list(state_manager.issues.values())

@router.get("/api/recommendations")
async def get_recommendations():
    return list(state_manager.recommendations.values())

@router.post("/api/ingest/simulator")
async def ingest_simulator_data(data: List[Dict[str, Any]]):
    """
    Adapter endpoint to receive raw data from the local simulator,
    which is then normalized and processed incrementally.
    """
    await state_manager.ingest_simulator_zones(data)
    return {"status": "ingested", "count": len(data)}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming commands from frontend if necessary
    except WebSocketDisconnect:
        manager.disconnect(websocket)
