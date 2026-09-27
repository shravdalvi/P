// Meridian Arena District (Anchored to stadium coordinates)
export const MAP_OFFSET = [-0.2795, 51.5560];
export const MAP_CENTER = [0.0035 + MAP_OFFSET[0], 0.0000 + MAP_OFFSET[1]];
export const MAP_ZOOM = 15.6;

export function applyOffset(coords) {
  if (typeof coords[0] === 'number') {
    return [coords[0] + MAP_OFFSET[0], coords[1] + MAP_OFFSET[1]];
  }
  return coords.map(applyOffset);
}

// Map styles
export const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
export const MAP_STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
export const MAP_STYLE_SUMMARY = MAP_STYLE_LIGHT;
export const MAP_STYLE_DETAILED = MAP_STYLE_LIGHT;

// Venue architectural infrastructure lines & grounds
export const VENUE_INFRA = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'perimeter', name: 'Arena Perimeter Security Fence' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-0.0095, 0.0080], [0.0160, 0.0080], [0.0160, -0.0085], [-0.0095, -0.0085], [-0.0095, 0.0080]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'inner-ring', name: 'Concourse Ring Corridor' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-0.0080, 0.0070], [0.0150, 0.0070], [0.0150, -0.0075], [-0.0080, -0.0075], [-0.0080, 0.0070]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'promenade', name: 'North Transit Boulevard' },
      geometry: {
        type: 'LineString',
        coordinates: [[-0.0095, 0.0035], [0.0160, 0.0035]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'promenade', name: 'South Concourse Corridor' },
      geometry: {
        type: 'LineString',
        coordinates: [[-0.0095, -0.0038], [0.0160, -0.0038]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'promenade', name: 'Central Spine Axis' },
      geometry: {
        type: 'LineString',
        coordinates: [[0.0000, 0.0080], [0.0000, -0.0085]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'promenade', name: 'East Grand Promenade' },
      geometry: {
        type: 'LineString',
        coordinates: [[0.0072, 0.0080], [0.0072, -0.0085]]
      }
    }
  ]
};

// Tactical Ingress/Egress Gates
export const GATES = [
  { id: 'gate-n1', label: 'North Gate A (VIP & Media)', type: 'entry', lng: -0.004, lat: 0.0072, flowRate: 420 },
  { id: 'gate-e1', label: 'East Transit Gate (Express)', type: 'entry', lng: 0.010, lat: 0.0072, flowRate: 680 },
  { id: 'gate-s1', label: 'South Primary Gate 1–4', type: 'entry', lng: -0.004, lat: -0.0072, flowRate: 950 },
  { id: 'gate-s2', label: 'South Express Gate 5–8', type: 'entry', lng: 0.0035, lat: -0.0072, flowRate: 880 },
  { id: 'gate-exit', label: 'South-East Main Exit Concourse', type: 'exit', lng: 0.011, lat: -0.0072, flowRate: 1200 },
  { id: 'gate-west', label: 'West Concourse Exit Gate', type: 'exit', lng: -0.0085, lat: 0.0000, flowRate: 740 }
];

// ESP-32 Hardware Host Gateways (Mesh Anchors)
export const ESP32_GATEWAYS = [
  { id: 'GW-01', name: 'Host GW-01 · North Stand', zoneId: 'zone-a', status: 'online', rssi: -58, bandsCount: 2436, ip: '192.168.10.21', lng: -0.0038, lat: 0.0050 },
  { id: 'GW-02', name: 'Host GW-02 · East Concourse', zoneId: 'zone-b', status: 'online', rssi: -62, bandsCount: 2556, ip: '192.168.10.22', lng: 0.0035, lat: 0.0050 },
  { id: 'GW-03', name: 'Host GW-03 · Stage Front', zoneId: 'zone-c', status: 'online', rssi: -51, bandsCount: 4700, ip: '192.168.10.23', lng: 0.0035, lat: 0.0013 },
  { id: 'GW-04', name: 'Host GW-04 · West Concourse', zoneId: 'zone-d', status: 'online', rssi: -64, bandsCount: 2268, ip: '192.168.10.24', lng: -0.0038, lat: 0.0013 },
  { id: 'GW-05', name: 'Host GW-05 · South Stand', zoneId: 'zone-e', status: 'online', rssi: -59, bandsCount: 1848, ip: '192.168.10.25', lng: -0.0038, lat: -0.0023 },
  { id: 'GW-06', name: 'Host GW-06 · Plaza South', zoneId: 'zone-f', status: 'online', rssi: -65, bandsCount: 1456, ip: '192.168.10.26', lng: 0.0035, lat: -0.0023 },
  { id: 'GW-07', name: 'Host GW-07 · Stage Pit Anchor', zoneId: 'main-stage', status: 'online', rssi: -48, bandsCount: 4860, ip: '192.168.10.27', lng: 0.0110, lat: 0.0013 },
  { id: 'GW-08', name: 'Host GW-08 · Entry Gates 1-4', zoneId: 'gate-1', status: 'online', rssi: -55, bandsCount: 1050, ip: '192.168.10.28', lng: -0.0040, lat: -0.0055 }
];
