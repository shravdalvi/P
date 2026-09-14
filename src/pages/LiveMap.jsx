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

maplibregl.setWorkerUrl(maplibreWorker)

// ─────────────────────────────────────────────────────────────────────────────
// VENUE DIGITAL TWIN GEOMETRY & STYLE
// ─────────────────────────────────────────────────────────────────────────────

const MAP_OFFSET = [-74.0060, 40.7128] // Manhattan spatial foundation
const MAP_CENTER = [0.001 + MAP_OFFSET[0], -0.0005 + MAP_OFFSET[1]]
const MAP_ZOOM = 14.8

function applyOffset(coords) {
  if (typeof coords[0] === 'number') {
    return [coords[0] + MAP_OFFSET[0], coords[1] + MAP_OFFSET[1]]
  }
  return coords.map(applyOffset)
}

const RISK_COLORS = {
  safe: { fill: '#3FB97C', border: '#3FB97C', text: '#3FB97C', bg: 'rgba(63, 185, 124, 0.12)', label: 'Safe' },
  moderate: { fill: '#E4A93B', border: '#E4A93B', text: '#E4A93B', bg: 'rgba(228, 169, 59, 0.12)', label: 'Moderate' },
  high: { fill: '#F0864B', border: '#F0864B', text: '#F0864B', bg: 'rgba(240, 134, 75, 0.12)', label: 'High' },
  critical: { fill: '#E15945', border: '#E15945', text: '#E15945', bg: 'rgba(225, 89, 69, 0.16)', label: 'Critical' },
  overcapacity: { fill: '#E15945', border: '#E15945', text: '#E15945', bg: 'rgba(225, 89, 69, 0.20)', label: 'Overcapacity' }
}

// Fixed architectural polygon coordinates for all 12 zones forming the arena district
const ZONE_COORDS = {
  'zone-a': [[-0.008, 0.0065], [0.000, 0.0065], [0.000, 0.0035], [-0.008, 0.0035], [-0.008, 0.0065]],
  'zone-b': [[0.001, 0.0065], [0.006, 0.0065], [0.006, 0.0025], [0.001, 0.0025], [0.001, 0.0065]],
  'parking': [[0.007, 0.0065], [0.011, 0.0065], [0.011, 0.0025], [0.007, 0.0025], [0.007, 0.0065]],
  'zone-d': [[-0.008, 0.0025], [-0.002, 0.0025], [-0.002, -0.0015], [-0.008, -0.0015], [-0.008, 0.0025]],
  'zone-c': [[-0.001, 0.0020], [0.005, 0.0020], [0.005, -0.0015], [-0.001, -0.0015], [-0.001, 0.0020]],
  'main-stage': [[0.006, 0.0020], [0.010, 0.0020], [0.010, -0.0015], [0.006, -0.0015], [0.006, 0.0020]],
  'zone-e': [[-0.008, -0.0025], [-0.002, -0.0025], [-0.002, -0.0055], [-0.008, -0.0055], [-0.008, -0.0025]],
  'zone-f': [[-0.001, -0.0025], [0.005, -0.0025], [0.005, -0.0055], [-0.001, -0.0055], [-0.001, -0.0025]],
  'food-court': [[0.006, -0.0025], [0.010, -0.0025], [0.010, -0.0055], [0.006, -0.0055], [0.006, -0.0025]],
  'gate-1': [[-0.008, -0.0065], [-0.002, -0.0065], [-0.002, -0.0085], [-0.008, -0.0085], [-0.008, -0.0065]],
  'gate-2': [[-0.001, -0.0065], [0.005, -0.0065], [0.005, -0.0085], [-0.001, -0.0085], [-0.001, -0.0065]],
  'exit': [[0.006, -0.0065], [0.010, -0.0065], [0.010, -0.0085], [0.006, -0.0085], [0.006, -0.0065]]
}

// Venue infrastructure lines & grounds
const VENUE_INFRA = {
  type: 'FeatureCollection',
  features: [
    // Outer Venue Perimeter
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
    // Central Main Promenade (East-West)
    {
      type: 'Feature',
      properties: { kind: 'promenade' },
      geometry: {
        type: 'LineString',
        coordinates: [[-0.010, 0.0003], [0.012, 0.0003]]
      }
    },
    // North-South Concourse Arteries
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
}

// Operational Points: Ingress/Egress Gates
const GATES = [
  { id: 'gate-n1', label: 'North Gate A', type: 'entry', lng: -0.004, lat: 0.0075 },
  { id: 'gate-e1', label: 'East Transit Gate', type: 'entry', lng: 0.009, lat: 0.0075 },
  { id: 'gate-s1', label: 'South Primary Gate 1-4', type: 'entry', lng: -0.005, lat: -0.0092 },
  { id: 'gate-s2', label: 'South Express Gate 5-8', type: 'entry', lng: 0.002, lat: -0.0092 },
  { id: 'gate-exit', label: 'South-East Main Exit', type: 'exit', lng: 0.008, lat: -0.0092 },
  { id: 'gate-west', label: 'West Concourse Exit', type: 'exit', lng: -0.009, lat: 0.0003 }
]

// IoT Gateways Mesh Coordinates
const GATEWAYS = [
  { id: 'GW-01', lng: -0.005, lat: 0.005 },
  { id: 'GW-09', lng: 0.0035, lat: 0.0045 },
  { id: 'GW-14', lng: 0.0085, lat: 0.0045 },
  { id: 'GW-19', lng: -0.005, lat: 0.0005, status: 'offline' },
  { id: 'GW-22', lng: 0.002, lat: 0.0002 },
  { id: 'GW-27', lng: 0.008, lat: 0.0002 },
  { id: 'GW-33', lng: -0.005, lat: -0.004, status: 'offline' },
  { id: 'GW-38', lng: 0.002, lat: -0.004 },
  { id: 'GW-41', lng: 0.008, lat: -0.004 }
]

function buildZonesGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => {
      const baseCoords = ZONE_COORDS[z.id] || [[-0.002, 0.002], [0.002, 0.002], [0.002, -0.002], [-0.002, -0.002], [-0.002, 0.002]]
      const coords = applyOffset(baseCoords)
      const colorObj = RISK_COLORS[z.risk] || RISK_COLORS.safe
      return {
        type: 'Feature',
        id: z.id,
        properties: {
          id: z.id,
          name: z.name,
          sub: z.name.includes('·') ? z.name.split('·')[1].trim() : z.name,
          shortName: z.name.split('·')[0].trim(),
          count: z.count,
          capacity: z.capacity,
          ratio: z.ratio,
          pct: Math.round(z.ratio * 100),
          risk: z.risk,
          fillColor: colorObj.fill,
          borderColor: colorObj.border
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      }
    })
  }
}

function buildFlowGeoJSON(zones) {
  const features = []
  zones.forEach((z) => {
    if (z.netFlow > 2 && z.neighbors) {
      z.neighbors.forEach((nId) => {
        const neighbor = zones.find((item) => item.id === nId)
        if (neighbor && neighbor.ratio < z.ratio && ZONE_COORDS[z.id] && ZONE_COORDS[neighbor.id]) {
          const start = getCenter(applyOffset(ZONE_COORDS[z.id]))
          const end = getCenter(applyOffset(ZONE_COORDS[neighbor.id]))
          features.push({
            type: 'Feature',
            properties: {
              intensity: z.risk === 'critical' ? 'critical' : z.risk === 'high' ? 'high' : 'medium'
            },
            geometry: {
              type: 'LineString',
              coordinates: [start, end]
            }
          })
        }
      })
    }
  })
  return { type: 'FeatureCollection', features }
}

function getCenter(polygon) {
  const lngs = polygon.map((c) => c[0])
  const lats = polygon.map((c) => c[1])
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LiveMapPage() {
  const engine = useOutletContext()
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const markersRef = useRef([])

  const [mapReady, setMapReady] = useState(false)
  const [showFlow, setShowFlow] = useState(true)
  const [showDevices, setShowDevices] = useState(true)
  const [showGates, setShowGates] = useState(true)
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
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
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

      map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.70,
            ['boolean', ['feature-state', 'hover'], false], 0.50,
            0.30
          ]
        }
      })

      map.addLayer({
        id: 'zone-border',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': ['get', 'borderColor'],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 3,
            ['boolean', ['feature-state', 'hover'], false], 2,
            1.2
          ],
          'line-opacity': 0.95
        }
      })

      // 3. Flow Lines Source & Layer
      const initialFlowGeo = buildFlowGeoJSON(zones)
      map.addSource('flow', { type: 'geojson', data: initialFlowGeo })

      map.addLayer({
        id: 'flow-line',
        type: 'line',
        source: 'flow',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'match', ['get', 'intensity'],
            'critical', '#E15945',
            'high', '#F0864B',
            '#58A6A6'
          ],
          'line-width': 2.5,
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

      // Render IoT Gateway Markers
      GATEWAYS.forEach((gw) => {
        const el = document.createElement('div')
        el.className = 'device-dot'
        el.setAttribute('data-layer', 'device')
        if (gw.status === 'offline') {
          el.style.background = '#E15945'
          el.style.boxShadow = '0 0 0 2px rgba(225, 89, 69, 0.4)'
        } else {
          el.style.background = '#58A6A6'
          el.style.boxShadow = '0 0 0 2px rgba(88, 166, 166, 0.3)'
        }
        el.title = `${gw.id} (${gw.status || 'online'})`

        const m = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([gw.lng + MAP_OFFSET[0], gw.lat + MAP_OFFSET[1]])
          .addTo(map)

        markersRef.current.push({ el, marker: m, type: 'device' })
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
      map.getSource('flow')?.setData(buildFlowGeoJSON(zones))
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
      map.setLayoutProperty('flow-line', 'visibility', showFlow ? 'visible' : 'none')
    } catch (_) {}
  }, [showFlow, mapReady])

  useEffect(() => {
    markersRef.current.forEach(({ el, type }) => {
      if (type === 'gate') el.style.display = showGates ? 'flex' : 'none'
      if (type === 'device') el.style.display = showDevices ? 'block' : 'none'
    })
  }, [showGates, showDevices])

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
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto min-h-full flex flex-col">
      {/* ── Header Strip ────────────────────────────────────────────────────── */}
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

      {/* ── Main Map + Detail Split ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-[640px]">
        {/* Map Column (8 cols ~67%) */}
        <div className="xl:col-span-8 bg-surface-panel border border-border-default rounded-[6px] flex flex-col overflow-hidden relative">
          {/* Map Layer Toolbar */}
          <div className="px-4 py-2.5 border-b border-border-default flex flex-wrap items-center justify-between gap-2 bg-surface-raised">
            <div className="flex items-center gap-2 text-[12px] font-mono text-ink-dim">
              <Compass size={14} className="text-accent" />
              <span>SPATIAL LAYERS</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowFlow((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  showFlow
                    ? 'border-accent bg-accent/15 text-accent font-semibold'
                    : 'border-border-default bg-surface-panel text-ink-dim hover:text-ink'
                }`}
              >
                <Activity size={12} /> Flow
              </button>

              <button
                onClick={() => setShowGates((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  showGates
                    ? 'border-accent bg-accent/15 text-accent font-semibold'
                    : 'border-border-default bg-surface-panel text-ink-dim hover:text-ink'
                }`}
              >
                <MapPin size={12} /> Gates
              </button>

              <button
                onClick={() => setShowDevices((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  showDevices
                    ? 'border-accent bg-accent/15 text-accent font-semibold'
                    : 'border-border-default bg-surface-panel text-ink-dim hover:text-ink'
                }`}
              >
                <Radio size={12} /> Sensors
              </button>
            </div>
          </div>

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

        {/* Sidebar Zone Detail Column (4 cols ~33%) */}
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
      </div>
    </div>
  )
}
