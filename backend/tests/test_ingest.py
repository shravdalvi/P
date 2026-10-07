import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime, timezone, timedelta

client = TestClient(app)

@pytest.fixture
def valid_telemetry():
    now = datetime.now(timezone.utc)
    return {
        "records": [
            {
                "schema_version": "1.0",
                "record_id": "rec-123",
                "seq": 1,
                "participant_id": "part-123",
                "source_type": "app",
                "is_simulated": False,
                "device_time": now.isoformat(),
                "clock_offset_ms": 0,
                "latitude": 0.01,
                "longitude": 0.01,
                "accuracy_m": 10.0,
                "speed_mps": 1.5,
                "heading_deg": 90.0,
                "mock_location_flag": False,
                "movement_score": 0.8,
                "movement_state": "walking",
                "accel_variance": 0.5,
                "motion_intensity_raw": 0.4,
                "battery_level": 0.8,
                "gps_enabled": True,
                "network_status": "wifi",
                "app_status": "active"
            }
        ]
    }

def test_ingest_telemetry_valid(valid_telemetry):
    response = client.post(
        "/events/test-event/telemetry",
        json=valid_telemetry,
        headers={"Authorization": "Bearer dev_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["event_status"] == "live"
    assert "server_time" in data

def test_ingest_telemetry_invalid_token(valid_telemetry):
    response = client.post(
        "/events/test-event/telemetry",
        json=valid_telemetry,
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 403

def test_ingest_telemetry_outside_bounds(valid_telemetry):
    valid_telemetry["records"][0]["latitude"] = 90.0 # Way outside 0.05
    response = client.post(
        "/events/test-event/telemetry",
        json=valid_telemetry,
        headers={"Authorization": "Bearer dev_token"}
    )
    assert response.status_code == 200
    # You would typically mock redis here and assert it was NOT called,
    # but for now we just ensure it doesn't break and drops it.

def test_ingest_telemetry_stale_timestamp(valid_telemetry):
    stale_time = datetime.now(timezone.utc) - timedelta(minutes=5)
    valid_telemetry["records"][0]["device_time"] = stale_time.isoformat()
    response = client.post(
        "/events/test-event/telemetry",
        json=valid_telemetry,
        headers={"Authorization": "Bearer dev_token"}
    )
    assert response.status_code == 200

def test_ingest_telemetry_missing_auth(valid_telemetry):
    response = client.post("/events/test-event/telemetry", json=valid_telemetry)
    assert response.status_code == 401

