import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ZONES,
  INITIAL_OCCUPANCY,
  TRANSPORT_ROUTES,
  HOSPITALITY,
  RESPONSE_TEAMS,
  GATEWAYS_TOTAL,
  GATEWAYS_OFFLINE,
  SMART_BANDS_ACTIVE,
  INITIAL_ACTIVITY_LOG,
  THRESHOLDS
} from '../data/mockData.js'

// -----------------------------------------------------------------------
// Risk classification - pure function so it can be unit tested or swapped
// for a server-side rule engine later.
// -----------------------------------------------------------------------
export function classifyRisk(occupancyRatio, thresholds = THRESHOLDS) {
  if (occupancyRatio >= 1) return 'overcapacity'
  if (occupancyRatio >= thresholds.critical) return 'critical'
  if (occupancyRatio >= thresholds.high) return 'high'
  if (occupancyRatio >= thresholds.moderate) return 'moderate'
  return 'safe'
}

export const STATUS_META = {
  safe: { label: 'Safe', color: 'status-safe' },
  moderate: { label: 'Moderate', color: 'status-moderate' },
  high: { label: 'High risk', color: 'status-high' },
  critical: { label: 'Critical', color: 'status-critical' },
  overcapacity: { label: 'Overcapacity', color: 'status-critical' }
}

// -----------------------------------------------------------------------
// Lightweight explainable predictor - linear extrapolation of net flow.
// Deliberately simple + swappable: replace the body of `predictZone` with
// a call to a trained model and every consumer keeps working unchanged.
// -----------------------------------------------------------------------
export function predictZone(zone) {
  const { count, capacity, netFlow } = zone
  const horizons = [5, 10, 15]
  const projections = horizons.map((min) => ({
    min,
    value: Math.max(0, Math.round(count + netFlow * min))
  }))

  let breachIn = null
  if (netFlow > 0 && count < capacity) {
    breachIn = Math.round((capacity - count) / netFlow)
    if (breachIn > 45) breachIn = null
  }

  return { projections, breachIn }
}

function seedZones() {
  return ZONES.map((z) => {
    const ratio = INITIAL_OCCUPANCY[z.id] ?? 0.4
    const count = Math.round(z.capacity * ratio)
    return {
      ...z,
      count,
      incoming: Math.round(2 + Math.random() * 6),
      outgoing: Math.round(1 + Math.random() * 4),
      netFlow: 0,
      dwell: Math.round(8 + Math.random() * 20)
    }
  })
}

const SCENARIOS = {
  normal: { label: 'Normal crowd', biasZone: null, biasStrength: 0 },
  surge: { label: 'Crowd surge', biasZone: 'zone-c', biasStrength: 9 },
  congestion: { label: 'Network congestion', biasZone: null, biasStrength: 0, network: true }
}

export function useCrowdEngine() {
  const [running, setRunning] = useState(true)
  const [scenario, setScenario] = useState('normal')
  const [zones, setZones] = useState(seedZones)
  const [alerts, setAlerts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [activityLog, setActivityLog] = useState(INITIAL_ACTIVITY_LOG)
  const [transport, setTransport] = useState(TRANSPORT_ROUTES)
  const [hospitality] = useState(HOSPITALITY)
  const [teams, setTeams] = useState(RESPONSE_TEAMS)
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [tick, setTick] = useState(0)

  const seenAlertZones = useRef(new Set())
  const seenRecZones = useRef(new Set())

  const pushLog = useCallback((text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setActivityLog((prev) => [{ time, text }, ...prev].slice(0, 40))
  }, [])

  // Simulation tick
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setTick((t) => t + 1)

      setZones((prev) =>
        prev.map((z) => {
          const bias =
            SCENARIOS[scenario].biasZone === z.id
              ? SCENARIOS[scenario].biasStrength
              : SCENARIOS[scenario].biasZone === null && scenario === 'normal'
              ? 0
              : 0
          const jitter = (Math.random() - 0.48) * 4
          const incoming = Math.max(0, Math.round(3 + bias + jitter))
          const outgoing = Math.max(0, Math.round(2 + Math.random() * 3 - bias * 0.15))
          const netFlow = incoming - outgoing
          const nextCount = Math.max(0, Math.min(z.capacity * 1.08, z.count + netFlow))
          return { ...z, incoming, outgoing, netFlow, count: Math.round(nextCount) }
        })
      )

      if (SCENARIOS[scenario].network) {
        setTransport((prev) =>
          prev.map((r) => ({
            ...r,
            load: Math.min(1.05, Math.max(0.2, r.load + (Math.random() - 0.35) * 0.05))
          }))
        )
      }
    }, 2200)

    return () => clearInterval(interval)
  }, [running, scenario])

  // Derived: risk + predictions per zone
  const enrichedZones = useMemo(() => {
    return zones.map((z) => {
      const ratio = z.count / z.capacity
      const risk = classifyRisk(ratio)
      const prediction = predictZone(z)
      return { ...z, ratio, risk, prediction }
    })
  }, [zones])

  const kpis = useMemo(() => {
    const totalVisitors = enrichedZones.reduce((sum, z) => sum + z.count, 0)
    const highRisk = enrichedZones.filter((z) => z.risk === 'high' || z.risk === 'critical' || z.risk === 'overcapacity').length
    const transportLoad = Math.round(
      (transport.reduce((s, r) => s + r.load, 0) / transport.length) * 100
    )
    const hospitalityOcc = Math.round(
      (hospitality.reduce((s, h) => s + h.occupied, 0) / hospitality.length) * 100
    )
    return {
      totalVisitors,
      activeZones: enrichedZones.length,
      highRisk,
      activeAlerts: alerts.filter((a) => a.status !== 'resolved').length,
      transportLoad,
      hospitalityOcc
    }
  }, [enrichedZones, transport, hospitality, alerts])

  // Alert + recommendation generation - reacts to risk crossing thresholds
  useEffect(() => {
    enrichedZones.forEach((z) => {
      const key = z.id
      if ((z.risk === 'critical' || z.risk === 'overcapacity') && !seenAlertZones.current.has(key)) {
        seenAlertZones.current.add(key)
        const alert = {
          id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
          severity: 'critical',
          zone: z.name,
          zoneId: z.id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: z.prediction.breachIn
            ? `${z.name} predicted to exceed capacity in ~${z.prediction.breachIn} min.`
            : `${z.name} has crossed critical occupancy.`,
          action: 'Redistribute incoming crowd to adjacent zones.',
          status: 'new'
        }
        setAlerts((prev) => [alert, ...prev])
        pushLog(`Critical alert generated for ${z.name}.`)
      } else if (z.risk === 'high' && !seenAlertZones.current.has(key + '-high')) {
        seenAlertZones.current.add(key + '-high')
        const alert = {
          id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
          severity: 'high',
          zone: z.name,
          zoneId: z.id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: `${z.name} approaching high occupancy (${Math.round(z.ratio * 100)}%).`,
          action: 'Monitor inflow, prep gate staff.',
          status: 'new'
        }
        setAlerts((prev) => [alert, ...prev])
      }

      if ((z.risk === 'critical' || z.risk === 'overcapacity') && !seenRecZones.current.has(key)) {
        seenRecZones.current.add(key)
        const alt = enrichedZones
          .filter((n) => z.neighbors?.includes(n.id) && n.risk !== 'critical' && n.risk !== 'overcapacity')
          .sort((a, b) => a.ratio - b.ratio)[0]

        const rec = {
          id: `REC-${Math.floor(100 + Math.random() * 900)}`,
          zoneId: z.id,
          zone: z.name,
          status: 'pending',
          steps: [
            alt ? `Redirect incoming visitors from ${z.name} to ${alt.name}.` : `Hold incoming flow at ${z.name} entry points.`,
            'Open auxiliary gate and stagger entry.',
            'Deploy nearest available response team.',
            'Increase shuttle frequency on the nearest congested route.'
          ],
          before: Math.round(z.ratio * 100),
          projectedAfter: Math.max(35, Math.round(z.ratio * 100) - 26),
          altZone: alt ? alt.name : null,
          altBefore: alt ? Math.round(alt.ratio * 100) : null,
          altAfter: alt ? Math.min(96, Math.round(alt.ratio * 100) + 7) : null,
          reduction: 26 + Math.floor(Math.random() * 8)
        }
        setRecommendations((prev) => [rec, ...prev])
        pushLog(`AI recommendation drafted for ${z.name}.`)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedZones])

  const acknowledgeAlert = useCallback((id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a)))
  }, [])

  const resolveAlert = useCallback((id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a)))
  }, [])

  const approveRecommendation = useCallback(
    (id) => {
      setRecommendations((prev) => {
        const rec = prev.find((r) => r.id === id)
        if (!rec) return prev
        pushLog(`Operator approved redistribution plan ${rec.id} for ${rec.zone}.`)

        // Simulate the effect: ease the source zone, nudge the alt zone
        setZones((zPrev) =>
          zPrev.map((z) => {
            if (z.id === rec.zoneId) {
              return { ...z, count: Math.round(z.capacity * (rec.projectedAfter / 100)) }
            }
            return z
          })
        )
        setTeams((tPrev) =>
          tPrev.map((t, idx) => (idx === 0 ? { ...t, status: 'active', zone: rec.zone } : t))
        )
        return prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
      })
    },
    [pushLog]
  )

  const dismissRecommendation = useCallback((id) => {
    setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r)))
  }, [])

  const setDemoScenario = useCallback(
    (key) => {
      setScenario(key)
      pushLog(`Simulation scenario set to "${SCENARIOS[key].label}".`)
    },
    [pushLog]
  )

  const resetSimulation = useCallback(() => {
    setZones(seedZones())
    setAlerts([])
    setRecommendations([])
    setActivityLog(INITIAL_ACTIVITY_LOG)
    setTransport(TRANSPORT_ROUTES)
    setTeams(RESPONSE_TEAMS)
    seenAlertZones.current = new Set()
    seenRecZones.current = new Set()
    setScenario('normal')
    setRunning(true)
  }, [])

  const addZone = useCallback((name, capacity) => {
    const id = `zone-${Math.random().toString(36).substr(2, 6)}`
    const newZone = {
      id,
      name,
      capacity: parseInt(capacity, 10) || 1000,
      count: 0,
      incoming: 2,
      outgoing: 1,
      netFlow: 1,
      x: 10, y: 10, w: 30, h: 30, neighbors: []
    }
    setZones((prev) => [...prev, newZone])
    pushLog(`Added new zone: ${name} (Capacity: ${newZone.capacity}).`)
  }, [pushLog])

  const network = useMemo(
    () => ({
      bandsActive: SMART_BANDS_ACTIVE + (tick % 40) * 3,
      gatewaysTotal: GATEWAYS_TOTAL,
      gatewaysOffline: GATEWAYS_OFFLINE,
      latency: (0.8 + Math.sin(tick / 4) * 0.3 + (scenario === 'congestion' ? 1.4 : 0)).toFixed(1),
      health: scenario === 'congestion' ? 79 : 98
    }),
    [tick, scenario]
  )

  const selectedZone = enrichedZones.find((z) => z.id === selectedZoneId) || null

  return {
    zones: enrichedZones,
    kpis,
    alerts,
    recommendations,
    activityLog,
    transport,
    hospitality,
    teams,
    network,
    running,
    scenario,
    selectedZone,
    setSelectedZoneId,
    setRunning,
    setDemoScenario,
    resetSimulation,
    addZone,
    acknowledgeAlert,
    resolveAlert,
    approveRecommendation,
    dismissRecommendation
  }
}
