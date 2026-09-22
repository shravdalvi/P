import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { backendAdapter } from './backendAdapter.js'
import {
  ZONES,
  INITIAL_OCCUPANCY,
  TRANSPORT_ROUTES,
  HOSPITALITY,
  RESPONSE_TEAMS,
  INITIAL_ACTIVITY_LOG,
  THRESHOLDS
} from '../data/mockData.js'

export function classifyRisk(occupancyRatio, thresholds = THRESHOLDS) {
  if (occupancyRatio >= 1) return 'overcapacity'
  if (occupancyRatio >= thresholds.critical) return 'critical'
  if (occupancyRatio >= thresholds.high) return 'high'
  if (occupancyRatio >= thresholds.moderate) return 'moderate'
  return 'safe'
}

export function classifyStatus(occupancyRatio, thresholds = THRESHOLDS) {
  if (occupancyRatio >= 1) return 'OFF-LIMIT'
  if (occupancyRatio >= thresholds.critical) return 'CRITICAL'
  if (occupancyRatio >= thresholds.high) return 'HIGH RISK'
  if (occupancyRatio >= thresholds.moderate) return 'ATTENTION'
  return 'NORMAL'
}

export const STATUS_META = {
  safe: { label: 'Safe', color: 'status-safe' },
  moderate: { label: 'Moderate', color: 'status-moderate' },
  high: { label: 'High risk', color: 'status-high' },
  critical: { label: 'Critical', color: 'status-critical' },
  overcapacity: { label: 'Overcapacity', color: 'status-critical' }
}

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

function getCentroid(coords) {
  let cx = 0, cy = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    cx += coords[i][0];
    cy += coords[i][1];
  }
  return [cx / (coords.length - 1), cy / (coords.length - 1)];
}

function seedZones() {
  return ZONES.map((z) => {
    const ratio = INITIAL_OCCUPANCY[z.id] ?? 0.4
    const count = Math.round(z.capacity * ratio)
    const cx = z.x + (z.w / 2)
    const cy = z.y + (z.h / 2)
    let lng = -0.004 + (cx - 115) / 22666
    let lat = 0.0050 - (cy - 85) / 30000
    if (z.geometry && z.geometry.coordinates && z.geometry.coordinates[0]) {
      const c = getCentroid(z.geometry.coordinates[0]);
      lng = c[0];
      lat = c[1];
    }
    const { x, y, ...rest } = z;
    const netFlow = Math.round(count * 0.003);
    const risk = classifyRisk(ratio);
    const status = classifyStatus(ratio);
    return {
      ...rest,
      count,
      ratio,
      dwell: Math.round(8 + Math.random() * 20),
      incoming: Math.round(count * 0.015),
      outgoing: Math.round(count * 0.012),
      netFlow,
      risk,
      status,
      lng,
      lat
    }
  })
}


export function computeIntelligence(zones, activeRecsMap = new Map()) {
  let highestScore = -9999;
  let pZone = null;
  let timeToCritical = null;

  zones.forEach(z => {
    if (z.status !== 'OFF-LIMIT') {
      const pressure = (z.count + z.netFlow * 15) / z.capacity;
      if (pressure > highestScore) {
        highestScore = pressure;
        pZone = z;
        timeToCritical = z.prediction?.breachIn;
      }
    }
  });

  let aiPrediction = null;
  if (pZone) {
    const reasons = [];
    if (pZone.ratio > 0.85) reasons.push("High occupancy pressure");
    if (pZone.netFlow > 10) reasons.push("Rapid incoming flow");
    else if (pZone.netFlow > 0) reasons.push("Steady incoming flow");
    if (pZone.capacity - pZone.count < pZone.capacity * 0.15) reasons.push("Limited remaining capacity");

    aiPrediction = {
      predictedZone: pZone.id,
      zoneName: pZone.name,
      occupancy: pZone.ratio,
      netFlow: pZone.netFlow,
      riskScore: Math.min(0.99, pZone.ratio + (pZone.netFlow * 0.005)),
      estimatedTimeToCritical: pZone.prediction?.breachIn,
      confidence: (pZone.ratio > 0.8 || pZone.netFlow > 15) ? "HIGH" : "MODERATE",
      contributingFactors: reasons,
      status: pZone.status
    };
  }

  const offLimitZones = zones.filter(z => z.status === 'OFF-LIMIT');
  const newActiveRecs = new Map(activeRecsMap);

  function findBestTarget(excludeId) {
    let bestTarget = null;
    let lowestPressure = 9999;
    zones.forEach(z => {
      if (z.status !== 'OFF-LIMIT' && z.id !== excludeId) {
        const pressure = (z.count + z.netFlow * 5) / z.capacity;
        if (pressure < lowestPressure) {
          lowestPressure = pressure;
          bestTarget = z;
        }
      }
    });
    return bestTarget;
  }

  offLimitZones.forEach(offZone => {
    let rec = newActiveRecs.get(offZone.id);

    if (!rec) {
      const bestTarget = findBestTarget(offZone.id);
      if (bestTarget) {
        rec = {
          id: `rec-${offZone.id}-${Date.now()}`,
          sourceZoneId: offZone.id,
          sourceZone: offZone.name,
          targetZoneId: bestTarget.id,
          targetZone: bestTarget.name,
          action: 'REDIRECT_CROWD',
          rationale: [
            `${bestTarget.name.split('·')[0].trim()} has ${(100 - Math.round(bestTarget.ratio*100))}% remaining capacity.`,
            `Incoming flow is currently manageable (${bestTarget.incoming}/m).`,
            `Risk remains within acceptable operating range.`
          ],
          confidence: 'HIGH',
          status: 'pending',
          targetMetrics: {
            occupancy: Math.round(bestTarget.ratio * 100),
            capacityRemaining: 100 - Math.round(bestTarget.ratio * 100),
            flow: bestTarget.incoming,
            risk: bestTarget.risk
          }
        };
        newActiveRecs.set(offZone.id, rec);
      }
    } else if (rec.status === 'pending') {
      // P4: Dynamic Target Recalculation
      // Check if current target is still viable. If not, recalculate.
      const currentTarget = zones.find(z => z.id === rec.targetZoneId);
      if (!currentTarget || currentTarget.status === 'OFF-LIMIT' || currentTarget.ratio > 0.8) {
        const bestTarget = findBestTarget(offZone.id);
        if (bestTarget && bestTarget.id !== rec.targetZoneId) {
          rec.targetZoneId = bestTarget.id;
          rec.targetZone = bestTarget.name;
          rec.rationale = [
            `${bestTarget.name.split('·')[0].trim()} has ${(100 - Math.round(bestTarget.ratio*100))}% remaining capacity.`,
            `Incoming flow is currently manageable (${bestTarget.incoming}/m).`,
            `Risk remains within acceptable operating range.`
          ];
          rec.targetMetrics = {
            occupancy: Math.round(bestTarget.ratio * 100),
            capacityRemaining: 100 - Math.round(bestTarget.ratio * 100),
            flow: bestTarget.incoming,
            risk: bestTarget.risk
          };
        }
      }
    }
  });

  // Clean up resolved
  for (const [zoneId, rec] of newActiveRecs.entries()) {
    const z = zones.find(z => z.id === zoneId);
    if (z && z.status !== 'OFF-LIMIT') {
       if (rec.status === 'pending') {
         newActiveRecs.delete(zoneId);
       } else if (rec.status === 'approved' || rec.status === 'executing' || rec.status === 'monitoring') {
         rec.status = 'resolved';
       }
    }
  }

    let contingencyTarget = null;
  let lowestPressure = 9999;
  zones.forEach(z => {
    if (z.status !== 'OFF-LIMIT') {
      const pressure = (z.count + z.netFlow * 5) / z.capacity;
      if (pressure < lowestPressure) {
        lowestPressure = pressure;
        contingencyTarget = z;
      }
    }
  });

  return { aiPrediction, contingencyTarget, recommendationsMap: newActiveRecs, recommendations: Array.from(newActiveRecs.values()) };
}

const SCENARIOS = {
  normal: { label: 'Normal crowd', biasZone: null, biasStrength: 0 },
  surge: { label: 'Crowd surge', biasZone: 'zone-c', biasStrength: 9 },
  gate: { label: 'Gate Congestion', biasZone: 'gate-1', biasStrength: 5 },
  release: { label: 'Stage Release', biasZone: 'main-stage', biasStrength: -10 },
  exit: { label: 'Exit Pressure', biasZone: 'exit', biasStrength: 8 },
  congestion: { label: 'Network congestion', biasZone: null, biasStrength: 0, network: true }
}

function buildLayoutFromZones(zones) {
  return {
    id: "meridian-arena",
    objects: zones.map(z => ({
      id: z.id,
      type: z.type || 'zone',
      name: z.name,
      capacity: z.capacity,
      geometry: z.geometry,
      lng: z.lng,
      lat: z.lat
    }))
  };
}

export function useCrowdEngine() {
  const [running, setRunning] = useState(true)
  const [scenario, setScenario] = useState('normal')
  const [zones, setZones] = useState(seedZones)
  const [eventLayout, setEventLayout] = useState(() => buildLayoutFromZones(seedZones()))
  const [alerts, setAlerts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [actionHistory, setActionHistory] = useState([])
  const [flowHistory, setFlowHistory] = useState([])
  const [activityLog, setActivityLog] = useState(INITIAL_ACTIVITY_LOG)
  const [transport, setTransport] = useState(TRANSPORT_ROUTES)
  const [hospitality] = useState(HOSPITALITY)
  const [teams, setTeams] = useState(RESPONSE_TEAMS)
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    backendAdapter.connect();
    // Use an empty subscribe to just satisfy any dependency
    const unsubscribe = backendAdapter.subscribe('zone.updated', () => {});
    return () => unsubscribe();
  }, []);

  const pushLog = useCallback((message, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setActivityLog((prev) => [{ id: Math.random().toString(), time, message, type }, ...prev].slice(0, 50))
  }, [])

  const tickRef = useRef(null)

  // Recommendation engine state tracking
  const activeRecsRef = useRef(new Map()) // id -> recommendation

  useEffect(() => {
    if (!running) return

    tickRef.current = setInterval(() => {
      setTick(t => t + 1)

      // Calculate total IN and OUT for the current tick
      setZones((prev) => {
        // Compute flow totals BEFORE mutations
        let totalIn = 0;
        let totalOut = 0;
        prev.forEach(z => {
          if (z.incoming) totalIn += z.incoming;
          if (z.outgoing) totalOut += z.outgoing;
        });
        setFlowHistory(fh => {
          const entry = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            in: totalIn,
            out: totalOut
          };
          return [...fh, entry].slice(-20);
        });

        const nextZones = prev.map((z) => {
          let bias = 0
          if ((SCENARIOS[scenario] || SCENARIOS.normal).biasZone === z.id) {
            bias = (SCENARIOS[scenario] || SCENARIOS.normal).biasStrength
          }
          const drift = (Math.random() - 0.4) * 3
          let currentIncoming = z.incoming
          let currentOutgoing = z.outgoing

          // If OFF-LIMIT, we force incoming to drop rapidly and outgoing to increase
          if (z.status === 'OFF-LIMIT') {
             currentIncoming = Math.max(0, currentIncoming - Math.round(Math.random() * 5));
             currentOutgoing = Math.min(200, currentOutgoing + Math.round(Math.random() * 5));
          } else {
             currentIncoming = Math.max(0, currentIncoming + drift + bias)
             currentOutgoing = Math.max(0, currentOutgoing + drift * 0.8)
          }

          const net = Math.round(currentIncoming - currentOutgoing)
          let newCount = Math.max(0, z.count + net)

          // Cap it at a bit over capacity, e.g. 1.05x
          const maxAllowed = Math.round(z.capacity * 1.05)
          if (newCount > maxAllowed) {
            newCount = maxAllowed
          }

          const ratio = newCount / z.capacity
          const risk = classifyRisk(ratio)
          const status = classifyStatus(ratio)
          const prediction = predictZone({ ...z, count: newCount, netFlow: net })

          return {
            ...z,
            count: newCount,
            ratio,
            incoming: Math.round(currentIncoming),
            outgoing: Math.round(currentOutgoing),
            netFlow: net,
            risk,
            status,
            prediction
          }
        })

        const intel = computeIntelligence(nextZones, activeRecsRef.current);
        activeRecsRef.current = intel.recommendationsMap;
        setRecommendations(intel.recommendations);
        backendAdapter.ingestSimulatorData(nextZones);

        return nextZones;
      })

    }, 3000)

    return () => clearInterval(tickRef.current)
  }, [running, scenario])

  // Intelligence Objects explicitly exposed for the UI
  const { aiPrediction, contingencyTarget } = useMemo(() => {
    const intel = computeIntelligence(zones, activeRecsRef.current);
    return { aiPrediction: intel.aiPrediction, contingencyTarget: intel.contingencyTarget };
  }, [zones]);


  const kpis = useMemo(() => {
    let total = 0
    let highRisk = 0
    let activeAlerts = alerts.length
    zones.forEach((z) => {
      total += z.count
      if (z.risk === 'critical' || z.risk === 'high') highRisk++
    })
    return {
      totalCrowd: total,
      highRisk,
      activeAlerts,
      activeZones: zones.length,
      network: { health: (SCENARIOS[scenario] || SCENARIOS.normal).network ? 68 : 99 }
    }
  }, [zones, alerts, scenario])

  const approveRecommendation = useCallback(
    (id) => {
      const rec = Array.from(activeRecsRef.current.values()).find(r => r.id === id);
      if (rec) {
        rec.status = 'executing';

        setActionHistory(prev => {
          const sz = zones.find(z => z.id === rec.sourceZoneId) || {};
          const tz = zones.find(z => z.id === rec.targetZoneId) || {};

          const entry = {
            id: 'ACT-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            approvedBy: 'Event Admin',
            action: 'REDIRECT_CROWD',
            sourceZoneId: rec.sourceZoneId,
            targetZoneId: rec.targetZoneId,
            status: 'EXECUTING',
            source: {
              zoneId: sz.id,
              zoneName: sz.name,
              occupancy: sz.count,
              capacity: sz.capacity,
              occupancyPercentage: sz.ratio,
              incoming: sz.incoming,
              outgoing: sz.outgoing,
              netFlow: sz.netFlow,
              risk: sz.risk
            },
            target: {
              zoneId: tz.id,
              zoneName: tz.name,
              occupancy: tz.count,
              capacity: tz.capacity,
              occupancyPercentage: tz.ratio,
              incoming: tz.incoming,
              outgoing: tz.outgoing,
              netFlow: tz.netFlow,
              risk: tz.risk
            },
            rationale: [
               "Source zone exceeded safe operating threshold",
               "Target had available capacity",
               "Target flow remained manageable"
            ],
            lifecycle: [
               { status: 'APPROVED', timestamp: new Date().toLocaleTimeString() },
               { status: 'EXECUTING', timestamp: new Date().toLocaleTimeString() }
            ]
          };
          return [entry, ...prev].slice(0, 10);
        });

        // Automatically transition to monitoring on next tick
        setTimeout(() => {
          const currentRec = Array.from(activeRecsRef.current.values()).find(r => r.id === id);
          if (currentRec && currentRec.status === 'executing') currentRec.status = 'monitoring';
          setActionHistory(prev => prev.map(h => h.sourceZoneId === rec.sourceZoneId && h.status === 'Executing' ? { ...h, status: 'MONITORING' } : h));

          setTimeout(() => {
             const currentRec2 = Array.from(activeRecsRef.current.values()).find(r => r.id === id);
             if (currentRec2 && currentRec2.status === 'monitoring') {
                activeRecsRef.current.delete(currentRec2.sourceZoneId);
                setRecommendations(Array.from(activeRecsRef.current.values()));
             }
             setActionHistory(prev => prev.map(h => h.sourceZoneId === rec.sourceZoneId && h.status === 'Monitoring' ? { ...h, status: 'RESOLVED' } : h));
          }, 8000);
        }, 3000);
        pushLog(`Redirecting crowd from ${rec.sourceZone} to ${rec.targetZone}.`, 'success');

        // Execute the redirect in the simulator
        setZones(prev => prev.map(z => {
          if (z.id === rec.sourceZoneId) {
            // Cut incoming completely, boost outgoing
            return { ...z, incoming: 0, outgoing: z.outgoing + 20 };
          }
          if (z.id === rec.targetZoneId) {
            // Increase incoming
            return { ...z, incoming: z.incoming + 15 };
          }
          return z;
        }));
      }
      setRecommendations(Array.from(activeRecsRef.current.values()));
    },
    [pushLog]
  )


  const updateRecommendation = useCallback((id, payload) => {
    const rec = Array.from(activeRecsRef.current.values()).find(r => r.id === id);
    if (rec && payload.targetZoneId) {
      const targetZone = zones.find(z => z.id === payload.targetZoneId);
      if (targetZone) {
        rec.targetZoneId = targetZone.id;
        rec.targetZone = targetZone.name;
        pushLog(`Recommendation modified: new target is ${targetZone.name}.`, 'info');
      }
    }
    setRecommendations(Array.from(activeRecsRef.current.values()));
  }, [zones, pushLog]);

  const dismissRecommendation = useCallback((id) => {
    const rec = Array.from(activeRecsRef.current.values()).find(r => r.id === id);
    if (rec) {
      rec.status = 'dismissed';
      activeRecsRef.current.delete(rec.sourceZoneId);
    }
    setRecommendations(Array.from(activeRecsRef.current.values()));
  }, [])

  const setDemoScenario = useCallback(
    (key) => {
      setScenario(key)
      pushLog(`Simulation scenario set to "${SCENARIOS[key].label}".`)
    },
    [pushLog]
  )

  const resetSimulation = useCallback(() => {
    const seeds = seedZones()
    setZones(seeds)
    setEventLayout(buildLayoutFromZones(seeds))
    setAlerts([])
    activeRecsRef.current = new Map();
    setRecommendations([])
    setActivityLog(INITIAL_ACTIVITY_LOG)
    setTransport(TRANSPORT_ROUTES)
    setTeams(RESPONSE_TEAMS)
    setScenario('normal')
    setRunning(true)
  }, [])

  return {
    zones,
    eventLayout,
    aiPrediction,
    recommendations,
    alerts,
    activityLog,
    transport,
    hospitality,
    teams,
    kpis,
    selectedZone: zones.find((z) => z.id === selectedZoneId) || null,
    setSelectedZoneId,
    approveRecommendation,
    acknowledgeAlert: (id) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a))
    },
    resolveAlert: (id) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a))
    },
    addZone: (newZone) => {
        setZones(prev => {
            const next = [...prev, newZone];
            setEventLayout(buildLayoutFromZones(next));
            return next;
        })
    },
    updateZoneGeometry: (id, geometry) => {
        setZones(prev => {
            const next = prev.map(z => z.id === id ? { ...z, geometry } : z);
            setEventLayout(buildLayoutFromZones(next));
            return next;
        })
    },
    deleteZone: (id) => {
        setZones(prev => {
            const next = prev.filter(z => z.id !== id);
            setEventLayout(buildLayoutFromZones(next));
            return next;
        })
    },
    updateZone: (id, updates) => {
        setZones(prev => {
            const next = prev.map(z => z.id === id ? { ...z, ...updates } : z);
            setEventLayout(buildLayoutFromZones(next));
            return next;
        })
    },
    dismissRecommendation,
    updateRecommendation,
    actionHistory,
    flowHistory,
    contingencyTarget,
    scenario,
    setScenario: setDemoScenario,
    running,
    setRunning,
    resetSimulation
  }
}
