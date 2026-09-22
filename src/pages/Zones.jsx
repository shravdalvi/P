import { useState, useMemo, useRef, useEffect } from 'react'
import { ArrowRight, Gauge, TrendingUp, AlertTriangle, Save, X, Search, Plus, Map as MapIcon, List, Crosshair } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_OFFSET, MAP_CENTER, MAP_ZOOM, applyOffset, MAP_STYLE_DETAILED, VENUE_INFRA } from '../lib/mapConfig';

function unapplyOffset(coords) {
  if (typeof coords[0] === 'number') {
    return [coords[0] - MAP_OFFSET[0], coords[1] - MAP_OFFSET[1]];
  }
  return coords.map(unapplyOffset);
}



export default function ZonesPage() {
  const engine = useOutletContext()
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editZoneId, setEditZoneId] = useState(null)
  const [newZone, setNewZone] = useState({ name: '', capacity: 2000, type: 'General', radius: 0.1 })
  const [drawingPoints, setDrawingPoints] = useState([])
  const drawingPointsRef = useRef(drawingPoints)
  useEffect(() => {
    drawingPointsRef.current = drawingPoints
  }, [drawingPoints])
  const isAddingRef = useRef(isAdding)
  useEffect(() => {
    isAddingRef.current = isAdding
  }, [isAdding])
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const filteredZones = useMemo(() => {
    if (!search) return engine.zones
    const s = search.toLowerCase()
    return engine.zones.filter(z => z.name.toLowerCase().includes(s))
  }, [engine.zones, search])

  useEffect(() => {
    if (activeTab !== 'layout') return
    if (mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE_DETAILED,
      center: MAP_CENTER,
      zoom: MAP_ZOOM
    })

    mapRef.current.on('load', () => {
      mapRef.current.addSource('draw-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
      mapRef.current.addLayer({
        id: 'draw-fill',
        type: 'fill',
        source: 'draw-data',
        paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.2 }
      })
      mapRef.current.addLayer({
        id: 'draw-preview-fill',
        type: 'fill',
        source: 'draw-preview',
        paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.1 }
      })
      mapRef.current.addLayer({
        id: 'draw-points',
        type: 'circle',
        source: 'draw-data',
        paint: { 'circle-radius': 4, 'circle-color': '#FFFFFF', 'circle-stroke-width': 2, 'circle-stroke-color': '#3B82F6' }
      })

      mapRef.current.addSource('draw-preview', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
      mapRef.current.addLayer({
        id: 'draw-preview-fill',
        type: 'fill',
        source: 'draw-preview',
        paint: {
          'fill-color': '#3B82F6',
          'fill-opacity': 0.1
        }
      })
      mapRef.current.addLayer({
        id: 'draw-preview-line',
        type: 'line',
        source: 'draw-preview',
        paint: { 'line-color': '#3B82F6', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.5 }
      })

      mapRef.current.on('mousemove', (e) => {
        if (isAddingRef.current && drawingPointsRef.current.length > 0) {
          const lastPoint = drawingPointsRef.current[drawingPointsRef.current.length - 1];
          const cursorPoint = [e.lngLat.lng, e.lngLat.lat];
          let features = [{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [lastPoint, cursorPoint] }
          }];

          if (drawingPointsRef.current.length >= 2) {
            features.push({
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [[...drawingPointsRef.current, cursorPoint, drawingPointsRef.current[0]]] }
            });
          }

          const source = mapRef.current.getSource('draw-preview');
          if (source) {
            source.setData({ type: 'FeatureCollection', features });
          }
        } else {
          const source = mapRef.current.getSource('draw-preview');
          if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
          }
        }
      });


      const offsetVenueInfra = {
        ...VENUE_INFRA,
        features: VENUE_INFRA.features.map(f => ({
          ...f,
          geometry: { ...f.geometry, coordinates: applyOffset(f.geometry.coordinates) }
        }))
      }
      mapRef.current.addSource('venue-infra', { type: 'geojson', data: offsetVenueInfra })

      mapRef.current.addLayer({
        id: 'venue-perimeter',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'perimeter'],
        paint: {
          'line-color': '#262C36',
          'line-width': 1.5,
          'line-dasharray': [4, 4]
        }
      })
      mapRef.current.addLayer({
        id: 'venue-promenade',
        type: 'line',
        source: 'venue-infra',
        filter: ['==', ['get', 'kind'], 'promenade'],
        paint: {
          'line-color': '#1C232D',
          'line-width': 14,
          'line-opacity': 0.5
        }
      })

      mapRef.current.addSource('zones-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: engine.eventLayout.objects.map(z => ({
            type: 'Feature',
            geometry: z.geometry ? { ...z.geometry, coordinates: applyOffset(z.geometry.coordinates) } : null || { type: 'Polygon', coordinates: [] },
            properties: { id: z.id, name: z.name, capacity: z.capacity }
          }))
        }
      })

      mapRef.current.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones-data',
        paint: { 'fill-color': '#CBD5E1', 'fill-opacity': 0.15 }
      })
      mapRef.current.addLayer({
        id: 'zones-line',
        type: 'line',
        source: 'zones-data',
        paint: { 'line-color': '#94A3B8', 'line-width': 1.5, 'line-dasharray': [2, 2] }
      })

      mapRef.current.on('click', (e) => {
        if (isAddingRef.current) {
          setDrawingPoints((prev) => [...prev, [e.lngLat.lng, e.lngLat.lat]])
        }
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [activeTab]) // DO NOT DEPEND ON engine.zones or eventLayout here, map should persist!

  useEffect(() => {
    if (!mapRef.current) return
    const source = mapRef.current.getSource('draw-data')
    if (!source) return

    if (drawingPoints.length === 0) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    const features = [
      {
        type: 'Feature',
        geometry: { type: 'MultiPoint', coordinates: drawingPoints }
      }
    ]
    if (drawingPoints.length > 1) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: drawingPoints }
      })
    }
    if (drawingPoints.length > 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...drawingPoints, drawingPoints[0]]] }
      })
    }
    source.setData({ type: 'FeatureCollection', features })
  }, [drawingPoints])


  useEffect(() => {
    if (activeTab === 'layout' && mapRef.current && mapRef.current.getSource('zones-data')) {
      mapRef.current.getSource('zones-data').setData({
          type: 'FeatureCollection',
          features: engine.eventLayout.objects.map(z => ({
            type: 'Feature',
            geometry: z.geometry ? { ...z.geometry, coordinates: applyOffset(z.geometry.coordinates) } : { type: 'Polygon', coordinates: [] },
            properties: { id: z.id, name: z.name, capacity: z.capacity }
          }))
      });
    }
  }, [engine.eventLayout, activeTab])

  const handleSaveZone = () => {
     if (editZoneId) {
         engine.updateZone(editZoneId, { name: newZone.name, capacity: parseInt(newZone.capacity) });
         if (drawingPoints.length >= 3) {
             const ring = [...drawingPoints, drawingPoints[0]];
         const savedRing = unapplyOffset(ring);
             const geometry = { type: 'Polygon', coordinates: [savedRing] };
             engine.updateZoneGeometry(editZoneId, geometry);
         }
         setIsAdding(false);
         setEditZoneId(null);
         setDrawingPoints([]);
     } else {
         if (drawingPoints.length < 3 || !newZone.name) return;
         const ring = [...drawingPoints, drawingPoints[0]];
         const savedRing = unapplyOffset(ring);
         const geometry = { type: 'Polygon', coordinates: [savedRing] };
         engine.addZone({
            id: 'zone-' + Date.now(),
            name: newZone.name,
            capacity: parseInt(newZone.capacity),
            count: 0,
            incoming: 0,
            outgoing: 0,
            netFlow: 0,
            ratio: 0,
            status: 'safe',
            risk: 'safe',
            type: newZone.type,
            geometry: geometry
         });
         setIsAdding(false);
         setDrawingPoints([]);
         if (mapRef.current?.getSource('draw-preview')) mapRef.current.getSource('draw-preview').setData({ type: 'FeatureCollection', features: [] });
     }
     if (mapRef.current?.getSource('placement-preview')) {
         mapRef.current.removeLayer('placement-fill')
         mapRef.current.removeSource('placement-preview')
     }
  }

  return (
    <div className="flex flex-col h-full bg-surface-base text-ink p-6 gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Zones Administration</h1>
          <p className="text-ink-dim text-sm mt-1">Manage event sector capacities and live telemetry</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-raised border border-border-default rounded-md p-1">
             <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'bg-surface-panel shadow-sm text-ink' : 'text-ink-dim hover:text-ink'}`}>
                <List size={16} /> Overview
             </button>
             <button onClick={() => setActiveTab('layout')} className={`px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors flex items-center gap-2 ${activeTab === 'layout' ? 'bg-surface-panel shadow-sm text-ink' : 'text-ink-dim hover:text-ink'}`}>
                <MapIcon size={16} /> Event Layout
             </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Datagrid */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex justify-end">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
              <input
                type="text"
                placeholder="Search zones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-surface-panel border border-border-default rounded-md text-sm focus:outline-none focus:border-accent w-64"
              />
            </div>
          </div>
          <div className="bg-surface-panel border border-border-default rounded-md shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised border-b border-border-default text-ink-dim">
                <tr>
                  <th className="px-4 py-3 font-semibold">Zone Name</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Occupancy</th>
                  <th className="px-4 py-3 font-semibold text-right">Capacity</th>
                  <th className="px-4 py-3 font-semibold text-right">Pressure</th>
                  <th className="px-4 py-3 font-semibold text-right">Net Flow</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.map(z => {
                  const ratio = (z.occupancyPercentage ?? z.ratio)
                  return (
                    <tr key={z.id} className="border-b border-border-muted/30 hover:bg-surface-raised transition-colors">
                      <td className="px-4 py-3 font-medium">{z.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${z.status === 'OFF-LIMIT' ? 'bg-status-critical/10 text-status-critical' : 'bg-status-safe/10 text-status-safe'}`}>
                          {z.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-data text-right">{(z.occupancy ?? z.count).toLocaleString()}</td>
                      <td className="px-4 py-3 font-data text-right text-ink-dim">{z.capacity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-data ${ratio > 0.85 ? 'text-status-critical' : ratio > 0.7 ? 'text-status-moderate' : 'text-status-safe'}`}>
                          {Math.round(ratio * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-data text-right text-ink-dim">{z.netFlow > 0 ? '+' : ''}{z.netFlow}/m</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Analytics */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-surface-panel border border-border-default rounded-md shadow-sm p-5 flex flex-col h-[300px]">
             <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Gauge size={16} className="text-accent"/> Global Capacity Pressure</h3>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredZones.slice(0, 10).map(z => ({ name: z.name.split('·')[0].trim().replace('Zone ', 'Z'), ratio: (z.occupancyPercentage ?? z.ratio) * 100 }))} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={80} stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', fontSize: '12px', color: '#0F172A' }} />
                    <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={16}>
                       {filteredZones.slice(0, 10).map((entry, index) => {
                         const ratio = entry.ratio
                         return <Cell key={`cell-${index}`} fill={ratio > 85 ? '#EF4444' : ratio > 70 ? '#F59E0B' : '#10B981'} />
                       })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
      ) : (
      <div className="flex-1 flex gap-4 min-h-0">
         <div className="w-80 bg-surface-panel border border-border-default rounded-md flex flex-col p-4 shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-semibold text-sm">Event Configuration</h3>
               {!isAdding && <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-hover transition-colors"><Plus size={14}/> ADD ZONE</button>}
            </div>

            {isAdding ? (
               <div className="flex flex-col gap-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-start gap-2">
                     <Crosshair size={14} className="mt-0.5 shrink-0" />
                     <span>{editZoneId ? 'Change properties below. To move it, click a new location on the map.' : 'Click on the map to place the zone anchor, then configure its properties below.'}</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-dim mb-1 block">Zone Name</label>
                    <input type="text" value={newZone.name} onChange={e => setNewZone({...newZone, name: e.target.value})} className="w-full border border-border-default rounded px-3 py-1.5 text-sm" placeholder="e.g. VIP Plaza" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-dim mb-1 block">Type</label>
                    <select value={newZone.type} onChange={e => setNewZone({...newZone, type: e.target.value})} className="w-full border border-border-default rounded px-3 py-1.5 text-sm mb-3">
                       <option value="zone">Crowd Zone</option>
                       <option value="gate">Gate</option>
                       <option value="stage">Stage</option>
                       <option value="exit">Exit</option>
                       <option value="medical">Medical</option>
                       <option value="security">Security</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-dim mb-1 block">Capacity (Persons)</label>
                    <input type="number" value={newZone.capacity} onChange={e => setNewZone({...newZone, capacity: e.target.value})} className="w-full border border-border-default rounded px-3 py-1.5 text-sm" />
                  </div>
                  <div className="bg-surface-raised p-3 rounded border border-border-default mt-2 text-xs text-ink-dim">
                     <p className="font-semibold text-ink mb-1">Drawing Mode Active</p>
                     <p>Click on the map to drop points for the polygon footprint. At least 3 points required.</p>
                     {drawingPoints.length > 0 && <button onClick={() => setDrawingPoints([])} className="mt-2 text-status-critical font-semibold">Clear Points ({drawingPoints.length})</button>}
                   </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border-default">
                     <button onClick={handleSaveZone} disabled={(!editZoneId && drawingPoints.length < 3) || !newZone.name} className="flex-1 bg-accent text-white rounded py-2 text-xs font-semibold disabled:opacity-50">{editZoneId ? 'UPDATE ZONE' : 'SAVE ZONE'}</button>
                     <button onClick={() => { setIsAdding(false); setDrawingPoints([]); if (mapRef.current?.getSource('draw-preview')) mapRef.current.getSource('draw-preview').setData({ type: 'FeatureCollection', features: [] }); setEditZoneId(null); setNewZone({ name: '', capacity: 2000, type: 'General', radius: 0.1 }); }} className="flex-1 border border-border-default text-ink-dim hover:text-ink rounded py-2 text-xs font-semibold">CANCEL</button>
                  </div>
               </div>
            ) : (
               <div className="flex-1 overflow-y-auto">
                  <span className="text-xs font-semibold text-ink-dim mb-2 block uppercase tracking-wider">Active Infrastructure</span>
                  <div className="flex flex-col gap-2">
                    {engine.eventLayout.objects.map(z => (
                       <div key={z.id} className="p-2 border border-border-default rounded bg-surface-raised flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                           <span className="text-sm font-medium">{z.name}</span>
                           <span className="text-xs font-mono text-ink-dim">{z.capacity} cap</span>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={() => { setEditZoneId(z.id); setNewZone({ name: z.name, capacity: z.capacity, type: z.type || 'General', radius: 0.1 }); setIsAdding(true); }} className="text-[10px] uppercase font-bold text-ink-dim hover:text-accent">Edit</button>
                           <button onClick={() => { if(confirm('Delete zone?')) engine.deleteZone(z.id); }} className="text-[10px] uppercase font-bold text-ink-dim hover:text-status-critical">Delete</button>
                         </div>
                       </div>
                    ))}
                  </div>
               </div>
            )}
         </div>
         <div className="flex-1 bg-surface-panel border border-border-default rounded-md overflow-hidden relative shadow-sm">
            <div ref={mapContainer} className="w-full h-full" />
         </div>
      </div>
      )}
    </div>
  )
}
