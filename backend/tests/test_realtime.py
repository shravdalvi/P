import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.state import state_manager

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "pulse-command-backend"}

def test_simulator_ingestion_and_state():
    # Initial state should be empty
    state_manager.zones.clear()

    mock_zones = [
        {
            "id": "zone-a",
            "name": "North Gate",
            "capacity": 1000,
            "count": 500,
            "ratio": 0.5,
            "netFlow": 10,
            "risk": "safe"
        }
    ]

    response = client.post("/api/ingest/simulator", json=mock_zones)
    assert response.status_code == 200
    assert response.json()["status"] == "ingested"

    # Verify state was updated canonically
    assert "zone-a" in state_manager.zones
    zone_a = state_manager.zones["zone-a"]
    assert zone_a.capacity == 1000
    assert zone_a.occupancy == 500
    assert zone_a.occupancyPercentage == 0.5
    assert zone_a.netFlow == 10

def test_websockets_accepts_connection():
    with client.websocket_connect("/ws") as websocket:
        assert websocket
        # Can't easily test the broadcast side-effect in a simple TestClient without async coordination,
        # but connecting successfully verifies the endpoint is alive.
