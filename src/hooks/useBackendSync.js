import { useState, useEffect, useMemo, useRef } from 'react';
import { backendAdapter } from '../lib/backendAdapter';

export function useBackendSync(localEngine) {
  const [backendZoneOverrides, setBackendZoneOverrides] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const bufferRef = useRef([]);

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

  return {
    ...localEngine,
    zones: mergedZones,
    kpis: mergedKpis,
    isBackendSynced: isConnected && backendZoneOverrides !== null
  };
}
