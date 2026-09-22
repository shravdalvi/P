import { useEffect, useRef, useState, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  RotateCcw, Plus, Minus,
  Activity, Users, AlertTriangle, ShieldAlert,
  MapPin, ChevronRight, Eye, EyeOff, Radio, Users2, Compass
} from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_OFFSET, MAP_CENTER, MAP_ZOOM, applyOffset, MAP_STYLE_SUMMARY, MAP_STYLE_DETAILED, VENUE_INFRA, GATES } from '../lib/mapConfig';

maplibregl.setWorkerUrl(maplibreWorker)

// ─────────────────────────────────────────────────────────────────────────────
// VENUE DIGITAL TWIN GEOMETRY & STYLE
// ─────────────────────────────────────────────────────────────────────────────



const RISK_COLORS = {
  safe: { fill: '#3FB97C', border: '#3FB97C', text: '#3FB97C', bg: 'rgba(63, 185, 124, 0.12)', label: 'Safe' },
  moderate: { fill: '#E4A93B', border: '#E4A93B', text: '#E4A93B', bg: 'rgba(228, 169, 59, 0.12)', label: 'Moderate' },
  high: { fill: '#F0864B', border: '#F0864B', text: '#F0864B', bg: 'rgba(240, 134, 75, 0.12)', label: 'High' },
  critical: { fill: '#E15945', border: '#E15945', text: '#E15945', bg: 'rgba(225, 89, 69, 0.16)', label: 'Critical' },
  overcapacity: { fill: '#E15945', border: '#E15945', text: '#E15945', bg: 'rgba(225, 89, 69, 0.20)', label: 'Overcapacity' }
}

// Fixed architectural polygon coordinates for all 12 zones forming the arena district

// Venue infrastructure lines & grounds

// Operational Points: Ingress/Egress Gates

// IoT Gateways Mesh Coordinates


function buildZonesGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => {
      let geom = z.geometry;
      if (!geom) return null;
      const colorObj = RISK_COLORS[z.risk] || RISK_COLORS.safe;
      return {
        type: 'Feature',
        id: z.id,
        geometry: { ...geom, coordinates: applyOffset(geom.coordinates) },
        properties: {
          id: z.id,
          name: z.name,
          type: z.type || (z.id.includes('gate') ? 'gate' : z.id.includes('stage') ? 'stage' : z.id.includes('exit') ? 'exit' : 'zone'),
          sub: z.name.includes('·') ? z.name.split('·')[1].trim() : z.name,
          shortName: z.name.split('·')[0].trim(),
          count: z.count,
          capacity: z.capacity,
          ratio: z.ratio,
          pct: Math.round(z.ratio * 100),
          risk: z.risk,
          fillColor: colorObj.fill,
          borderColor: colorObj.border,
          lng: z.lng,
          lat: z.lat
        }
      }
    }).filter(Boolean)
  }
}

function pointInPolygon(point, vs) {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];
    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getCenter(geometry) {
  if (!geometry) return [0, 0]
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
  }
  let points = null
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0])) {
    points = geometry.coordinates[0]
  } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates?.[0]?.[0])) {
    points = geometry.coordinates[0][0]
  } else if (Array.isArray(geometry)) {
    if (typeof geometry[0] === 'number') return geometry
    if (Array.isArray(geometry[0])) {
      points = Array.isArray(geometry[0][0]) ? geometry[0] : geometry
    }
  } else if (geometry.lng !== undefined && geometry.lat !== undefined) {
    return [geometry.lng, geometry.lat]
  }

  if (!points || points.length === 0) {
    if (typeof geometry.lng === 'number' && typeof geometry.lat === 'number') {
      return [geometry.lng, geometry.lat]
    }
    return [0, 0]
  }

  const lngs = points.map((c) => c[0]).filter((v) => typeof v === 'number')
  const lats = points.map((c) => c[1]).filter((v) => typeof v === 'number')
  if (lngs.length === 0 || lats.length === 0) return [0, 0]
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]
}

function getStableHeatPoints(geometry) {
  if (!geometry) return []
  let ring = null
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0])) {
    ring = geometry.coordinates[0]
  } else if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    return [geometry.coordinates]
  } else if (Array.isArray(geometry)) {
    ring = Array.isArray(geometry[0]) ? geometry : null
  }

  if (!ring || ring.length < 3) {
    const center = getCenter(geometry)
    return center && (center[0] !== 0 || center[1] !== 0) ? [center] : []
  }

  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  ring.forEach(p => {
    if (Array.isArray(p)) {
      if (p[0] < minLng) minLng = p[0]
      if (p[0] > maxLng) maxLng = p[0]
      if (p[1] < minLat) minLat = p[1]
      if (p[1] > maxLat) maxLat = p[1]
    }
  })

  if (!isFinite(minLng) || !isFinite(maxLng) || !isFinite(minLat) || !isFinite(maxLat)) {
    const center = getCenter(geometry)
    return center && (center[0] !== 0 || center[1] !== 0) ? [center] : []
  }

  const points = []
  const stepX = (maxLng - minLng) / 6
  const stepY = (maxLat - minLat) / 6

  if (stepX === 0 || stepY === 0) return [ring[0]]

  for (let x = minLng + stepX/2; x < maxLng; x += stepX) {
    for (let y = minLat + stepY/2; y < maxLat; y += stepY) {
      if (pointInPolygon([x, y], ring)) {
        points.push([x, y])
      }
    }
  }

  if (points.length === 0) {
    const center = getCenter(geometry)
    if (center && (center[0] !== 0 || center[1] !== 0)) points.push(center)
  }
  return points
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────



function buildZoneCentersGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.flatMap(z => {
      const points = getStableHeatPoints(z.geometry);
      return points.map((p, i) => ({
        type: 'Feature',
        id: `${z.id}-pt-${i}`,
        geometry: { type: 'Point', coordinates: applyOffset(p) },
        properties: { heatWeight: z.ratio * (z.capacity / 5000) }
      }));
    })
  };
}

function buildFlowGeoJSON(zones, recommendations) {
  const features = [];
  recommendations.forEach(rec => {
    if (rec.status === 'executing' || rec.status === 'monitoring') {
      const source = zones.find(z => z.id === rec.sourceZoneId);
      const target = zones.find(z => z.id === rec.targetZoneId);
      if (source && target) {
        const p1 = getCenter(source.geometry);
        const p2 = getCenter(target.geometry);
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: applyOffset([p1, p2]) },
          properties: { intensity: 'redirect', isRedirect: true }
        });
      }
    }
  });
  return { type: 'FeatureCollection', features };
}

function getConvexHull(points) {
  if (points.length < 3) return points;
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lower = [];
  for (let p of points) {
    while (lower.length >= 2) {
      const p1 = lower[lower.length - 2];
      const p2 = lower[lower.length - 1];
      if ((p2[0] - p1[0]) * (p[1] - p1[1]) - (p2[1] - p1[1]) * (p[0] - p1[0]) <= 0) {
        lower.pop();
      } else break;
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2) {
      const p1 = upper[upper.length - 2];
      const p2 = upper[upper.length - 1];
      if ((p2[0] - p1[0]) * (p[1] - p1[1]) - (p2[1] - p1[1]) * (p[0] - p1[0]) <= 0) {
        upper.pop();
      } else break;
    }
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper).concat([lower[0]]); // close it
}

function getDynamicPerimeter(zones) {
  if (!zones || zones.length === 0) {
    return [[[-0.0105, 0.0085], [0.0125, 0.0085], [0.0125, -0.0100], [-0.0105, -0.0100], [-0.0105, 0.0085]]];
  }
  let allPoints = [];
  zones.forEach(z => {
    if (z.geometry) {
      if (z.geometry.type === 'Polygon' && Array.isArray(z.geometry.coordinates?.[0])) {
        allPoints.push(...z.geometry.coordinates[0]);
      } else if (z.geometry.type === 'Point' && Array.isArray(z.geometry.coordinates)) {
        allPoints.push(z.geometry.coordinates);
      }
    } else if (typeof z.lng === 'number' && typeof z.lat === 'number') {
      allPoints.push([z.lng, z.lat]);
    }
  });
  if (allPoints.length === 0) return [[[-0.0105, 0.0085], [0.0125, 0.0085], [0.0125, -0.0100], [-0.0105, -0.0100], [-0.0105, 0.0085]]];

  // Expand points slightly to act as a buffer boundary
  const centerLng = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
  const centerLat = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;
  const bufferScale = 1.05;
  const bufferedPoints = allPoints.map(p => [
    centerLng + (p[0] - centerLng) * bufferScale,
    centerLat + (p[1] - centerLat) * bufferScale
  ]);

  const hull = getConvexHull(bufferedPoints);
  return [hull];
}

export default function LiveMapPage({ isDashboardMode = false }) {
  const engine = useOutletContext()
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const markersRef = useRef([])

  const [mapReady, setMapReady] = useState(false)
  const [showFlow, setShowFlow] = useState(!isDashboardMode)
    const [showGates, setShowGates] = useState(!isDashboardMode)
  const [showHeat, setShowHeat] = useState(!isDashboardMode)
  const [showZones, setShowZones] = useState(true)
  const [showTeams, setShowTeams] = useState(true)

  // Safe fallback if engine is not provided
  const zones = engine?.zones || []
  const selectedZoneId = engine?.selectedZone?.id || 'zone-c'
  const setSelectedZoneId = engine?.setSelectedZoneId || (() => {})

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || zones[0] || null
  }, [zones, selectedZoneId])

  const selRisk = selectedZone ? (RISK_COLORS[selectedZone.risk] || RISK_COLORS.safe) : null

  // ── Map Initialization ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: isDashboardMode ? MAP_STYLE_SUMMARY : MAP_STYLE_DETAILED,
      center: MAP_CENTER,
      zoom: isDashboardMode ? MAP_ZOOM - 0.5 : MAP_ZOOM,
      pitch: isDashboardMode ? 45 : 0,
      bearing: isDashboardMode ? -15 : 0,
      interactive: !isDashboardMode, // disable panning/zooming for summary map
      attributionControl: false,
      maxZoom: 18,
      minZoom: 13
    })

    mapRef.current = map

    map.on('load', () => {
      map.resize()

      // 1. Venue Infrastructure Source & Layers
      const offsetVenueInfra = {
        ...VENUE_INFRA,
        features: VENUE_INFRA.features.map(f => ({
          ...f,
          geometry: { ...f.geometry, coordinates: applyOffset(f.geometry.coordinates) }
        }))
      }
      map.addSource('venue-infra', { type: 'geojson', data: offsetVenueInfra })

      map.addLayer({
        id: 'venue-perimeter',
        type: 'fill',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'perimeter'],
        paint: {
          'fill-color': '#12171E',
          'fill-opacity': 0.8
        }
      })

      map.addLayer({
        id: 'venue-perimeter-border',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'perimeter'],
        paint: {
          'line-color': '#262C36',
          'line-width': 1.5,
          'line-dasharray': [4, 4]
        }
      })

      map.addLayer({
        id: 'venue-promenade',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'promenade'],
        paint: {
          'line-color': '#1C232D',
          'line-width': 14,
          'line-opacity': 0.9
        }
      })

      map.addLayer({
        id: 'venue-promenade-centerline',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'promenade'],
        paint: {
          'line-color': '#2A3340',
          'line-width': 1,
          'line-dasharray': [3, 4]
        }
      })

      // 2. Zones Source & Layers
      const initialZonesGeo = buildZonesGeoJSON(zones)
      map.addSource('zones', { type: 'geojson', data: initialZonesGeo, promoteId: 'id' })
      const initialCentersGeo = buildZoneCentersGeoJSON(zones)
      map.addSource('zone-centers', { type: 'geojson', data: initialCentersGeo })

      map.addLayer({
        id: 'heat',
        type: 'heatmap',
        source: 'zone-centers',
        maxzoom: 18,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'heatWeight'],
            0, 0,
            1, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11, 0.8,
            15, 2.0,
            18, 3.0
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(34, 197, 94, 0)',
            0.15, 'rgba(34, 197, 94, 0.35)',
            0.35, 'rgba(234, 179, 8, 0.65)',
            0.65, 'rgba(249, 115, 22, 0.85)',
            0.9, 'rgba(239, 68, 68, 0.95)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11, 15,
            14, 40,
            16, 75,
            18, 120
          ],
          'heatmap-opacity': 0.85
        }
      })

      map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.20,
            ['boolean', ['feature-state', 'hover'], false], 0.15,
            0.05
          ]
        }
      })

      map.addLayer({
        id: 'zone-border',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'isOffLimit'], true], '#EF4444',
            ['==', ['get', 'isHighRisk'], true], '#F59E0B',
            '#CBD5E1'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'isOffLimit'], true], 3,
            ['==', ['get', 'isHighRisk'], true], 2,
            1
          ],
          'line-opacity': [
            'case',
            ['==', ['get', 'isOffLimit'], true], 1,
            ['==', ['get', 'isHighRisk'], true], 1,
            0.6
          ]
        }
      })

      // 3. Flow Lines Source & Layer
      const initialFlowGeo = buildFlowGeoJSON(zones, engine?.recommendations || [])
      map.addSource('flow', { type: 'geojson', data: initialFlowGeo })

      map.addLayer({
        id: 'flow-line',
        type: 'line',
        source: 'flow',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'match', ['get', 'intensity'],
            'redirect', '#0D9488', // Teal accent for active redirect
            'critical', '#E15945',
            'high', '#F0864B',
            '#58A6A6'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'isRedirect'], true], 4,
            2.5
          ],
          'line-opacity': 0.85,
          'line-dasharray': [3, 3]
        }
      })

      // Interactive Hover & Click on Zones
      let currentHoverId = null
      map.on('mousemove', 'zone-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const id = e.features?.[0]?.id
        if (id !== undefined && id !== currentHoverId) {
          if (currentHoverId != null) {
            map.setFeatureState({ source: 'zones', id: currentHoverId }, { hover: false })
          }
          currentHoverId = id
          map.setFeatureState({ source: 'zones', id }, { hover: true })
        }
      })

      map.on('mouseleave', 'zone-fill', () => {
        map.getCanvas().style.cursor = ''
        if (currentHoverId != null) {
          map.setFeatureState({ source: 'zones', id: currentHoverId }, { hover: false })
          currentHoverId = null
        }
      })

      map.on('click', 'zone-fill', (e) => {
        const id = e.features?.[0]?.id
        if (id) setSelectedZoneId(id)
      })

      // Render Gate Markers
      GATES.forEach((gate) => {
        const el = document.createElement('div')
        el.className = `gate-marker gate-marker--${gate.type}`
        el.setAttribute('data-layer', 'gate')
        el.title = gate.label
        el.innerHTML = gate.type === 'entry'
          ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
          : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`

        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          if (popupRef.current) popupRef.current.remove()
          popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'crowd-popup', offset: [0, -12] })
            .setLngLat([gate.lng + MAP_OFFSET[0], gate.lat + MAP_OFFSET[1]])
            .setHTML(`
              <div style="font-family:Inter,sans-serif;padding:3px 0;">
                <div style="font-size:10px;font-family:monospace;letter-spacing:.12em;text-transform:uppercase;color:#8B949E;">${gate.type.toUpperCase()} POINT</div>
                <div style="font-size:14px;font-weight:600;color:#E6EDF3;margin-top:2px;">${gate.label}</div>
                <div style="margin-top:6px;font-size:11.5px;color:#3FB97C;">Flow Lane Active</div>
              </div>
            `)
            .addTo(map)
        })

        const m = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([gate.lng + MAP_OFFSET[0], gate.lat + MAP_OFFSET[1]])
          .addTo(map)

        markersRef.current.push({ el, marker: m, type: 'gate' })
      })

      setMapReady(true)
    })

    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      markersRef.current.forEach((item) => item.marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Sync Live Engine Zones & Flows to MapLibre ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || zones.length === 0) return

    try {
      map.getSource('zones')?.setData(buildZonesGeoJSON(zones))
      map.getSource('zone-centers')?.setData(buildZoneCentersGeoJSON(zones))
      map.getSource('flow')?.setData(buildFlowGeoJSON(zones, engine?.recommendations || []))

      const dynamicPerimeterCoords = getDynamicPerimeter(zones)
      const offsetVenueInfra = {
        ...VENUE_INFRA,
        features: VENUE_INFRA.features.map(f => {
          if (f.properties.kind === 'perimeter') {
            return {
              ...f,
              geometry: { ...f.geometry, coordinates: applyOffset(dynamicPerimeterCoords) }
            }
          }
          return {
            ...f,
            geometry: { ...f.geometry, coordinates: applyOffset(f.geometry.coordinates) }
          }
        })
      }
      map.getSource('venue-infra')?.setData(offsetVenueInfra)
      map.getSource('flow')?.setData(buildFlowGeoJSON(zones, engine?.recommendations || []))
    } catch (_) {}
  }, [zones, mapReady])

  // ── Sync Selected Feature State ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    zones.forEach((z) => {
      map.setFeatureState({ source: 'zones', id: z.id }, { selected: z.id === selectedZoneId })
    })
  }, [selectedZoneId, mapReady, zones])

  // ── Sync Layer Toggles ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    try {
      map.setLayoutProperty('flow-line', 'visibility', showFlow ? 'visible' : 'none');
      map.setLayoutProperty('heat', 'visibility', showHeat ? 'visible' : 'none');
      map.setLayoutProperty('zone-fill', 'visibility', showZones ? 'visible' : 'none');
      map.setLayoutProperty('zone-border', 'visibility', showZones ? 'visible' : 'none');
    } catch (_) {}
  }, [showFlow, showHeat, showZones, mapReady])

  useEffect(() => {
    markersRef.current.forEach(({ el, type }) => {
      if (type === 'gate') el.style.display = showGates ? 'flex' : 'none'
          })
  }, [showGates])

  // ── Map Controls ───────────────────────────────────────────────────────────
  const zoomIn = () => mapRef.current?.zoomIn({ duration: 200 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 200 })
  const resetView = () => {
    if (popupRef.current) popupRef.current.remove()
    mapRef.current?.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, duration: 600 })
  }

  // Active alerts for the selected zone
  const zoneAlerts = (engine?.alerts || []).filter(
    (a) => a.zoneId === selectedZoneId && a.status !== 'resolved'
  )

  // Assigned team for the selected zone
  const assignedTeam = (engine?.teams || []).find((t) => t.zone === selectedZone?.name || t.zone === selectedZoneId)

  return (
    <div className={isDashboardMode ? "flex flex-col w-full h-full" : "p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto min-h-full flex flex-col"}>
      {!isDashboardMode && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-xl text-ink">Venue Digital Twin</h1>
            <span className="flex items-center gap-1.5 rounded-[4px] bg-status-safe/10 border border-status-safe/30 px-2 py-0.5 text-[11px] font-mono text-status-safe">
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse inline-block" />
              LIVE ENGINE
            </span>
          </div>
          <p className="text-[12px] text-ink-faint mt-0.5 font-mono">
            Meridian Arena District · 12 Monitored Sectors · Real-time Spatial Telemetry
          </p>
        </div>

        {/* Aggregate Spatial KPIs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-[6px] bg-surface-panel border border-border-default flex items-center gap-2">
            <Users size={14} className="text-accent" />
            <span className="text-[11px] text-ink-faint">Visitors:</span>
            <span className="font-data text-[13px] font-semibold text-ink">
              {engine?.kpis?.totalVisitors?.toLocaleString() ?? '—'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-[6px] bg-surface-panel border border-border-default flex items-center gap-2">
            <AlertTriangle size={14} className="text-status-critical" />
            <span className="text-[11px] text-ink-faint">At Risk:</span>
            <span className="font-data text-[13px] font-semibold text-status-critical">
              {engine?.kpis?.highRisk ?? 0}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* ── Main Map + Detail Split ─────────────────────────────────────────── */}
      <div className={isDashboardMode ? "flex flex-col flex-1 h-full" : "grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-[640px]"}>
        {/* Map Column (8 cols ~67%) */}
        <div className={isDashboardMode ? "w-full bg-surface-panel border border-border-default rounded-[6px] flex flex-col overflow-hidden relative flex-1 min-h-[400px]" : "xl:col-span-8 bg-surface-panel border border-border-default rounded-[6px] flex flex-col overflow-hidden relative"}>
          {/* Map Layer Toolbar */}
          {!isDashboardMode && (
          <div className="px-4 py-2.5 border-b border-border-default flex flex-wrap items-center justify-between gap-2 bg-surface-raised">
            <div className="flex items-center gap-2 text-[12px] font-mono text-ink-dim">
              <Compass size={14} className="text-accent" />
              <span>SPATIAL LAYERS</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">

<button onClick={() => setShowHeat(v => !v)} className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-mono transition-colors ${showHeat ? 'border-accent bg-accent/15 text-accent font-semibold' : 'border-border-default bg-surface-panel text-ink-dim hover:text-ink'}`}>Heat</button>
<button onClick={() => setShowZones(v => !v)} className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-mono transition-colors ${showZones ? 'border-accent bg-accent/15 text-accent font-semibold' : 'border-border-default bg-surface-panel text-ink-dim hover:text-ink'}`}>Zones</button>
<button onClick={() => setShowFlow(v => !v)} className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-mono transition-colors ${showFlow ? 'border-accent bg-accent/15 text-accent font-semibold' : 'border-border-default bg-surface-panel text-ink-dim hover:text-ink'}`}>Flow</button>
<button onClick={() => setShowGates(v => !v)} className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-mono transition-colors ${showGates ? 'border-accent bg-accent/15 text-accent font-semibold' : 'border-border-default bg-surface-panel text-ink-dim hover:text-ink'}`}>Infrastructure</button>

            </div>
          </div>
          )}

          {/* MapLibre Canvas Viewport */}
          <div className="relative flex-1 w-full bg-[#0B0F14] min-h-[520px]">
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />

            {/* Map Controls */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
              <button
                onClick={zoomIn}
                aria-label="Zoom In"
                className="w-8 h-8 rounded-[4px] bg-surface-panel border border-border-default text-ink hover:text-accent hover:border-accent flex items-center justify-center transition-colors shadow-md"
              >
                <Plus size={15} />
              </button>
              <button
                onClick={zoomOut}
                aria-label="Zoom Out"
                className="w-8 h-8 rounded-[4px] bg-surface-panel border border-border-default text-ink hover:text-accent hover:border-accent flex items-center justify-center transition-colors shadow-md"
              >
                <Minus size={15} />
              </button>
              <button
                onClick={resetView}
                aria-label="Reset Camera"
                className="w-8 h-8 rounded-[4px] bg-surface-panel border border-border-default text-ink hover:text-accent hover:border-accent flex items-center justify-center transition-colors shadow-md mt-1"
                title="Reset View"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-10 rounded-[6px] border border-border-default bg-surface-panel/95 backdrop-blur px-3 py-2.5 shadow-lg text-[11px]">
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-ink-faint mb-1.5">
                Occupancy Risk
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-status-safe" />
                  <span className="text-ink-dim">&lt;60% Safe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-status-moderate" />
                  <span className="text-ink-dim">60-75% Mod</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-status-high" />
                  <span className="text-ink-dim">75-90% High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-status-critical animate-pulse" />
                  <span className="text-ink-dim">&gt;90% Crit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isDashboardMode && (
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-surface-panel border border-border-default rounded-[6px] p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-border-default mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-accent" />
                <h2 className="font-display font-semibold text-[14px] uppercase tracking-wider text-ink">
                  Sector Telemetry
                </h2>
              </div>
              {selectedZone && (
                <span
                  className="px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-semibold"
                  style={{ background: selRisk.bg, color: selRisk.text, border: `1px solid ${selRisk.border}40` }}
                >
                  {selRisk.label.toUpperCase()}
                </span>
              )}
            </div>

            {selectedZone ? (
              <div className="flex flex-col flex-1 space-y-4">
                {/* Zone Identity */}
                <div>
                  <h3 className="font-display font-bold text-xl text-ink leading-tight">
                    {selectedZone.name}
                  </h3>
                  <p className="text-[12px] text-ink-faint font-mono mt-0.5">
                    Sector ID: {selectedZone.id} · Monitored Node
                  </p>
                </div>

                {/* Occupancy Meter */}
                <div className="p-3.5 rounded-[6px] bg-surface-raised border border-border-default">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[11.5px] text-ink-faint font-mono">Live Density</span>
                    <span className="font-data text-2xl font-bold text-ink">
                      {Math.round(selectedZone.ratio * 100)}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-surface-panel overflow-hidden mb-2.5 border border-border-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, selectedZone.ratio * 100)}%`,
                        background: selRisk.fill
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11.5px] font-data">
                    <span className="text-ink">
                      {selectedZone.count.toLocaleString()} present
                    </span>
                    <span className="text-ink-faint">
                      Cap: {selectedZone.capacity.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Flow Dynamics Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-[4px] bg-surface-raised border border-border-default text-center">
                    <p className="text-[10px] text-ink-faint font-mono uppercase">Inflow</p>
                    <p className="font-data text-[13px] text-status-safe font-semibold mt-0.5">
                      +{selectedZone.incoming}/m
                    </p>
                  </div>
                  <div className="p-2.5 rounded-[4px] bg-surface-raised border border-border-default text-center">
                    <p className="text-[10px] text-ink-faint font-mono uppercase">Outflow</p>
                    <p className="font-data text-[13px] text-ink-dim font-semibold mt-0.5">
                      -{selectedZone.outgoing}/m
                    </p>
                  </div>
                  <div className="p-2.5 rounded-[4px] bg-surface-raised border border-border-default text-center">
                    <p className="text-[10px] text-ink-faint font-mono uppercase">Net Flow</p>
                    <p className={`font-data text-[13px] font-semibold mt-0.5 ${
                      selectedZone.netFlow > 2 ? 'text-status-critical' : 'text-accent'
                    }`}>
                      {selectedZone.netFlow >= 0 ? '+' : ''}{selectedZone.netFlow}/m
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-[4px] bg-surface-raised border border-border-default">
                    <span className="text-[11px] font-mono text-ink-faint uppercase">Remaining Cap</span>
                    <span className="font-data text-[13px] font-semibold text-ink">{Math.max(0, selectedZone.capacity - selectedZone.count).toLocaleString()}</span>
                  </div>
                {/* Predictive Horizon */}
                {selectedZone.prediction && (
                  <div className="p-3 rounded-[6px] bg-surface-raised border border-border-default">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-ink-faint uppercase">
                        Forward Horizon
                      </span>
                      {selectedZone.prediction.breachIn ? (
                        <span className="text-[10.5px] font-mono text-status-critical font-semibold">
                          Breach ~{selectedZone.prediction.breachIn}m
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-mono text-status-safe">
                          Stable Horizon
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-data">
                      {selectedZone.prediction.projections.map((p) => (
                        <div key={p.min} className="p-1 rounded bg-surface-panel border border-border-muted">
                          <span className="text-ink-faint text-[9.5px]">+{p.min}m: </span>
                          <span className="text-ink font-semibold">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Alerts in Zone */}
                {zoneAlerts.length > 0 && (
                  <div className="p-3 rounded-[6px] bg-status-critical/10 border border-status-critical/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-status-critical">
                      <ShieldAlert size={14} />
                      <span>{zoneAlerts.length} Active Incident(s)</span>
                    </div>
                    <p className="text-[12px] text-ink leading-snug">
                      {zoneAlerts[0].description}
                    </p>
                  </div>
                )}

                {/* Response Team Context */}
                {assignedTeam && (
                  <div className="p-2.5 rounded-[4px] bg-surface-raised border border-border-default flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-2">
                      <Users2 size={14} className="text-accent" />
                      <span className="text-ink-dim">{assignedTeam.name}</span>
                    </div>
                    <span className="font-mono text-[10.5px] text-status-safe uppercase">
                      {assignedTeam.status}
                    </span>
                  </div>
                )}

                {/* Navigation to Full Command Center */}
                <div className="mt-auto pt-3 border-t border-border-default">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center justify-between bg-surface-raised hover:bg-surface-overlay text-ink px-4 py-2.5 rounded-[6px] border border-border-default text-[12.5px] font-medium transition-colors"
                  >
                    <span>Inspect In Command Center</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-faint">
                <MapPin size={24} className="text-border-default mb-2" />
                <p className="text-[13px] text-ink-dim">Select a Sector on Map</p>
                <p className="text-[11.5px] mt-1">Tap any zone polygon to inspect live telemetry</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
