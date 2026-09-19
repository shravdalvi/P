import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, ArrowRight, Gauge, TrendingUp, AlertTriangle, MapPin, Trash2, Edit2, Save, X } from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_OFFSET = [-74.0060, 40.7128]
const MAP_CENTER = [0.001 + MAP_OFFSET[0], -0.0005 + MAP_OFFSET[1]]

export default function ZonesPage() {
  const engine = useOutletContext()
  const navigate = useNavigate()
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef({})

  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneCap, setNewZoneCap] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ name: '', capacity: '' })

  // Initialize MapLibre exactly like LiveMap for a consistent view
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: MAP_CENTER,
      zoom: 14.8,
      pitch: 0,
      interactive: true,
      attributionControl: false
    })

    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  }, [])

  // Sync Markers to Engine Zones
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const currentZoneIds = new Set(engine.zones.map(z => z.id))

    // Remove markers that no longer exist
    Object.keys(markersRef.current).forEach(id => {
      if (!currentZoneIds.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    // Add or Update markers
    engine.zones.forEach(zone => {
      const lngLat = [zone.lng + MAP_OFFSET[0], zone.lat + MAP_OFFSET[1]]

      if (!markersRef.current[zone.id]) {
        const el = document.createElement('div')
        el.className = 'w-4 h-4 rounded-full border-2 border-[#161B22] flex items-center justify-center cursor-move shadow-md transition-transform hover:scale-125'
        el.style.backgroundColor = zone.risk === 'safe' ? '#22A66F' : (zone.risk === 'moderate' ? '#E4A93B' : '#E15945')
        el.title = `Drag to move ${zone.name}`

        const marker = new maplibregl.Marker({
          element: el,
          draggable: true
        })
        .setLngLat(lngLat)
        .addTo(map)

        marker.on('dragend', () => {
          const newLngLat = marker.getLngLat()
          const newLng = newLngLat.lng - MAP_OFFSET[0]
          const newLat = newLngLat.lat - MAP_OFFSET[1]

          const deltaLng = newLng - zone.lng
          const deltaLat = newLat - zone.lat

          engine.updateZone(zone.id, {
            lng: newLng,
            lat: newLat
          })
        })

        markersRef.current[zone.id] = marker
      } else {
        const marker = markersRef.current[zone.id]
        const currentPos = marker.getLngLat()
        if (Math.abs(currentPos.lng - lngLat[0]) > 0.00001 || Math.abs(currentPos.lat - lngLat[1]) > 0.00001) {
           marker.setLngLat(lngLat)
        }
        marker.getElement().style.backgroundColor = zone.risk === 'safe' ? '#22A66F' : (zone.risk === 'moderate' ? '#E4A93B' : '#E15945')
      }
    })
  }, [engine.zones, engine])

  const handleAddZone = (e) => {
    e.preventDefault()
    if (!newZoneName.trim() || !newZoneCap) return
    engine.addZone(newZoneName.trim(), newZoneCap)
    setNewZoneName('')
    setNewZoneCap('')
  }

  const startEditing = (zone) => {
    setEditingId(zone.id)
    setEditData({ name: zone.name, capacity: zone.capacity })
  }

  const saveEdit = (zoneId) => {
    engine.updateZone(zoneId, {
      name: editData.name,
      capacity: parseInt(editData.capacity, 10) || 1000
    })
    setEditingId(null)
  }

  const getRiskStyles = (risk) => {
    switch (risk) {
      case 'overcapacity':
      case 'critical':
        return 'bg-status-critical/15 text-status-critical border border-status-critical/30'
      case 'high':
        return 'bg-status-critical/10 text-status-critical border border-status-critical/20'
      case 'moderate':
        return 'bg-accent/15 text-accent border border-accent/30'
      default:
        return 'bg-status-safe/15 text-status-safe border border-status-safe/30'
    }
  }

  const getRiskLabel = (risk) => {
    switch (risk) {
      case 'overcapacity': return 'Overcapacity'
      case 'critical': return 'Critical Risk'
      case 'high': return 'High Risk'
      case 'moderate': return 'Moderate'
      default: return 'Safe'
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-semibold">VENUE ARCHITECTURE</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Zone Management</h1>
          <p className="text-[13px] text-ink-dim mt-1">
            Drag markers on the map to reposition zones. Changes instantly update telemetry on all dashboards.
          </p>
        </div>

        <form onSubmit={handleAddZone} className="flex items-center gap-2 bg-surface-raised p-2 rounded-[8px] border border-border-default">
          <input
            type="text"
            placeholder="New Zone Name"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            className="w-36 md:w-44 bg-surface-base border border-border-default rounded-[4px] px-3 py-1.5 text-[13px] text-ink outline-none focus:border-accent transition-colors"
            required
          />
          <input
            type="number"
            placeholder="Max Cap"
            value={newZoneCap}
            onChange={(e) => setNewZoneCap(e.target.value)}
            className="w-24 bg-surface-base border border-border-default rounded-[4px] px-3 py-1.5 text-[13px] text-ink outline-none focus:border-accent transition-colors"
            required
            min="10"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded-[4px] text-[13px] font-medium hover:bg-accent/90 transition-colors shrink-0"
          >
            <Plus size={16} /> Add Zone
          </button>
        </form>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-64 md:h-80 rounded-[8px] border border-border-default overflow-hidden shrink-0 relative shadow-sm"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 pb-8">
        {engine.zones.map((zone) => {
          const isEditing = editingId === zone.id;
          return (
            <div key={zone.id} className="bg-surface-panel border border-border-default rounded-[8px] p-4 flex flex-col hover:border-border-muted transition-colors shadow-sm relative group">

              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {!isEditing && (
                  <button onClick={() => startEditing(zone)} className="p-1.5 text-ink-dim hover:text-accent bg-surface-base rounded-[4px] border border-border-default">
                    <Edit2 size={13} />
                  </button>
                )}
                <button onClick={() => engine.removeZone(zone.id)} className="p-1.5 text-ink-dim hover:text-status-critical bg-surface-base rounded-[4px] border border-border-default">
                  <Trash2 size={13} />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3 mt-1">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-ink-faint">Zone Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      className="w-full bg-surface-base border border-border-default rounded-[4px] px-2 py-1.5 text-[13px] text-ink mt-1 outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-ink-faint">Max Capacity</label>
                    <input
                      type="number"
                      value={editData.capacity}
                      onChange={e => setEditData({...editData, capacity: e.target.value})}
                      className="w-full bg-surface-base border border-border-default rounded-[4px] px-2 py-1.5 text-[13px] text-ink mt-1 outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEdit(zone.id)} className="flex-1 bg-accent hover:bg-accent/90 text-white py-1.5 rounded-[4px] text-[12px] font-medium flex items-center justify-center gap-1 transition-colors">
                      <Save size={13} /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-surface-raised hover:bg-surface-base border border-border-default text-ink py-1.5 rounded-[4px] text-[12px] font-medium flex items-center justify-center gap-1 transition-colors">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 pr-14">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint truncate" title={zone.name}>{zone.name}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <h3 className="font-display text-2xl text-ink truncate">{zone.count.toLocaleString()}</h3>
                        <span className="text-[12px] text-ink-dim font-mono">/ {zone.capacity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-[12px] text-ink-dim flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-ink-faint">
                        <Gauge size={13} className="text-ink-dim" /> Occupancy %
                      </span>
                      <span className="font-mono font-medium text-ink">{(zone.ratio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-ink-faint">
                        <TrendingUp size={13} className={zone.netFlow > 0 ? 'text-status-critical' : 'text-status-safe'} /> Net Flow
                      </span>
                      <span className="font-mono font-medium text-ink">{zone.netFlow > 0 ? '+' : ''}{zone.netFlow}/min</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      engine.setSelectedZoneId(zone.id)
                      navigate('/live-map')
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[12px] font-medium text-ink bg-surface-raised hover:bg-surface-base border border-border-default rounded-[4px] py-1.5 transition-colors"
                  >
                    View telemetry <ArrowRight size={13} />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
