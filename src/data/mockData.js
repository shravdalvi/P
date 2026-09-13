// Seed data for the local simulator. Shapes mirror the Firestore collections
// in lib/firebase.js so this file can be replaced by a real seed script
// without touching any component.

export const EVENT = {
  name: 'Continental Cup Final 2026',
  venue: 'Meridian Arena District',
  date: 'Sep 12, 2026',
  gatesOpen: '16:00',
  kickoff: '19:30'
}

export const ZONES = [
  { id: 'zone-a', name: 'Zone A · North Stand', capacity: 4200, x: 40, y: 40, w: 150, h: 90, neighbors: ['zone-b', 'gate-1'] },
  { id: 'zone-b', name: 'Zone B · East Concourse', capacity: 3600, x: 210, y: 40, w: 150, h: 90, neighbors: ['zone-a', 'zone-c'] },
  { id: 'zone-c', name: 'Zone C · Main Stage Front', capacity: 5000, x: 210, y: 150, w: 150, h: 90, neighbors: ['zone-b', 'zone-d', 'main-stage'] },
  { id: 'zone-d', name: 'Zone D · West Concourse', capacity: 3600, x: 40, y: 150, w: 150, h: 90, neighbors: ['zone-c', 'zone-e'] },
  { id: 'zone-e', name: 'Zone E · South Stand', capacity: 4200, x: 40, y: 260, w: 150, h: 90, neighbors: ['zone-d', 'zone-f'] },
  { id: 'zone-f', name: 'Zone F · Plaza South', capacity: 2800, x: 210, y: 260, w: 150, h: 90, neighbors: ['zone-e', 'food-court'] },
  { id: 'main-stage', name: 'Main Stage Pit', capacity: 6000, x: 380, y: 150, w: 150, h: 90, neighbors: ['zone-c'] },
  { id: 'food-court', name: 'Food Court', capacity: 2200, x: 380, y: 260, w: 150, h: 90, neighbors: ['zone-f'] },
  { id: 'parking', name: 'Parking Deck', capacity: 5200, x: 380, y: 40, w: 150, h: 90, neighbors: ['gate-1'] },
  { id: 'gate-1', name: 'Entry Gates 1–4', capacity: 3000, x: 40, y: 370, w: 150, h: 70, neighbors: ['zone-a', 'zone-e'] },
  { id: 'gate-2', name: 'Entry Gates 5–8', capacity: 3000, x: 210, y: 370, w: 150, h: 70, neighbors: ['zone-c'] },
  { id: 'exit', name: 'Exit Concourse', capacity: 4000, x: 380, y: 370, w: 150, h: 70, neighbors: ['food-court'] }
]

// Starting occupancy - deliberately spans safe / moderate / high / critical
// so the palette and every state is visible on first paint.
export const INITIAL_OCCUPANCY = {
  'zone-a': 0.58,
  'zone-b': 0.71,
  'zone-c': 0.94,
  'zone-d': 0.63,
  'zone-e': 0.44,
  'zone-f': 0.52,
  'main-stage': 0.81,
  'food-court': 0.66,
  parking: 0.48,
  'gate-1': 0.35,
  'gate-2': 0.39,
  exit: 0.18
}

export const TRANSPORT_ROUTES = [
  { id: 'route-1', name: 'Shuttle Route 1 · Central Station', load: 0.62, vehicles: 8, capacity: 480 },
  { id: 'route-2', name: 'Shuttle Route 2 · Riverside Loop', load: 0.96, vehicles: 6, capacity: 360 },
  { id: 'route-3', name: 'Shuttle Route 3 · Metro Link', load: 0.72, vehicles: 10, capacity: 600 },
  { id: 'route-4', name: 'Express Bus · Airport Corridor', load: 0.41, vehicles: 5, capacity: 300 }
]

export const HOSPITALITY = [
  { id: 'hosp-a', zone: 'Zone A District', rooms: 640, occupied: 0.91, distance: '150m' },
  { id: 'hosp-b', zone: 'Zone B District', rooms: 520, occupied: 0.64, distance: '400m' },
  { id: 'hosp-c', zone: 'Zone C District', rooms: 480, occupied: 0.72, distance: '250m' },
  { id: 'hosp-d', zone: 'Zone D District', rooms: 410, occupied: 0.41, distance: '600m' }
]

export const RESPONSE_TEAMS = [
  { id: 'team-alpha', name: 'Team Alpha', members: 4, zone: 'Zone C', status: 'active' },
  { id: 'team-bravo', name: 'Team Bravo', members: 3, zone: 'Zone A', status: 'available' },
  { id: 'team-charlie', name: 'Team Charlie', members: 5, zone: 'Gate 2', status: 'available' },
  { id: 'team-delta', name: 'Team Delta', members: 3, zone: 'Food Court', status: 'busy' },
  { id: 'team-echo', name: 'Team Echo', members: 4, zone: 'Unassigned', status: 'available' }
]

export const GATEWAYS_TOTAL = 45
export const GATEWAYS_OFFLINE = ['GW-19', 'GW-33', 'GW-41']
export const SMART_BANDS_ACTIVE = 18420

export const HISTORICAL_DENSITY = [
  { t: '15:00', density: 12 },
  { t: '15:30', density: 24 },
  { t: '16:00', density: 38 },
  { t: '16:30', density: 51 },
  { t: '17:00', density: 63 },
  { t: '17:30', density: 74 },
  { t: '18:00', density: 82 },
  { t: '18:30', density: 88 },
  { t: '19:00', density: 91 },
  { t: '19:30', density: 86 }
]

export const ZONE_TREND = [
  { t: '-15m', c: 61 },
  { t: '-12m', c: 68 },
  { t: '-9m', c: 74 },
  { t: '-6m', c: 82 },
  { t: '-3m', c: 88 },
  { t: 'now', c: 94 }
]

export const INITIAL_ACTIVITY_LOG = [
  { time: '18:21', text: 'Zone C occupancy crossed 85% threshold.' },
  { time: '18:22', text: 'Prediction engine flagged capacity breach risk.' },
  { time: '18:22', text: 'Critical alert generated for Zone C.' },
  { time: '18:23', text: 'AI recommendation drafted: redistribute to Zone B / Gate 3.' }
]

export const THRESHOLDS = {
  moderate: 0.6,
  high: 0.75,
  critical: 0.9
}
