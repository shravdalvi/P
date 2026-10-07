import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_ws_unauthorized():
    with pytest.raises(Exception) as exc:
        with client.websocket_connect("/events/test-event/dashboard?token=wrong_token"):
            pass
    assert "403" in str(exc) or "1008" in str(exc)

def test_dashboard_ws_authorized():
    # Since pubsub is async and testclient is sync/blocking with WS, 
    # testing the full pubsub stream requires async test client (httpx),
    # but we can test that it accepts the connection and doesn't drop it immediately
    # due to auth.
    with client.websocket_connect("/events/test-event/dashboard?token=dev_token") as websocket:
        # Just connecting successfully is enough for this test
        pass

