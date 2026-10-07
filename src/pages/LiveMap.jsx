import { useEffect, useRef, useState, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { RotateCcw, Plus, Minus, Activity, Users, AlertTriangle, ShieldAlert, MapPin, ChevronRight, Compass, Radio, Wifi, Cpu, ArrowRight, ShieldCheck, CheckCircle2, Zap, Layers } from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  MAP_OFFSET, MAP_CENTER, MAP_ZOOM, applyOffset,
  MAP_STYLE_LIGHT, VENUE_INFRA, GATES, ESP32_GATEWAYS
} from '../lib/mapConfig'

maplibregl.setWorkerUrl(maplibreWorker)

// ─────────────────────────────────────────────────────────────────────────────
// TACTICAL COLOR TOKENS & RISK SCORING
// ─────────────────────────────────────────────────────────────────────────────
const RISK_COLORS = {
  safe: {
    fill: '#10B981',
    border: '#34D399',
    text: '#34D399',
    bg: 'rgba(16, 185, 129, 0.18)',
    label: 'Safe',
    hex: '#10B981'
  },
  moderate: {
    fill: '#F59E0B',
    border: '#FBBF24',
    text: '#FBBF24',
    bg: 'rgba(245, 158, 11, 0.18)',
    label: 'Moderate',
    hex: '#F59E0B'
  },
  high: {
    fill: '#F97316',
    border: '#FB923C',
    text: '#FB923C',
    bg: 'rgba(249, 115, 22, 0.22)',
    label: 'High Risk',
    hex: '#F97316'
  },
  critical: {
    fill: '#EF4444',
    border: '#F87171',
    text: '#F87171',
    bg: 'rgba(239, 68, 68, 0.28)',
    label: 'Critical',
    hex: '#EF4444'
  },
  overcapacity: {
    fill: '#DC2626',
    border: '#F87171',
    text: '#F87171',
    bg: 'rgba(220, 38, 38, 0.35)',
    label: 'Overcapacity',
    hex: '#DC2626'
  }
}

function buildZonesGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => {
      let geom = z.geometry
      if (!geom) return null
      const colorObj = RISK_COLORS[z.risk] || RISK_COLORS.safe
      const isCritical = z.risk === 'critical' || z.risk === 'overcapacity' || z.status === 'OFF-LIMIT'
      const isHighRisk = z.risk === 'high'

      return {
        type: 'Feature',
        id: z.id,
        geometry: { ...geom, coordinates: applyOffset(geom.coordinates) },
        properties: {
          id: z.id,
          name: z.name,
          shortName: z.name.split('·')[0].trim(),
          sub: z.name.includes('·') ? z.name.split('·')[1].trim() : z.name,
          count: z.count,
          capacity: z.capacity,
          ratio: z.ratio,
          pct: Math.round(z.ratio * 100),
          risk: z.risk,
          isCritical,
          isHighRisk,
          isOffLimit: z.status === 'OFF-LIMIT',
          fillColor: colorObj.fill,
          borderColor: colorObj.border,
          lng: z.lng,
          lat: z.lat
        }
      }
    }).filter(Boolean)
  }
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

  if (!points || points.length === 0) return [0, 0]
  const lngs = points.map((c) => c[0]).filter((v) => typeof v === 'number')
  const lats = points.map((c) => c[1]).filter((v) => typeof v === 'number')
  if (lngs.length === 0 || lats.length === 0) return [0, 0]
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]
}

function buildZoneCentersGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => {
      const c = z.geometry ? getCenter(z.geometry) : [z.lng, z.lat]
      return {
        type: 'Feature',
        id: `${z.id}-pt`,
        geometry: { type: 'Point', coordinates: applyOffset(c) },
        properties: {
          heatWeight: z.ratio * (z.capacity / 4000)
        }
      }
    })
  }
}

function buildFlowGeoJSON(zones, recommendations) {
  const features = []
  recommendations.forEach((rec) => {
    if (rec.status === 'executing' || rec.status === 'monitoring' || rec.status === 'pending') {
      const source = zones.find((z) => z.id === rec.sourceZoneId)
      const target = zones.find((z) => z.id === rec.targetZoneId)
      if (source && target) {
        const p1 = getCenter(source.geometry)
        const p2 = getCenter(target.geometry)
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: applyOffset([p1, p2]) },
          properties: {
            intensity: rec.status === 'pending' ? 'pending' : 'redirect',
            isRedirect: true
          }
        })
      }
    }
  })
  return { type: 'FeatureCollection', features }
}

export default function LiveMapPage({ isDashboardMode = false }) {
  const engine = useOutletContext()
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const zoneBadgesRef = useRef([])
  const gatewayMarkersRef = useRef([])
  const gateMarkersRef = useRef([])

  const [mapReady, setMapReady] = useState(false)
  const [showZones, setShowZones] = useState(true)
  const [showHeat, setShowHeat] = useState(false)
  const [showGateways, setShowGateways] = useState(!isDashboardMode)
  const [showGates, setShowGates] = useState(!isDashboardMode)
  const [showFlow, setShowFlow] = useState(true)

  const zones = engine?.zones || []
  const selectedZoneId = engine?.selectedZone?.id || 'zone-c'
  const setSelectedZoneId = engine?.setSelectedZoneId || (() => {})

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || zones[0] || null
  }, [zones, selectedZoneId])

  const selRisk = selectedZone ? (RISK_COLORS[selectedZone.risk] || RISK_COLORS.safe) : RISK_COLORS.safe

  // Match selected zone with hardware gateway
  const associatedGateway = useMemo(() => {
    if (!selectedZone) return null
    return ESP32_GATEWAYS.find((gw) => gw.zoneId === selectedZone.id) || null
  }, [selectedZone])

  // Active recommendations affecting selected zone
  const activeRec = useMemo(() => {
    return (engine?.recommendations || []).find((r) => r.sourceZoneId === selectedZoneId) || null
  }, [engine?.recommendations, selectedZoneId])

  // ── Map Initialization ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_LIGHT,
      center: MAP_CENTER,
      zoom: isDashboardMode ? MAP_ZOOM - 0.3 : MAP_ZOOM,
      pitch: isDashboardMode ? 35 : 0,
      bearing: isDashboardMode ? -10 : 0,
      interactive: !isDashboardMode,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 13
    })

    mapRef.current = map

    map.on('load', () => {
      map.resize()

      // 1. Venue Architectural Infrastructure
      const offsetVenueInfra = {
        ...VENUE_INFRA,
        features: VENUE_INFRA.features.map((f) => ({
          ...f,
          geometry: { ...f.geometry, coordinates: applyOffset(f.geometry.coordinates) }
        }))
      }
      map.addSource('venue-infra', { type: 'geojson', data: offsetVenueInfra })

      // Outer Perimeter Security Boundary
      map.addLayer({
        id: 'venue-perimeter-fill',
        type: 'fill',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'perimeter'],
        paint: {
          'fill-color': '#E2E8F0',
          'fill-opacity': 0.85
        }
      })

      map.addLayer({
        id: 'venue-perimeter-border',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'perimeter'],
        paint: {
          'line-color': '#64748B',
          'line-width': 1.8,
          'line-dasharray': [4, 4]
        }
      })

      // Concourse Ring
      map.addLayer({
        id: 'venue-inner-ring',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'inner-ring'],
        paint: {
          'line-color': '#94A3B8',
          'line-width': 1.5,
          'line-dasharray': [6, 4]
        }
      })

      // Promenades & Access Corridors
      map.addLayer({
        id: 'venue-promenade',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'promenade'],
        paint: {
          'line-color': '#CBD5E1',
          'line-width': 8,
          'line-opacity': 0.9
        }
      })

      map.addLayer({
        id: 'venue-promenade-centerline',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'promenade'],
        paint: {
          'line-color': '#94A3B8',
          'line-width': 1.2,
          'line-dasharray': [3, 4]
        }
      })

      // 2. Heatmap Density Layer
      map.addSource('zone-centers', {
        type: 'geojson',
        data: buildZoneCentersGeoJSON(zones)
      })

      map.addLayer({
        id: 'heat',
        type: 'heatmap',
        source: 'zone-centers',
        maxzoom: 19,
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['get', 'heatWeight'],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            13, 0.8,
            16, 2.2,
            18, 3.5
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(16, 185, 129, 0)',
            0.2, 'rgba(16, 185, 129, 0.4)',
            0.5, 'rgba(245, 158, 11, 0.7)',
            0.75, 'rgba(249, 115, 22, 0.85)',
            0.95, 'rgba(239, 68, 68, 0.95)'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            13, 25,
            15, 60,
            17, 100
          ],
          'heatmap-opacity': 0.85
        }
      })

      // 3. Sector Polygon Sources & Layers
      map.addSource('zones', {
        type: 'geojson',
        data: buildZonesGeoJSON(zones),
        promoteId: 'id'
      })

      map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.55,
            ['boolean', ['feature-state', 'hover'], false], 0.45,
            0.32
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
            ['boolean', ['feature-state', 'selected'], false], 3.5,
            ['get', 'isCritical'], 3.0,
            2.0
          ],
          'line-opacity': 0.95
        }
      })

      // 4. Flow Redistribution Corridors
      map.addSource('flow', {
        type: 'geojson',
        data: buildFlowGeoJSON(zones, engine?.recommendations || [])
      })

      map.addLayer({
        id: 'flow-line',
        type: 'line',
        source: 'flow',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'match', ['get', 'intensity'],
            'redirect', '#38BDF8',
            'pending', '#F59E0B',
            '#34D399'
          ],
          'line-width': 3.5,
          'line-opacity': 0.9,
          'line-dasharray': [4, 4]
        }
      })

      // Interactive Click on Zones
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

      // 5. Render ESP-32 Hardware Host Gateway Markers
      ESP32_GATEWAYS.forEach((gw) => {
        const el = document.createElement('div')
        el.className = 'esp32-gateway-marker'
        el.setAttribute('data-layer', 'gateway')
        el.title = `${gw.id} · ${gw.name}`

        // Radar halo
        const halo = document.createElement('div')
        halo.className = 'esp32-radar-halo'
        el.appendChild(halo)

        // Microchip Icon
        el.innerHTML += `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`

        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          if (popupRef.current) popupRef.current.remove()
          popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'crowd-popup', offset: [0, -14] })
            .setLngLat([gw.lng + MAP_OFFSET[0], gw.lat + MAP_OFFSET[1]])
            .setHTML(`
              <div style="font-family:'SF Mono',ui-monospace,'JetBrains Mono','Roboto Mono',monospace;min-width:210px;padding:2px 0;">
                <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E2E8F0;padding-bottom:5px;margin-bottom:6px;">
                  <span style="font-size:11px;font-weight:700;color:#38BDF8;">${gw.id}</span>
                  <span style="font-size:9.5px;color:#10B981;background:rgba(16,185,129,0.15);padding:1px 5px;border-radius:4px;border:1px solid rgba(16,185,129,0.3);">ONLINE</span>
                </div>
                <div style="font-size:12px;font-weight:600;color:#F8FAFC;margin-bottom:6px;">${gw.name}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10.5px;color:#94A3B8;">
                  <div>Host IP: <span style="color:#0F172A;">${gw.ip}</span></div>
                  <div>RSSI: <span style="color:#10B981;">${gw.rssi} dBm</span></div>
                  <div>Protocol: <span style="color:#0F172A;">ESP-NOW</span></div>
                  <div>Tracked: <span style="color:#38BDF8;font-weight:700;">${gw.bandsCount}</span></div>
                </div>
              </div>
            `)
            .addTo(map)
        })

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([gw.lng + MAP_OFFSET[0], gw.lat + MAP_OFFSET[1]])
          .addTo(map)

        gatewayMarkersRef.current.push({ el, marker })
      })

      // 6. Render Tactical Gate Markers
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
              <div style="font-family:'SF Mono',ui-monospace,'JetBrains Mono','Roboto Mono',monospace;padding:2px 0;">
                <div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#94A3B8;">${gate.type.toUpperCase()} CONTROL</div>
                <div style="font-size:13px;font-weight:700;color:#0F172A;margin-top:2px;">${gate.label}</div>
                <div style="margin-top:6px;font-size:11px;color:#10B981;display:flex;align-items:center;gap:4px;">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10B981;"></span>
                  Throughput: ${gate.flowRate} visitors/hr
                </div>
              </div>
            `)
            .addTo(map)
        })

        const m = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([gate.lng + MAP_OFFSET[0], gate.lat + MAP_OFFSET[1]])
          .addTo(map)

        gateMarkersRef.current.push({ el, marker: m })
      })

      setMapReady(true)
    })

    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      zoneBadgesRef.current.forEach((m) => m.remove())
      zoneBadgesRef.current = []
      gatewayMarkersRef.current.forEach((item) => item.marker.remove())
      gatewayMarkersRef.current = []
      gateMarkersRef.current.forEach((item) => item.marker.remove())
      gateMarkersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Sync Live Engine Data to Map ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || zones.length === 0) return

    try {
      map.getSource('zones')?.setData(buildZonesGeoJSON(zones))
      map.getSource('zone-centers')?.setData(buildZoneCentersGeoJSON(zones))
      map.getSource('flow')?.setData(buildFlowGeoJSON(zones, engine?.recommendations || []))
    } catch (_) {}

    // Update Centroid Badges
    zoneBadgesRef.current.forEach((m) => m.remove())
    zoneBadgesRef.current = []

    if (showZones) {
      zones.forEach((z) => {
        const center = z.geometry ? getCenter(z.geometry) : [z.lng, z.lat]
        const riskObj = RISK_COLORS[z.risk] || RISK_COLORS.safe
        const pct = Math.round((z.occupancyPercentage ?? z.ratio) * 100)
        const isSelected = z.id === selectedZoneId
        const isCritical = z.risk === 'critical' || z.risk === 'overcapacity' || z.status === 'OFF-LIMIT'

        const el = document.createElement('div')
        el.className = `zone-centroid-badge ${isSelected ? 'selected' : ''}`
        el.innerHTML = `
          <div class="zone-badge-pill" style="border-color:${isSelected ? '#38BDF8' : riskObj.border};">
            <span class="zone-badge-dot" style="background:${riskObj.fill};${isCritical ? 'animation:criticalPulse 1.2s infinite;' : ''}"></span>
            <span style="font-family:'SF Mono',ui-monospace,'JetBrains Mono','Roboto Mono',monospace;font-size:10.5px;font-weight:600;color:#0F172A;">${z.name.split('·')[0].trim()}</span>
            <span style="font-family:'SF Mono',ui-monospace,'JetBrains Mono','Roboto Mono',monospace;font-size:10.5px;font-weight:700;color:${riskObj.text};margin-left:2px;">${pct}%</span>
          </div>
        `

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          setSelectedZoneId(z.id)
        })

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(applyOffset(center))
          .addTo(map)

        zoneBadgesRef.current.push(marker)
      })
    }
  }, [zones, mapReady, selectedZoneId, showZones])

  // ── Sync Selected Feature State in MapLibre ────────────────────────────────
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
      map.setLayoutProperty('zone-fill', 'visibility', showZones ? 'visible' : 'none')
      map.setLayoutProperty('zone-border', 'visibility', showZones ? 'visible' : 'none')
      map.setLayoutProperty('heat', 'visibility', showHeat ? 'visible' : 'none')
      map.setLayoutProperty('flow-line', 'visibility', showFlow ? 'visible' : 'none')
    } catch (_) {}

    gatewayMarkersRef.current.forEach(({ el }) => {
      el.style.display = showGateways ? 'flex' : 'none'
    })
    gateMarkersRef.current.forEach(({ el }) => {
      el.style.display = showGates ? 'flex' : 'none'
    })
  }, [showZones, showHeat, showFlow, showGateways, showGates, mapReady])

  // ── Map Controls ───────────────────────────────────────────────────────────
  const zoomIn = () => mapRef.current?.zoomIn({ duration: 250 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 250 })
  const resetView = () => {
    if (popupRef.current) popupRef.current.remove()
    mapRef.current?.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, pitch: isDashboardMode ? 35 : 0, duration: 600 })
  }

  // Active alerts for the selected zone
  const zoneAlerts = (engine?.alerts || []).filter(
    (a) => a.zoneId === selectedZoneId && a.status !== 'resolved'
  )

  const totalHeadcount = useMemo(() => {
    return zones.reduce((sum, z) => sum + (z.count || 0), 0)
  }, [zones])

  const highRiskCount = useMemo(() => {
    return zones.filter((z) => z.risk === 'critical' || z.risk === 'high' || z.status === 'OFF-LIMIT').length
  }, [zones])

  return (
    <div className={isDashboardMode ? "flex flex-col w-full h-full" : "p-4 lg:p-6 space-y-4 max-w-[1680px] mx-auto min-h-full flex flex-col font-sans"}>

      {/* ── TOP TACTICAL HUD HEADER ────────────────────────────────────────── */}
      {!isDashboardMode && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-[6px] border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 " />
              <h1 className="font-mono font-semibold text-base tracking-tight text-slate-900">
                VENUE DIGITAL TWIN // MERIDIAN ARENA DISTRICT
              </h1>
              <span className="rounded bg-teal-600/15 border border-teal-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-teal-600">
                ESP-32 MESH ACTIVE
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-1 font-mono">
              12 Sectors Under Surveillance · Real-Time Wearable Ingestion & Predictive Rerouting
            </p>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3 py-1.5 rounded-[4px] bg-slate-50 border border-slate-200 flex items-center gap-2">
              <Users size={14} className="text-teal-600" />
              <span className="text-[11px] font-mono text-slate-500 ">Total Visitors:</span>
              <span className="font-mono text-[13px] font-semibold text-slate-900">
                {totalHeadcount.toLocaleString()}
              </span>
            </div>

            <div className={`px-3 py-1.5 rounded-[4px] border flex items-center gap-2 ${
              highRiskCount > 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <AlertTriangle size={14} className={highRiskCount > 0 ? 'text-red-600 ' : 'text-teal-600'} />
              <span className="text-[11px] font-mono ">At Risk:</span>
              <span className="font-mono text-[13px] font-semibold">
                {highRiskCount} {highRiskCount === 1 ? 'Sector' : 'Sectors'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-[4px] bg-slate-50 border border-slate-200 flex items-center gap-2">
              <Wifi size={14} className="text-teal-600" />
              <span className="text-[11px] font-mono text-slate-500 ">Host Gateways:</span>
              <span className="font-mono text-[13px] font-semibold text-teal-600">
                {ESP32_GATEWAYS.length}/{ESP32_GATEWAYS.length} Online
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN MAP + TELEMETRY INSPECTOR GRID ────────────────────────────── */}
      <div className={isDashboardMode ? "flex flex-col flex-1 h-full" : "grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-[660px]"}>

        {/* Left Column: Interactive MapLibre Canvas (8 Cols) */}
        <div className={isDashboardMode ? "w-full bg-white border border-slate-200 rounded-[6px] flex flex-col overflow-hidden relative flex-1 min-h-[420px]" : "xl:col-span-8 bg-white border border-slate-200 rounded-[6px] flex flex-col overflow-hidden relative"}>

          {/* Spatial Layer Toolbar */}
          {!isDashboardMode && (
            <div className="px-3.5 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-white z-10 select-none">
              <div className="flex items-center gap-2 text-[11.5px] font-mono text-slate-500">
                <Compass size={14} className="text-teal-600" />
                <span className=" ">TACTICAL LAYERS</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setShowZones((v) => !v)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                    showZones ? 'border-[#0284C7] bg-[#E0F2FE] text-[#0369A1] font-semibold' : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ● Sectors
                </button>
                <button
                  onClick={() => setShowHeat((v) => !v)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                    showHeat ? 'border-[#D97706] bg-[#FEF3C7] text-[#B45309] font-semibold' : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ● Heatmap
                </button>
                <button
                  onClick={() => setShowGateways((v) => !v)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                    showGateways ? 'border-[#0284C7] bg-[#E0F2FE] text-[#0369A1] font-semibold' : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ● ESP-32 Gateways
                </button>
                <button
                  onClick={() => setShowFlow((v) => !v)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                    showFlow ? 'border-[#059669] bg-[#D1FAE5] text-[#047857] font-semibold' : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ● Redistribution Flow
                </button>
                <button
                  onClick={() => setShowGates((v) => !v)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                    showGates ? 'border-[#64748B] bg-[#F1F5F9] text-slate-900 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ● Perimeter Gates
                </button>
              </div>
            </div>
          )}

          {/* Map Canvas Viewport */}
          <div className="relative flex-1 w-full bg-[#F8FAFC] min-h-[500px]">
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />

            {/* Quick Camera Controls */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
              <button
                onClick={zoomIn}
                aria-label="Zoom In"
                className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-600 flex items-center justify-center transition-colors shadow-sm"
              >
                <Plus size={15} />
              </button>
              <button
                onClick={zoomOut}
                aria-label="Zoom Out"
                className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-600 flex items-center justify-center transition-colors shadow-sm"
              >
                <Minus size={15} />
              </button>
              <button
                onClick={resetView}
                aria-label="Reset Camera"
                className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-600 flex items-center justify-center transition-colors shadow-sm mt-1"
                title="Reset View"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-10 rounded-[6px] border border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2 shadow-md text-[11px] font-mono">
              <p className="text-[9.5px] text-slate-500 mb-1 font-semibold">
                RISK CLASSIFICATION
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#10B981]" />
                  <span className="text-slate-500">&lt;60% Safe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#F59E0B]" />
                  <span className="text-slate-500">60-75% Mod</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#F97316]" />
                  <span className="text-slate-500">75-90% High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#EF4444] " />
                  <span className="text-[#F87171] font-semibold">&gt;90% Critical</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Telemetry & Sector Operations (4 Cols) */}
        {!isDashboardMode && (
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-[6px] p-4 flex-1 flex flex-col shadow-sm">

              {/* Inspector Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3.5">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-teal-600" />
                  <h2 className="font-mono font-semibold text-[13px] text-slate-900">
                    SECTOR OPERATIONS
                  </h2>
                </div>
                {selectedZone && (
                  <span
                    className="px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold"
                    style={{ background: selRisk.bg, color: selRisk.text, border: `1px solid ${selRisk.border}60` }}
                  >
                    {selRisk.label}
                  </span>
                )}
              </div>

              {selectedZone ? (
                <div className="flex flex-col flex-1 space-y-4">
                  {/* Selected Sector Identity */}
                  <div>
                    <h3 className="font-mono font-semibold text-lg text-slate-900 leading-tight">
                      {selectedZone.name}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 font-mono mt-0.5">
                      Sector ID: <span className="text-slate-900">{selectedZone.id}</span> · Monitored Sector
                    </p>
                  </div>

                  {/* Real-time Occupancy Gauge */}
                  <div className="p-3.5 rounded-[6px] bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[11px] text-slate-500 font-mono  ">Live Density</span>
                      <span className="font-mono text-2xl font-bold text-slate-900">
                        {Math.round((selectedZone.occupancyPercentage ?? selectedZone.ratio) * 100)}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2 border border-slate-200">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, (selectedZone.occupancyPercentage ?? selectedZone.ratio) * 100)}%`,
                          background: selRisk.fill
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-900 font-semibold">
                        {(selectedZone.occupancy ?? selectedZone.count).toLocaleString()} present
                      </span>
                      <span className="text-slate-500">
                        Capacity: {selectedZone.capacity.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Flow Dynamics Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-[4px] bg-slate-50 border border-slate-200 text-center">
                      <p className="text-[9.5px] text-slate-500 font-mono ">Inflow</p>
                      <p className="font-mono text-[13px] text-teal-600 font-semibold mt-0.5">
                        +{selectedZone.incoming}/m
                      </p>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-slate-50 border border-slate-200 text-center">
                      <p className="text-[9.5px] text-slate-500 font-mono ">Outflow</p>
                      <p className="font-mono text-[13px] text-slate-500 font-semibold mt-0.5">
                        -{selectedZone.outgoing}/m
                      </p>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-slate-50 border border-slate-200 text-center">
                      <p className="text-[9.5px] text-slate-500 font-mono ">Net Flow</p>
                      <p className={`font-mono text-[13px] font-semibold mt-0.5 ${
                        selectedZone.netFlow > 2 ? 'text-red-600' : selectedZone.netFlow < -2 ? 'text-teal-600' : 'text-slate-500'
                      }`}>
                        {selectedZone.netFlow >= 0 ? '+' : ''}{selectedZone.netFlow}/m
                      </p>
                    </div>
                  </div>

                  {/* Hardware Anchor Telemetry (ESP-32) */}
                  <div className="p-3 rounded-[6px] bg-teal-600/5 border border-teal-600/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Cpu size={14} className="text-teal-600" />
                        <span className="text-[11px] font-mono font-semibold text-teal-600">
                          ESP-32 Host Node
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                        ONLINE
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono text-slate-500">
                      <div>Hardware: <span className="text-slate-900 font-semibold">{associatedGateway ? associatedGateway.id : 'GW-LOCAL'}</span></div>
                      <div>Signal: <span className="text-teal-600 font-semibold">{associatedGateway ? `${associatedGateway.rssi} dBm` : '-60 dBm'}</span></div>
                      <div>Active Bands: <span className="text-teal-600 font-semibold">{associatedGateway ? associatedGateway.bandsCount.toLocaleString() : (selectedZone.count * 0.9).toFixed(0)}</span></div>
                      <div>Protocol: <span className="text-slate-900">BLE 5.0 / Mesh</span></div>
                    </div>
                  </div>

                  {/* Crowd prediction & Breach Horizon */}
                  <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500 ">
                        Breach Horizon
                      </span>
                      {selectedZone.prediction?.breachIn ? (
                        <span className="text-[11px] font-mono text-red-600 font-semibold">
                          Breach ~{selectedZone.prediction.breachIn}m
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-teal-600 font-semibold">
                          Capacity Stable
                        </span>
                      )}
                    </div>
                    {selectedZone.prediction && (
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10.5px] font-mono">
                        {selectedZone.prediction.projections.map((p) => (
                          <div key={p.min} className="p-1 rounded bg-white border border-slate-200">
                            <span className="text-slate-500 text-[9.5px]">+{p.min}m: </span>
                            <span className="text-slate-900 font-semibold">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommended action & Action Buttons */}
                  {activeRec && (
                    <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-red-600 font-mono">
                        <Zap size={14} />
                        <span>AI ACTION PLAN AVAILABLE</span>
                      </div>
                      <p className="text-[11.5px] text-slate-900 font-mono leading-tight">
                        Divert excess flow toward <span className="font-semibold text-teal-600">{activeRec.targetZone}</span>.
                      </p>
                      {activeRec.status === 'pending' ? (
                        <button
                          onClick={() => engine?.approveRecommendation(activeRec.id)}
                          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-600-hover text-surface-base px-3 py-2 rounded font-mono text-[11.5px] font-semibold transition-colors shadow"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve Crowd Redirection</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-teal-600 text-[11px] font-mono font-semibold">
                          <CheckCircle2 size={13} />
                          <span>PLAN {activeRec.status.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation to Full Command Center */}
                  <div className="mt-auto pt-3 border-t border-slate-200">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-200 text-slate-900 px-4 py-2.5 rounded-[6px] border border-slate-200 text-[12px] font-mono font-medium transition-colors"
                    >
                      <span>Command Center Dashboard</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono">
                  <MapPin size={24} className="text-border-default mb-2" />
                  <p className="text-[13px] text-slate-900 font-semibold">Select a Sector on Map</p>
                  <p className="text-[11px] mt-1 text-slate-500">Tap any zone polygon or centroid chip</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
