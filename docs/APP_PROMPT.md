# TASK: Build the Vibecheck App (Flutter) and connect it to the live backend

# NAMING
Attendee app = "Vibecheck". Website = "Vibecheck Controller".
Do not use VenueFlow or ConcertFlow in any user-facing text. 

# CONTEXT
Vibecheck is a Flutter mobile application used by attendees at large events (e.g., concerts, festivals). The app continuously collects location and movement telemetry from attendees' phones and sends it to a backend. The backend aggregates it and pushes it to a dashboard. The app also receives live recommendations and crowd rerouting instructions from the backend over WebSocket. The backend already exists. Your job is to build the Flutter app from scratch that integrates with it. There is NO SOS feature. Do not add one.
Do not change the CONTRACT without telling me; if existing code differs, adapt through an adapter layer and list each difference.

# STEP 0: AUDIT FIRST (no code changes yet)
Report in docs/APP_PLAN.md:
1. Architecture: State management (e.g., Riverpod/Provider), location packages, background execution strategy.
2. Models: Data structures for the telemetry payload and configuration objects.
3. Table: item | current | CONTRACT requirement | change needed.
4. Assumptions. Wait for my "go" before Step 1.

# CONTRACT (shared with the backend; do not alter)

Base: HTTPS API + WSS. Everything is event-scoped. Event-scoped bearer tokens.

REST
1. POST /events/join  { code } -> { session_token, refresh_token, participant_id,
     event{id,name,type,status,starts_at,ends_at,venue_name},
     config{config_version,map,zones,pois,thresholds,sampling,copy} }
2. GET /events/{id}/config -> config object with config_version.
3. POST /events/{id}/telemetry { records:[ { schema_version, record_id, seq,
     participant_id, source_type, is_simulated, device_time, clock_offset_ms, latitude,
     longitude, accuracy_m, speed_mps, heading_deg, mock_location_flag, movement_score,
     movement_state, accel_variance, motion_intensity_raw, battery_level, gps_enabled,
     network_status, app_status } ] }
   -> { zone, zone_level, recommendation|null{id,version,expires_at,target_zone,route,
        walk_minutes,message,reason}, config_version, event_status, server_time }
   Errors: 401, 403 (wrong event), 429 + Retry-After.
4. POST /events/{id}/presence { state: ACTIVE|PAUSED|LEFT }

WebSocket
5. App channel: /events/{id}/stream  -> CONFIG_UPDATE, ANNOUNCEMENT, RECOMMENDATION,
   EVENT_STARTED, EVENT_ENDED (each with server_time).

Freshness: always server_time, never device time.

# PART 1: CORE SERVICES (Data & API)

1.1 API & Auth Client
- Build an HTTP client that manages the `session_token` and `refresh_token` securely.
- Automatically attach the bearer token to all `/events/{id}/*` requests.
- Handle 401s by attempting a refresh (if a refresh endpoint exists, otherwise prompt rejoin).
- Handle 429s by pausing telemetry ingestion based on the `Retry-After` header.

1.2 Clock Sync
- Calculate `clock_offset_ms` = `device_time` - `server_time` whenever a response includes `server_time`. Use this offset in all future telemetry records.

1.3 Telemetry Engine
- Run a foreground/background service using `geolocator` (or similar) and accelerometer sensors.
- Periodically sample data (e.g. 1Hz) and batch it into the `records` array.
- Flush the batch to `POST /events/{id}/telemetry` every 5 seconds.
- Cap batch sizes. Track sequence numbers (`seq`). Generate unique `record_id`s (UUIDs).
- Determine `movement_state` (e.g., WALKING, STATIONARY) using sensors.

1.4 WebSocket Client
- Connect to `wss://<domain>/events/{id}/stream?token=<session_token>`.
- Reconnect with exponential backoff on drop.
- Listen for `RECOMMENDATION` and `ANNOUNCEMENT` events and dispatch them to the UI state.

# PART 2: FLUTTER UI

2.1 Join Screen
- Simple screen to enter an alphanumeric code to call `POST /events/join`.
- On success, save tokens and transition to the Live Map.

2.2 Live Dashboard
- Show a simple map (e.g., using `flutter_map` or Google Maps) centered on the venue.
- Display the user's current `zone` and `zone_level` (from the telemetry response).
- Header showing event status (Scheduled, Live, Ended).

2.3 Recommendations & Announcements
- Show a persistent banner or modal when a `RECOMMENDATION` or `ANNOUNCEMENT` arrives over WSS or in the telemetry response.
- Must display the target zone, message, and walk minutes.
- When an event ends (`EVENT_ENDED`), show an exit screen and stop telemetry.

# TESTS
- API Client: token injection, 429 backoff handling.
- Telemetry: batching limits, clock offset application, sequence increments.
- UI: rendering a recommendation when a websocket message is received.

