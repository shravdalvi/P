# Vibecheck App Specification

This document contains the specifications and instructions for building the **Vibecheck** mobile app. You can use this markdown file as a prompt for ChatGPT or another AI assistant to generate the Flutter app code.

---

## CONTEXT
**Vibecheck** is a Flutter mobile application used by attendees at large events (e.g., concerts, festivals). The app continuously collects location and movement telemetry from the attendee's phone and sends it to a backend system. The backend aggregates this data to monitor crowd density and pushes real-time "recommendations" (e.g., crowd redirection, safety alerts) back to the app.

The backend and the operations dashboard ("Vibecheck Controller") already exist. Your task is to build the Flutter app that integrates with the backend according to a strict API contract.

## APP FEATURES
1. **Event Join Flow:** Users enter a short alphanumeric code to join an event.
2. **Telemetry Service:** A background/foreground service that collects high-frequency location (GPS) and movement (accelerometer) data, batches it, and sends it to the backend via a REST API.
3. **Real-time Updates:** A WebSocket connection listens for live announcements, event status changes, and personalized recommendations.
4. **UI Dashboard:** 
   - A map showing the venue and the user's current zone.
   - A feed or popup system for recommendations (e.g., "The main stage is crowded, head to the north food court").
   - Event status indicator (Scheduled, Live, Ended).
5. **No SOS feature:** Do NOT add any SOS or emergency panic button features.

## STRICT CONTRACT
Do not alter this contract. The backend strictly expects these endpoints and payloads.

Base: HTTPS API + WSS. Everything is event-scoped. Use event-scoped bearer tokens for auth.

### REST API
**1. Join Event**
- `POST /events/join`
- Request: `{ "code": "STRING" }`
- Response: 
  ```json
  {
    "session_token": "...",
    "refresh_token": "...",
    "participant_id": "...",
    "event": { "id": "...", "name": "...", "type": "...", "status": "...", "starts_at": "...", "ends_at": "...", "venue_name": "..." },
    "config": { "config_version": 1, "map": "...", "zones": [], "pois": [], "thresholds": {}, "sampling": {}, "copy": {} }
  }
  ```

**2. Get Config**
- `GET /events/{id}/config`
- Response: Config object matching the one above.

**3. Ingest Telemetry**
- `POST /events/{id}/telemetry`
- Request:
  ```json
  {
    "records": [
      {
        "schema_version": 1,
        "record_id": "UUID",
        "seq": 1,
        "participant_id": "...",
        "source_type": "GPS",
        "is_simulated": false,
        "device_time": 1700000000000,
        "clock_offset_ms": 0,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy_m": 5.2,
        "speed_mps": 1.1,
        "heading_deg": 180,
        "mock_location_flag": false,
        "movement_score": 0.8,
        "movement_state": "WALKING",
        "accel_variance": 0.05,
        "motion_intensity_raw": 0.4,
        "battery_level": 85,
        "gps_enabled": true,
        "network_status": "WIFI",
        "app_status": "FOREGROUND"
      }
    ]
  }
  ```
- Response:
  ```json
  {
    "zone": "zone-c",
    "zone_level": "MODERATE",
    "recommendation": null, // Or object: {id, version, expires_at, target_zone, route, walk_minutes, message, reason}
    "config_version": 1,
    "event_status": "LIVE",
    "server_time": 1700000000500
  }
  ```
- Errors to handle: `401 Unauthorized`, `403 Forbidden` (wrong event), `429 Too Many Requests` (respect `Retry-After` header).

**4. Update Presence State**
- `POST /events/{id}/presence`
- Request: `{ "state": "ACTIVE" | "PAUSED" | "LEFT" }`

### WebSocket API
**5. Real-time Stream**
- Connect to WSS: `/events/{id}/stream`
- Pass the session token (e.g. via query parameter `?token=...` or first message if headers are unsupported).
- Server will push events: `CONFIG_UPDATE`, `ANNOUNCEMENT`, `RECOMMENDATION`, `EVENT_STARTED`, `EVENT_ENDED`.
- All messages include `server_time`.

## REQUIRED ARCHITECTURE
- **State Management:** Provider, Riverpod, or Bloc.
- **Location & Sensors:** Use `geolocator` (or `location`) and `sensors_plus`. Handle permissions gracefully (background location is required for accurate tracking).
- **Background Processing:** The app must continue batching and sending telemetry even when the app is backgrounded.
- **Local Storage:** Securely store the `session_token` and `refresh_token`.
- **Clock Sync:** The app should estimate `clock_offset_ms` by comparing `device_time` with the `server_time` returned in API responses.

## TASK FOR THE AI
Please provide:
1. The Flutter project structure.
2. The core services for API/WSS communication and Telemetry collection.
3. The data models reflecting the contract.
4. A simple UI showing the connection state, current zone, and any active recommendations.

