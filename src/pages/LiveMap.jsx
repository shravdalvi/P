import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPinned, RotateCcw } from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const indoorMode = false
const defaultCenter = [-0.1232, 51.5017]
const defaultZoom = 13.5

const zoneFeatures = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'zone-a',
      properties: {
        id: 'zone-a',
        name: 'Zone A',
        risk_level: 'low',
        current_count: 850,
        capacity: 1000,
        occupancy_pct: 85,
        status: 'Low risk'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-0.127, 51.5055], [-0.117, 51.5055], [-0.117, 51.5018], [-0.127, 51.5018], [-0.127, 51.5055]]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-b',
      properties: {
        id: 'zone-b',
        name: 'Zone B',
        risk_level: 'medium',
        current_count: 920,
        capacity: 1000,
        occupancy_pct: 92,
        status: 'Medium risk'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-0.116, 51.505], [-0.106, 51.505], [-0.106, 51.501], [-0.116, 51.501], [-0.116, 51.505]]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-c',
      properties: {
        id: 'zone-c',
        name: 'Zone C',
        risk_level: 'critical',
        current_count: 1230,
        capacity: 1400,
        occupancy_pct: 88,
        status: 'Critical risk'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-0.1205, 51.504], [-0.108, 51.504], [-0.108, 51.499], [-0.1205, 51.499], [-0.1205, 51.504]]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-d',
      properties: {
        id: 'zone-d',
        name: 'Zone D',
        risk_level: 'low',
        current_count: 670,
        capacity: 900,
        occupancy_pct: 74,
        status: 'Low risk'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-0.127, 51.5005], [-0.117, 51.5005], [-0.117, 51.4965], [-0.127, 51.4965], [-0.127, 51.5005]]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-e',
      properties: {
        id: 'zone-e',
        name: 'Zone E',
        risk_level: 'high',
        current_count: 800,
        capacity: 1000,
        occupancy_pct: 80,
        status: 'High risk'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-0.116, 51.5005], [-0.106, 51.5005], [-0.106, 51.4965], [-0.116, 51.4965], [-0.116, 51.5005]]]
      }
    },
    {
      type: 'Feature',
      id: 'gate-1',
      properties: {
        id: 'gate-1',
        name: 'Gate 1',
        risk_level: 'medium',
        current_count: 720,
        capacity: 800,
        occupancy_pct: 90,
        status: 'Medium risk'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-0.1045, 51.5018], [-0.094, 51.5018], [-0.094, 51.4974], [-0.1045, 51.4974], [-0.1045, 51.5018]]]
      }
    }
  ]
}

const gateMarkers = [
  { id: 'entry-1', name: 'Entry East', lng: -0.1223, lat: 51.5037 },
  { id: 'entry-2', name: 'Entry West', lng: -0.1185, lat: 51.5007 },
  { id: 'exit-1', name: 'Exit North', lng: -0.1244, lat: 51.5009 }
]

const riskColors = {
  low: '#8ED2A6',
  medium: '#F0D97B',
  high: '#F4B067',
  critical: '#E9695D'
}

const floorPlanSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <rect width="1200" height="800" fill="#F5F7F4"/>
    <rect x="110" y="110" width="220" height="160" rx="26" fill="#EAF7F3"/>
    <rect x="420" y="110" width="260" height="170" rx="26" fill="#F8F3DE"/>
    <rect x="770" y="110" width="250" height="160" rx="26" fill="#F7E8E5"/>
    <rect x="110" y="410" width="240" height="180" rx="26" fill="#EAF7F3"/>
    <rect x="430" y="410" width="260" height="180" rx="26" fill="#F8F3DE"/>
    <rect x="780" y="410" width="220" height="180" rx="26" fill="#F7E8E5"/>
    <rect x="300" y="330" width="560" height="60" rx="20" fill="#E7EEF9"/>
    <path d="M 300 330 L 860 330 L 860 390 L 300 390 Z" fill="none" stroke="#D9E2EF" stroke-width="8"/>
    <path d="M 500 0 L 500 800" stroke="#E5E7EA" stroke-width="6"/>
    <path d="M 0 400 L 1200 400" stroke="#E5E7EA" stroke-width="6"/>
  </svg>
`)}`

const baseMapStyle = {
  version: 8,
  name: 'Crowd map base',
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-base-layer',
      type: 'raster',
      source: 'osm-raster',
      paint: { 'raster-opacity': 0.82 }
    }
  ]
}

export default function LiveMapPage() {
  const navigate = useNavigate()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const [selectedZone, setSelectedZone] = useState(zoneFeatures.features[2].properties)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: indoorMode
        ? {
          version: 8,
          sources: {
            'venue-floorplan': {
              type: 'image',
              url: floorPlanSvg,
              coordinates: [
                [-0.1255, 51.5050],
                [-0.1162, 51.5050],
                [-0.1162, 51.4985],
                [-0.1255, 51.4985]
              ]
            }
          },
          layers: [{ id: 'venue-floorplan-layer', type: 'raster', source: 'venue-floorplan', paint: { 'raster-opacity': 0.9 } }]
        } : baseMapStyle,
      center: defaultCenter,
      zoom: defaultZoom,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 2,
      fadeDuration: 0
    })

    mapRef.current = map
    if (typeof window !== 'undefined') {
      window.__map = map
    }

    map.on('load', () => {
      requestAnimationFrame(() => map.resize())

      if (indoorMode) {
        map.addSource('venue-floorplan', {
          type: 'image',
          url: floorPlanSvg,
          coordinates: [
            [-0.1255, 51.5050],
            [-0.1162, 51.5050],
            [-0.1162, 51.4985],
            [-0.1255, 51.4985]
          ]
        })

        map.addLayer({
          id: 'venue-floorplan-layer',
          type: 'raster',
          source: 'venue-floorplan',
          paint: { 'raster-opacity': 0.85 }
        })
      }

      map.addSource('zones', { type: 'geojson', data: zoneFeatures })

      map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['match', ['get', 'risk_level'], 'low', riskColors.low, 'medium', riskColors.medium, 'high', riskColors.high, 'critical', riskColors.critical, '#8ED2A6'],
          'fill-opacity': ['case', ['==', ['feature-state', 'hover'], true], 0.8, 0.62]
        }
      })

      map.addLayer({
        id: 'zone-line',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': ['match', ['get', 'risk_level'], 'low', riskColors.low, 'medium', riskColors.medium, 'high', riskColors.high, 'critical', riskColors.critical, '#8ED2A6'],
          'line-width': 3,
          'line-opacity': 1
        }
      })

      map.on('mousemove', 'zone-fill', (event) => {
        map.getCanvas().style.cursor = 'pointer'
        if (event.features && event.features[0]) {
          const featureId = event.features[0].properties.id
          map.setFeatureState({ source: 'zones', id: featureId }, { hover: true })
        }
      })

      map.on('mouseleave', 'zone-fill', () => {
        map.getCanvas().style.cursor = ''
        const sourceData = map.getSource('zones')
        if (sourceData && sourceData._data && sourceData._data.features) {
          sourceData._data.features.forEach((feature) => {
            map.setFeatureState({ source: 'zones', id: feature.id }, { hover: false })
          })
        }
      })

      map.on('click', 'zone-fill', (event) => {
        const feature = event.features?.[0]
        if (!feature) return

        const props = feature.properties
        setSelectedZone(props)
        const coords = event.lngLat
        const popupHtml = `
          <div style="font-family: Inter, sans-serif; min-width: 180px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px;">
              <div>
                <div style="font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:#798B99;">Zone</div>
                <div style="font-family:Georgia, serif; font-size:24px; color:#123047; margin-top:2px;">${props.name}</div>
              </div>
              <span style="display:inline-flex; align-items:center; justify-content:center; padding:6px 8px; border-radius:999px; font-size:11px; font-weight:600; background:${riskColors[props.risk_level] || '#8ED2A6'}22; color:${riskColors[props.risk_level] || '#8ED2A6'};">${props.status}</span>
            </div>
            <div style="display:grid; gap:6px; font-size:12px; color:#536779;">
              <div><strong style="color:#123047;">${props.current_count.toLocaleString()}</strong> / ${props.capacity.toLocaleString()}</div>
              <div>Occupancy: ${props.occupancy_pct}%</div>
            </div>
            <a href="/zones" style="display:inline-flex; align-items:center; gap:8px; margin-top:12px; color:#1E6D5B; font-weight:600; text-decoration:none;">View Full Analysis <span>→</span></a>
          </div>
        `

        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new maplibregl.Popup({ closeButton: false, offset: [0, -12], className: 'custom-map-popup' })
          .setLngLat(coords)
          .setHTML(popupHtml)
          .addTo(map)
      })

      gateMarkers.forEach((marker) => {
        const el = document.createElement('div')
        el.className = 'map-gateway-marker'
        el.title = marker.name

        const markerInstance = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([marker.lng, marker.lat])
          .addTo(map)

        markerInstance.getElement().addEventListener('click', () => {
          if (popupRef.current) popupRef.current.remove()
          const gatewayProps = {
            name: marker.name,
            current_count: 750,
            capacity: 800,
            occupancy_pct: 94,
            status: 'Medium risk',
            risk_level: 'medium'
          }
          setSelectedZone(gatewayProps)
          popupRef.current = new maplibregl.Popup({ closeButton: false, className: 'custom-map-popup', offset: [0, -10] })
            .setLngLat([marker.lng, marker.lat])
            .setHTML(`<div style="font-family: Inter, sans-serif; min-width: 170px;"><div style="font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:#798B99;">Gate</div><div style="font-family:Georgia, serif; font-size:24px; color:#123047; margin-top:2px;">${marker.name}</div><div style="margin-top:8px; font-size:12px; color:#536779;">Crowd flow is stable</div></div>`)
            .addTo(map)
        })
      })
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const resetButton = document.getElementById('reset-map-view')
    if (resetButton) {
      resetButton.onclick = () => {
        map.flyTo({ center: defaultCenter, zoom: defaultZoom, essential: true })
      }
    }

    return () => {
      if (popupRef.current) popupRef.current.remove()
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">LIVE MAP</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Crowd movement overview</h1>
      </div>

      <div className="panel p-4 lg:p-5">
        <div className="relative h-[620px] overflow-hidden rounded-[28px] border border-[#EEF1EE] bg-[#F7F8F7]">
          <div ref={mapContainerRef} className="absolute inset-0" />

          <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm border border-[#EEF1EE] text-sm text-ink">
            <MapPinned size={15} className="text-[#1E6D5B]" />
            Meridian Arena District
          </div>

          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            <button
              id="reset-map-view"
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEF1EE] bg-white text-[#123047] shadow-sm hover:bg-[#F7F7F5]"
              aria-label="Reset map view"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="absolute left-5 bottom-5 z-20 rounded-2xl border border-[#EEF1EE] bg-white p-3 shadow-panel">
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Risk legend</p>
            <div className="space-y-2 text-xs text-ink-dim">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#8ED2A6]" />Low</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#F0D97B]" />Medium</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#E9695D]" />High</div>
            </div>
          </div>

          <div className="absolute bottom-5 right-5 z-20 w-[260px] rounded-2xl border border-[#EEF1EE] bg-white p-4 shadow-panel">
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Selected zone</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl text-ink">{selectedZone.name}</h3>
                <p className="text-[12px] text-ink-dim">{selectedZone.current_count.toLocaleString()} / {selectedZone.capacity.toLocaleString()}</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: `${riskColors[selectedZone.risk_level]}22`, color: riskColors[selectedZone.risk_level] }}>
                {selectedZone.status}
              </span>
            </div>
            <button type="button" onClick={() => navigate('/zones')} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1E6D5B]">
              View Full Analysis <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
