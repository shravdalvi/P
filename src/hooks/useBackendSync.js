import { useState, useEffect, useMemo, useRef } from 'react';
import { backendAdapter } from '../lib/backendAdapter';
import { computeIntelligence } from '../lib/crowdEngine.js';

export function useBackendSync(localEngine) {
  const [backendZoneOverrides, setBackendZoneOverrides] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const bufferRef = useRef([]);
  const activeRecsRef = useRef(new Map());

  useEffect(() => {
    let mounted = true;
    let hydrating = false;

    const handleConnect = async () => {
      setIsConnected(true);
      hydrating = true;
      const data = await backendAdapter.getInitialZones();

      if (mounted && data && data.zones) {
        const overrides = {};
        for (const z of data.zones) {
          overrides[z.id] = z;
        }

        // Apply any events that arrived while we were fetching initial state
        const buffer = bufferRef.current;
        bufferRef.current = []; // clear buffer

        for (const { entityId, data: eventData } of buffer) {
          if (overrides[entityId]) {
            overrides[entityId] = { ...overrides[entityId], ...eventData };
          } else {
            overrides[entityId] = { id: entityId, ...eventData };
          }
        }

        setBackendZoneOverrides(overrides);
      }
      hydrating = false;
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      hydrating = false;
      bufferRef.current = [];
      setBackendZoneOverrides(null);
    };

    const unsubConnect = backendAdapter.subscribe('sys.connected', handleConnect);
    const unsubDisconnect = backendAdapter.subscribe('sys.disconnected', handleDisconnect);

    const unsubZone = backendAdapter.subscribe('zone.updated', ({ entityId, data }) => {
      setBackendZoneOverrides(prev => {
        if (!prev) {
          // If we haven't hydrated yet but we are connected, buffer the event
          bufferRef.current.push({ entityId, data });
          return prev;
        }
        return {
          ...prev,
          [entityId]: {
            ...prev[entityId],
            ...data
          }
        };
      });
    });

    if (backendAdapter.isConnected()) {
      handleConnect();
    } else {
      backendAdapter.connect();
    }

    return () => {
      mounted = false;
      unsubConnect();
      unsubDisconnect();
      unsubZone();
    };
  }, []);

  const mergedZones = useMemo(() => {
    if (!backendZoneOverrides) return localEngine.zones;

    return localEngine.zones.map(localZone => {
      const overrides = backendZoneOverrides[localZone.id];
      if (!overrides) return localZone;

      return {
        ...localZone,
        ...overrides,
        count: overrides.occupancy ?? localZone.count,
        ratio: overrides.occupancyPercentage ?? localZone.ratio
      };
    });
  }, [localEngine.zones, backendZoneOverrides]);

  let mergedKpis = localEngine.kpis;
  if (backendZoneOverrides) {
    let total = 0;
    let highRisk = 0;
    let activeZones = 0;
    mergedZones.forEach(z => {
      total += (z.occupancy ?? z.count ?? 0);
      if (z.risk === 'critical' || z.risk === 'high') highRisk++;
      if (z.active !== false) activeZones++;
    });
    mergedKpis = {
      ...localEngine.kpis,
      totalCrowd: total,
      highRisk,
      activeZones
    };
  }


  const intel = useMemo(() => {
    if (!backendZoneOverrides) return { aiPrediction: localEngine.aiPrediction, contingencyTarget: localEngine.contingencyTarget, recommendations: localEngine.recommendations };
    // Compute derived intelligence from merged zones to properly handle WebSocket updates
    const computed = computeIntelligence(mergedZones, activeRecsRef.current);
    activeRecsRef.current = computed.recommendationsMap;
    // Map over localEngine recommendations to preserve 'approved'/'dismissed' states from local actions,
    // while appending any new pending ones from computed.
    const finalRecs = computed.recommendations.map(cr => {
       const existing = localEngine.recommendations.find(lr => lr.id === cr.id);
       if (existing && existing.status !== 'pending') return existing;
       return cr;
    });
    return { aiPrediction: computed.aiPrediction, contingencyTarget: computed.contingencyTarget, recommendations: finalRecs };
  }, [mergedZones, backendZoneOverrides, localEngine.aiPrediction, localEngine.recommendations]);

  return {
    ...localEngine,
    zones: mergedZones,
    kpis: mergedKpis,
    aiPrediction: intel.aiPrediction,
    contingencyTarget: intel.contingencyTarget,
    recommendations: intel.recommendations,
    isBackendSynced: isConnected && backendZoneOverrides !== null
  };

}
