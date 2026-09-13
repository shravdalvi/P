# Pulse Command

Mega-event crowd management & hospitality orchestration platform — a command-center
web app that monitors live crowd density, predicts capacity breaches, and drafts
AI redistribution plans for operators to approve.

This is a **software-only** prototype. Smart bands, gateways, transport and
hospitality systems are represented with a local simulation engine so the full
workflow can be demoed without any physical hardware. The architecture keeps a
single seam (`src/lib/crowdEngine.js` + `src/lib/firebase.js`) so real devices
and a live Firebase project can be wired in later without touching UI code.

## Architecture

```
Smart Band / Sensor (simulated)
        ↓
Gateway / Data Ingestion   →  src/lib/crowdEngine.js (simulator)
        ↓
Firebase Backend           →  src/lib/firebase.js (adapter, off by default)
        ↓
Real-time Crowd Analytics  →  useCrowdEngine() hook
        ↓
Prediction Engine          →  predictZone()
        ↓
Risk Detection              →  classifyRisk()
        ↓
Alerts + AI Recommendations →  generated reactively as zones cross thresholds
        ↓
Central Dashboard           →  src/pages/Dashboard.jsx
```

Every domain concern is its own module: ingestion/simulation, aggregation,
risk scoring, prediction, recommendations, and each dashboard widget is a
separate component — nothing is one giant file.

## Tech stack

- React 18 + Vite
- Tailwind CSS (custom "Pulse Command" design tokens — see `tailwind.config.js`)
- react-router-dom for role-gated routing
- Recharts for analytics
- lucide-react for icons
- Firebase SDK (Auth / Firestore / Realtime DB) — wired but **off by default**

## Firebase setup (optional)

The app runs entirely on the local simulator out of the box — no Firebase
project is required to demo it. To connect a real backend later:

1. Create a Firebase project and enable Authentication, Firestore, and (optionally) Realtime Database.
2. Copy `.env.example` to `.env` and fill in your project credentials.
3. Set `VITE_USE_FIREBASE=true`.
4. Mirror the collections listed in `src/lib/firebase.js` (`COLLECTIONS`) — `zones`, `alerts`, `recommendations`, `incidents`, `transport`, `hospitality`, `responseTeams`, `activityLogs`, etc.

No component code needs to change — `crowdEngine.js` is the only file that
would start reading from Firestore instead of the simulator.

## Installation & running locally

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Demo credentials

Login runs against the simulator, not real Firebase Auth, so **any password
works**. Pick a role tab on the login screen to pre-fill its email:

| Role                 | Email                       |
|----------------------|------------------------------|
| Event Admin           | admin@pulsecommand.io       |
| Operations Team       | ops@pulsecommand.io         |
| Security / Response   | security@pulsecommand.io    |

## Demo scenario

1. Land on the Command Center — 12 zones seeded across safe, moderate, high
   and critical occupancy.
2. Use the **Simulation** bar at the top of the dashboard to switch to
   **Crowd surge** — Zone C's inflow ramps up.
3. Watch Zone C's tile pulse red on the Live Crowd Map as it crosses the
   critical threshold, a **Critical alert** appears in the Alerts panel, and
   the **Prediction Engine** projects a capacity breach.
4. An **AI Recommendation** is drafted automatically: redirect visitors to
   the best available neighboring zone, open an auxiliary gate, deploy the
   nearest response team, and increase shuttle frequency.
5. Click **Approve plan** — Zone C's occupancy eases, a response team is
   deployed, and the change is written to the **Activity Log**.
6. Switch to **Analytics** in the sidebar for historical density and
   per-zone occupancy charts.

## Roles

- **Event Admin** — full dashboard, thresholds, alerts, recommendation approval, user management.
- **Operations Team** — live dashboard, predictions, recommendations, operational response.
- **Security / Response** — assigned incidents, affected zones, response actions.

(The current build shares one dashboard shell across roles for the demo; the
`role` value returned from login is threaded through `AppShell` so
role-specific views/permissions can be layered in without restructuring.)

## Future hardware integration

`src/lib/crowdEngine.js` documents the exact reading shape a real device
pipeline should produce (`deviceId`, `zoneId`, `timestamp`, `crowdCount`,
`movementDirection`, `gatewayId`). Swapping the simulator for a real
ESP32 → gateway → mesh → Firebase pipeline means writing to the `devices` /
`crowdReadings` collections in that shape — the dashboard reads aggregated
zone state and doesn't care where it came from.
