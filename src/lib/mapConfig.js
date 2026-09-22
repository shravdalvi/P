// Wembley Stadium, London (a realistic concert location)
export const MAP_OFFSET = [-0.2795, 51.5560];
export const MAP_CENTER = [0.001 + MAP_OFFSET[0], -0.0005 + MAP_OFFSET[1]];
export const MAP_ZOOM = 14.8;

export function applyOffset(coords) {
  if (typeof coords[0] === 'number') {
    return [coords[0] + MAP_OFFSET[0], coords[1] + MAP_OFFSET[1]];
  }
  return coords.map(applyOffset);
}

// Map styles
export const MAP_STYLE_SUMMARY = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
export const MAP_STYLE_DETAILED = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Venue infrastructure lines & grounds
export const VENUE_INFRA = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'perimeter' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-0.0105, 0.0085], [0.0125, 0.0085], [0.0125, -0.0100], [-0.0105, -0.0100], [-0.0105, 0.0085]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'promenade' },
      geometry: {
        type: 'LineString',
        coordinates: [[-0.010, 0.0003], [0.012, 0.0003]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'promenade' },
      geometry: {
        type: 'LineString',
        coordinates: [[-0.0015, 0.008], [-0.0015, -0.0095]]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'promenade' },
      geometry: {
        type: 'LineString',
        coordinates: [[0.0055, 0.008], [0.0055, -0.0095]]
      }
    }
  ]
};

export const GATES = [
  { id: 'gate-n1', label: 'North Gate A', type: 'entry', lng: -0.004, lat: 0.0075 },
  { id: 'gate-e1', label: 'East Transit Gate', type: 'entry', lng: 0.009, lat: 0.0075 },
  { id: 'gate-s1', label: 'South Primary Gate 1-4', type: 'entry', lng: -0.005, lat: -0.0092 },
  { id: 'gate-s2', label: 'South Express Gate 5-8', type: 'entry', lng: 0.002, lat: -0.0092 },
  { id: 'gate-exit', label: 'South-East Main Exit', type: 'exit', lng: 0.008, lat: -0.0092 },
  { id: 'gate-west', label: 'West Concourse Exit', type: 'exit', lng: -0.009, lat: 0.0003 }
];
