# Step 0: Audit Report

## 1. Backend
- **Framework:** Python, FastAPI, and Uvicorn for the HTTP/WebSocket server.
- **Existing Endpoints:** 
  - `GET /health`
  - `GET /api/event`
  - `GET /api/zones`
  - `GET /api/issues`
  - `GET /api/recommendations`
  - `POST /api/ingest/simulator` (receives raw simulation data)
  - `WS /ws` (single, basic WebSocket endpoint)
- **Auth:** Currently no authentication implemented.
- **DB Schema / Storage:** No persistent database is configured. The application state (events, venues, zones, telemetry) is held in memory within a `StateManager` instance using Pydantic models.
- **Redis and PostGIS:** Neither is currently installed or configured (missing from `requirements.txt` and `docker-compose.yml` does not exist yet).
- **How events/zones are stored:** Hardcoded in-memory state. `state_manager.event` initializes with ID `seed-event` (name via `EVENT_NAME` env var), and zones are populated dynamically based on incoming simulator data.

## 2. Website (Vibecheck Controller)
- **Framework:** React 18, Vite, Tailwind CSS.
- **Map Library:** No external map library (like Deck.gl or Mapbox) is used. It renders maps as raw SVG nodes (`<svg viewBox="...">`) directly mapped from long/lat coordinates using a custom arithmetic projection.
- **How it gets data today:** 
  - By default, uses an internal React simulator (`crowdEngine.js`).
  - Supports WebSocket integration via `backendAdapter.js` and `useBackendSync.js`. It fetches initial state from `GET /api/zones` and listens to `zone.updated` messages on the `/ws` channel.
- **Roles / Permissions:** Simple role selection in the UI (Event Admin, Operations Team, Security) defined in `Login.jsx` (`ROLES` array) without real token-based auth or a specific `view_individual_locations` permission gate.
- **Event Selector:** Currently non-existent. The app is hardcoded to a single event (`EVENT` object imported from `mockData.js`).

## 3. Contract Comparison Table

| Item | Current | CONTRACT Requirement | Change Needed |
| :--- | :--- | :--- | :--- |
| **Ingestion Endpoint** | `POST /api/ingest/simulator` (simulator specific format) | `POST /events/{id}/telemetry` | Build new endpoint implementing the exact contract (auth, batch async write to PG, write pos to Redis, contract response format, validation bounds). |
| **Presence Endpoint** | Does not exist | `POST /events/{id}/presence` | Implement endpoint to clear Redis state and emit remove delta on PAUSED/LEFT. |
| **WebSocket Protocol** | Single channel `/ws` broadcasting incremental `zone.updated` changes | Two channels: `/events/{id}/stream` (App) and `/events/{id}/dashboard` (Website) using Redis pub/sub | Rewrite WebSocket connection logic to subscribe to Redis topics. Push full `SNAPSHOT` every 1-2s. |
| **Positions Publisher** | Does not exist | Publish `POSITIONS_FULL` and `POSITIONS_DELTA` every 1s on `/events/{id}/dashboard/positions` | Build publisher worker diffing Redis positions. Update frontend to consume this channel with permission check. |
| **Auth & Scoping** | None | Event-scoped bearer tokens, role-based access for positions | Add auth middleware, enforce tokens across HTTP/WS, add permissions layer. |
| **Map Rendering** | Raw SVG elements | Render dots with a Canvas/GPU layer (e.g., `deck.gl` ScatterplotLayer) | Integrate `deck.gl` to overlay on top of existing SVG map or rewrite map rendering. Throttle to ~1fps. |
| **UI Enhancements** | Missing stale data indicator, connection state, event selector, Dots/Heatmap toggle | Required in Header badge and map controls | Build toggle switch, stale markers, event selector component, connection states. |
| **Storage & Infra** | Pure Python memory state | Redis (state/pub-sub), Postgres+PostGIS (history), Caddy/Nginx | Introduce Docker-compose for external services, add database adapters. |

## 4. Assumptions
1. We will need to set up `docker-compose` to run Postgres/PostGIS and Redis locally.
2. The `deck.gl` library can be cleanly layered on top of the existing React SVG layout without causing performance or styling regressions.
3. Mock users/auth will need to be introduced to successfully demonstrate the `view_individual_locations` gate.
4. I will replace or heavily modify `backendAdapter.js` and `useBackendSync.js` to handle the new WebSocket channels (App vs. Dashboard vs. Positions).

---
**Awaiting your "go" before starting Step 1.**

