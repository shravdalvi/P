import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, RotateCcw, Plus, Minus,
  Eye, EyeOff, Activity, Users, AlertTriangle, Gauge, MapPin, 
  ChevronRight, BarChart3, ShieldAlert
} from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MAP_CENTER  = [-0.118, 51.501]
const MAP_ZOOM    = 13.5
const MAP_STYLE   = 'https://demotiles.maplibre.org/style.json'

const RISK = {
  low:      { fill: '#8ED2A6', border: '#4FAF7A', label: 'Low',      fillOpacity: 0.45, bg: '#EAF7F0', text: '#1E6D5B' },
  medium:   { fill: '#F0D97B', border: '#C9A82A', label: 'Medium',   fillOpacity: 0.50, bg: '#FBF6DC', text: '#8A6C1B' },
  high:     { fill: '#F4A55A', border: '#D4742A', label: 'High',     fillOpacity: 0.55, bg: '#FFF2E7', text: '#A05C22' },
  critical: { fill: '#E9695D', border: '#B83C30', label: 'Critical', fillOpacity: 0.65, bg: '#FDE9E7', text: '#A33020' },
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK GEOJSON
// ─────────────────────────────────────────────────────────────────────────────

const ZONES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 'zone-a',
      properties: { id: 'zone-a', name: 'Zone A',  sub: 'North Stand',       risk_level: 'low',      count: 2450, cap: 4200, pct: 58 },
      geometry: { type: 'Polygon', coordinates: [[[-0.128, 51.506], [-0.120, 51.506], [-0.120, 51.503], [-0.128, 51.503], [-0.128, 51.506]]] }
    },
    {
      type: 'Feature', id: 'zone-b',
      properties: { id: 'zone-b', name: 'Zone B',  sub: 'East Concourse',    risk_level: 'medium',   count: 2560, cap: 3600, pct: 71 },
      geometry: { type: 'Polygon', coordinates: [[[-0.118, 51.506], [-0.110, 51.506], [-0.110, 51.503], [-0.118, 51.503], [-0.118, 51.506]]] }
    },
    {
      type: 'Feature', id: 'zone-c',
      properties: { id: 'zone-c', name: 'Zone C',  sub: 'Main Stage Front',  risk_level: 'critical', count: 4700, cap: 5000, pct: 94 },
      geometry: { type: 'Polygon', coordinates: [[[-0.118, 51.502], [-0.110, 51.502], [-0.110, 51.499], [-0.118, 51.499], [-0.118, 51.502]]] }
    },
    {
      type: 'Feature', id: 'zone-d',
      properties: { id: 'zone-d', name: 'Zone D',  sub: 'West Concourse',    risk_level: 'medium',   count: 2270, cap: 3600, pct: 63 },
      geometry: { type: 'Polygon', coordinates: [[[-0.128, 51.502], [-0.120, 51.502], [-0.120, 51.499], [-0.128, 51.499], [-0.128, 51.502]]] }
    },
    {
      type: 'Feature', id: 'zone-e',
      properties: { id: 'zone-e', name: 'Zone E',  sub: 'South Stand',       risk_level: 'low',      count: 1850, cap: 4200, pct: 44 },
      geometry: { type: 'Polygon', coordinates: [[[-0.128, 51.498], [-0.120, 51.498], [-0.120, 51.495], [-0.128, 51.495], [-0.128, 51.498]]] }
    },
    {
      type: 'Feature', id: 'zone-f',
      properties: { id: 'zone-f', name: 'Zone F',  sub: 'Plaza South',       risk_level: 'low',      count: 1460, cap: 2800, pct: 52 },
      geometry: { type: 'Polygon', coordinates: [[[-0.118, 51.498], [-0.110, 51.498], [-0.110, 51.495], [-0.118, 51.495], [-0.118, 51.498]]] }
    },
    {
      type: 'Feature', id: 'main-stage',
      properties: { id: 'main-stage', name: 'Stage', sub: 'Main Stage Pit',  risk_level: 'high',     count: 4860, cap: 6000, pct: 81 },
      geometry: { type: 'Polygon', coordinates: [[[-0.108, 51.502], [-0.100, 51.502], [-0.100, 51.499], [-0.108, 51.499], [-0.108, 51.502]]] }
    },
    {
      type: 'Feature', id: 'food-court',
      properties: { id: 'food-court', name: 'Food Court', sub: 'F&B Area',  risk_level: 'medium',   count: 1450, cap: 2200, pct: 66 },
      geometry: { type: 'Polygon', coordinates: [[[-0.108, 51.498], [-0.100, 51.498], [-0.100, 51.495], [-0.108, 51.495], [-0.108, 51.498]]] }
    },
  ]
}

const FLOW_LINES = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { intensity: 'high'   }, geometry: { type: 'LineString', coordinates: [[-0.114, 51.500], [-0.114, 51.503]] } },
    { type: 'Feature', properties: { intensity: 'high'   }, geometry: { type: 'LineString', coordinates: [[-0.118, 51.500], [-0.124, 51.500]] } },
    { type: 'Feature', properties: { intensity: 'medium' }, geometry: { type: 'LineString', coordinates: [[-0.108, 51.500], [-0.118, 51.500]] } },
    { type: 'Feature', properties: { intensity: 'low'    }, geometry: { type: 'LineString', coordinates: [[-0.124, 51.493], [-0.124, 51.495]] } },
    { type: 'Feature', properties: { intensity: 'medium' }, geometry: { type: 'LineString', coordinates: [[-0.110, 51.503], [-0.114, 51.503]] } },
  ]
}

const GATES = [
  { id: 'entry-n', label: 'Entry North', type: 'entry', lng: -0.124, lat: 51.507 },
  { id: 'entry-e', label: 'Entry East',  type: 'entry', lng: -0.100, lat: 51.504 },
  { id: 'exit-w',  label: 'Exit West',   type: 'exit',  lng: -0.129, lat: 51.500 },
  { id: 'exit-s',  label: 'Exit South',  type: 'exit',  lng: -0.114, lat: 51.492 },
]

const DEVICES = [
  { id: 'gw1', lng: -0.125, lat: 51.503 }, { id: 'gw2', lng: -0.114, lat: 51.503 },
  { id: 'gw3', lng: -0.125, lat: 51.500 }, { id: 'gw4', lng: -0.114, lat: 51.500 },
  { id: 'gw5', lng: -0.104, lat: 51.500 }, { id: 'gw6', lng: -0.104, lat: 51.496 },
  { id: 'gw7', lng: -0.114, lat: 51.496 }, { id: 'gw8', lng: -0.125, lat: 51.496 },
]

// MapLibre data-driven expressions
const FILL_COLOR_EXPR = ['match', ['get', 'risk_level'],
  'low', RISK.low.fill, 'medium', RISK.medium.fill,
  'high', RISK.high.fill, 'critical', RISK.critical.fill,
  RISK.low.fill
]
const LINE_COLOR_EXPR = ['match', ['get', 'risk_level'],
  'low', RISK.low.border, 'medium', RISK.medium.border,
  'high', RISK.high.border, 'critical', RISK.critical.border,
  RISK.low.border
]
const FLOW_COLOR_EXPR = ['match', ['get', 'intensity'],
  'high', '#E9695D', 'medium', '#F0D97B', '#8ED2A6'
]

function computeKpis(zones) {
  const feats = zones.features
  return {
    total:    feats.reduce((s, f) => s + f.properties.count, 0),
    cap:      feats.reduce((s, f) => s + f.properties.cap,   0),
    atRisk:   feats.filter(f => ['high', 'critical'].includes(f.properties.risk_level)).length,
    critical: feats.filter(f => f.properties.risk_level === 'critical').length,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LiveMapPage() {
  const navigate         = useNavigate()
  const containerRef     = useRef(null)
  const mapRef           = useRef(null)
  const gatePopupRef     = useRef(null)
  const deviceMarkersRef = useRef([])
  const hoveredIdRef     = useRef(null)

  const [liveZones,      setLiveZones]      = useState(ZONES)
  const [selectedZoneId, setSelectedZoneId] = useState('zone-c')
  const [showDevices,    setShowDevices]    = useState(true)
  const [showFlow,       setShowFlow]       = useState(true)
  const [mapReady,       setMapReady]       = useState(false)

  const kpis = computeKpis(liveZones)

  // Derive selected zone safely so it updates during live simulation
  const selectedZone = useMemo(() => {
    return liveZones.features.find(f => f.properties.id === selectedZoneId)?.properties || null
  }, [liveZones, selectedZoneId])

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container:         containerRef.current,
      style:             MAP_STYLE,
      center:            MAP_CENTER,
      zoom:              MAP_ZOOM,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 10,
    })

    mapRef.current = map

    map.on('load', () => {
      map.resize()

      // ── Zone fill ──────────────────────────────────────────────────────────
      map.addSource('zones', { type: 'geojson', data: ZONES, promoteId: 'id' })

      map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color':   FILL_COLOR_EXPR,
          'fill-opacity': [
            'case', 
            ['boolean', ['feature-state', 'hover'], false], 0.85, 
            ['boolean', ['feature-state', 'selected'], false], 0.95,
            0.55
          ],
        },
      })

      map.addLayer({
        id: 'zone-border',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color':   LINE_COLOR_EXPR,
          'line-width':   [
            'case', 
            ['boolean', ['feature-state', 'hover'], false], 3.5, 
            ['boolean', ['feature-state', 'selected'], false], 4,
            2
          ],
          'line-opacity': 1,
        },
      })

      // ── Flow lines ─────────────────────────────────────────────────────────
      map.addSource('flow', { type: 'geojson', data: FLOW_LINES })

      map.addLayer({
        id: 'flow-line',
        type: 'line',
        source: 'flow',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color':     FLOW_COLOR_EXPR,
          'line-width':     3,
          'line-opacity':   0.8,
          'line-dasharray': [2, 3],
        },
      })

      // ── Hover & Selection interaction ──────────────────────────────────────
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

      // ── Gate markers ───────────────────────────────────────────────────────
      GATES.forEach((gate) => {
        const el = document.createElement('div')
        el.className = `gate-marker gate-marker--${gate.type}`
        el.title = gate.label
        el.innerHTML = gate.type === 'entry'
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`

        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          if (gatePopupRef.current) gatePopupRef.current.remove()
          gatePopupRef.current = new maplibregl.Popup({ closeButton: true, className: 'crowd-popup', offset: [0, -12] })
            .setLngLat([gate.lng, gate.lat])
            .setHTML(`<div style="font-family:Inter,sans-serif;padding:2px 0;"><div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#798B99;margin-bottom:3px;">${gate.type === 'entry' ? 'Entry' : 'Exit'} Point</div><div style="font-family:Georgia,serif;font-size:20px;color:#123047;">${gate.label}</div><div style="margin-top:8px;font-size:12px;color:#536779;">Crowd flow is stable</div></div>`)
            .addTo(map)
        })

        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([gate.lng, gate.lat])
          .addTo(map)
      })

      // ── Device markers ─────────────────────────────────────────────────────
      DEVICES.forEach((dev) => {
        const el = document.createElement('div')
        el.className = 'device-dot'
        
        const m = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([dev.lng, dev.lat])
          .addTo(map)

        deviceMarkersRef.current.push({ el, marker: m })
      })

      setMapReady(true)
    })

    return () => {
      if (gatePopupRef.current) { gatePopupRef.current.remove(); gatePopupRef.current = null }
      deviceMarkersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Sync Selection State to MapLibre ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    // Clear old selection state
    ZONES.features.forEach(f => {
      map.setFeatureState({ source: 'zones', id: f.id }, { selected: false })
    })

    // Set new selection state
    if (selectedZoneId) {
      map.setFeatureState({ source: 'zones', id: selectedZoneId }, { selected: true })
    }
  }, [selectedZoneId, mapReady])

  // ── Sync flow layer visibility ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    try {
      map.setLayoutProperty('flow-line', 'visibility', showFlow ? 'visible' : 'none')
    } catch (_) {}
  }, [showFlow, mapReady])

  // ── Sync device marker visibility ───────────────────────────────────────────
  useEffect(() => {
    deviceMarkersRef.current.forEach(({ el }) => {
      el.style.display = showDevices ? 'block' : 'none'
    })
  }, [showDevices])

  // ── Live simulation (mock real-time updates every 4 s) ──────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setLiveZones(prev => {
        const updated = {
          ...prev,
          features: prev.features.map(f => {
            const delta    = Math.round((Math.random() - 0.47) * 80)
            const newCount = Math.max(0, Math.min(f.properties.cap, f.properties.count + delta))
            const pct      = Math.round((newCount / f.properties.cap) * 100)
            const rl       = pct >= 90 ? 'critical' : pct >= 75 ? 'high' : pct >= 60 ? 'medium' : 'low'
            return { ...f, properties: { ...f.properties, count: newCount, pct, risk_level: rl } }
          })
        }

        // Push to map source
        const map = mapRef.current
        if (map && mapReady) {
          try { map.getSource('zones')?.setData(updated) } catch (_) {}
        }

        return updated
      })
    }, 4000)
    return () => clearInterval(id)
  }, [mapReady])


  // ── Controls ────────────────────────────────────────────────────────────────
  const zoomIn  = () => mapRef.current?.zoomIn({ duration: 250 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 250 })
  const reset   = () => {
    if (gatePopupRef.current) { gatePopupRef.current.remove(); gatePopupRef.current = null }
    mapRef.current?.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, duration: 700 })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  const selRisk = selectedZone ? (RISK[selectedZone.risk_level] || RISK.low) : null

  return (
    <div className="min-h-full bg-white p-4 lg:p-8 flex flex-col gap-8">

      {/* ── Header Row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-4xl text-[#1E6D5B]">Live Map</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-[#EAF7F3] px-3 py-1 text-sm border border-[#A9DCC7]">
              <span className="w-2 h-2 rounded-full bg-[#22A66F] animate-pulse inline-block" />
              <span className="text-[#1E6D5B] font-medium tracking-wide">LIVE</span>
            </span>
          </div>
          <p className="text-sm text-[#536779]">Real-time crowd movement and zone occupancy overview.</p>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Crowd', value: kpis.total.toLocaleString(), sub: `/ ${kpis.cap.toLocaleString()}`, icon: Users, color: 'text-[#1E6D5B]', bg: 'bg-[#EAF7F3]' },
          { label: 'Critical Zones', value: kpis.critical, sub: 'Requires action', icon: AlertTriangle, color: 'text-[#E9695D]', bg: 'bg-[#FDE9E7]' },
          { label: 'At Risk Zones', value: kpis.atRisk, sub: 'Elevated occupancy', icon: ShieldAlert, color: 'text-[#F0864B]', bg: 'bg-[#FFF2E7]' },
          { label: 'Map Status', value: 'Active', sub: 'Receiving updates', icon: Activity, color: 'text-[#22A66F]', bg: 'bg-[#EAF7F0]' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-[#EEF1EE] rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1E6D5B] mb-1 opacity-80">{kpi.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#123047]">{kpi.value}</span>
                {kpi.sub && <span className="text-xs font-medium text-[#798B99]">{kpi.sub}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Split View ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[650px]">
        
        {/* Map Column (takes 3/4 width) */}
        <div className="lg:col-span-3 bg-white border border-[#EEF1EE] rounded-3xl shadow-sm flex flex-col overflow-hidden">
          
          {/* Map Toolbar */}
          <div className="px-5 py-3 border-b border-[#EEF1EE] flex items-center justify-between bg-[#FAFCFB]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1E6D5B]">
              <MapPin size={16} />
              Meridian Arena District
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFlow(v => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors
                  ${showFlow ? 'border-[#1E6D5B] bg-[#1E6D5B] text-white shadow-sm' : 'border-[#EEF1EE] bg-white text-[#536779] hover:bg-[#F3F6F4]'}`}
              >
                <Activity size={14} /> Crowd Flow
              </button>
              <button
                onClick={() => setShowDevices(v => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors
                  ${showDevices ? 'border-[#1E6D5B] bg-[#1E6D5B] text-white shadow-sm' : 'border-[#EEF1EE] bg-white text-[#536779] hover:bg-[#F3F6F4]'}`}
              >
                {showDevices ? <Eye size={14} /> : <EyeOff size={14} />} Devices
              </button>
            </div>
          </div>

          {/* MapLibre Canvas Container */}
          <div className="relative flex-1 w-full bg-[#E5E9E6] min-h-[500px]">
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />

            {/* Zoom / Reset Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button onClick={zoomIn} aria-label="Zoom In" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEF1EE] bg-white text-[#1E6D5B] shadow-sm hover:bg-[#F3F6F4] transition-all">
                <Plus size={18} />
              </button>
              <button onClick={zoomOut} aria-label="Zoom Out" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEF1EE] bg-white text-[#1E6D5B] shadow-sm hover:bg-[#F3F6F4] transition-all">
                <Minus size={18} />
              </button>
              <button onClick={reset} aria-label="Reset Map" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEF1EE] bg-white text-[#1E6D5B] shadow-sm hover:bg-[#F3F6F4] transition-all mt-2">
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Risk Legend Overlay */}
            <div className="absolute bottom-5 left-5 z-10 rounded-2xl border border-[#EEF1EE] bg-white/95 backdrop-blur-md p-4 shadow-lg w-40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1E6D5B] mb-3 opacity-80">Map Legend</p>
              <div className="space-y-2.5">
                {Object.entries(RISK).map(([key, r]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 rounded flex-shrink-0" style={{ background: r.fill, border: `2px solid ${r.border}` }} />
                    <span className="text-xs font-medium text-[#123047]">{r.label} Risk</span>
                  </div>
                ))}
                <div className="border-t border-[#EEF1EE] pt-3 mt-1 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-[#EAF7F3] border-[2.5px] border-[#1E6D5B] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#123047]">Entry Gate</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-[#FDE9E7] border-[2.5px] border-[#E9695D] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#123047]">Exit Gate</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1E6D5B] flex-shrink-0 ml-0.5" />
                    <span className="text-xs font-medium text-[#123047]">Scanner Device</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Details Column (takes 1/4 width) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          <div className="bg-white border border-[#EEF1EE] rounded-3xl p-6 shadow-sm flex-1 flex flex-col">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-[#1E6D5B] mb-6 flex items-center gap-2 opacity-80">
              <BarChart3 size={16} /> Zone Details
            </h2>

            {selectedZone ? (
              <div className="flex flex-col h-full">
                {/* Zone Header */}
                <div className="mb-6">
                  <h3 className="font-display text-3xl text-[#123047] mb-1">{selectedZone.name}</h3>
                  <p className="text-[13px] font-medium text-[#536779]">{selectedZone.sub}</p>
                </div>

                {/* Risk Badge */}
                <div className="mb-8">
                  <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ background: selRisk.bg, color: selRisk.text, border: `1px solid ${selRisk.border}40` }}>
                    {selRisk.label} Risk
                  </span>
                </div>

                {/* Occupancy Progress */}
                <div className="bg-[#FAFCFB] border border-[#EEF1EE] rounded-2xl p-5 mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-semibold text-[#536779]">Live Occupancy</span>
                    <span className="text-2xl font-bold text-[#123047] leading-none">{selectedZone.pct}%</span>
                  </div>
                  
                  <div className="h-2.5 rounded-full bg-[#E5E9E6] overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${selectedZone.pct}%`, background: selRisk.border }} />
                  </div>
                  
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#123047]">{Number(selectedZone.count).toLocaleString()} Present</span>
                    <span className="text-[#798B99]">Cap {Number(selectedZone.cap).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#EEF1EE]">
                  <button 
                    onClick={() => navigate('/zones')}
                    className="w-full flex items-center justify-between bg-[#1E6D5B] hover:bg-[#114E42] text-white px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    View Full Zone Analysis
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-[#FAFCFB] border border-[#EEF1EE] flex items-center justify-center mb-4 text-[#A9DCC7]">
                  <MapPin size={28} />
                </div>
                <p className="text-[#1E6D5B] font-semibold text-lg mb-2">No Zone Selected</p>
                <p className="text-sm text-[#536779]">Click on any zone polygon on the map to view real-time occupancy and risk data.</p>
              </div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  )
}
