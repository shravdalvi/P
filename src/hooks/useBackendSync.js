import { useState, useEffect, useMemo, useRef } from 'react';
import { backendAdapter } from '../lib/backendAdapter';
import { firebaseEnabled, subscribeZones, writeZones, seedInitialZones } from '../lib/firebase.js';

function zoneSnapshot(zone) {
  return {
    count: zone.count,
    ratio: zone.ratio,
    incoming: zone.incoming,
    outgoing: zone.outgoing,
    netFlow: zone.netFlow,
    risk: zone.risk,
    status: zone.status,
    capacity: zone.capacity,
    name: zone.name,
    prediction: zone.prediction
      ? JSON.stringify(zone.prediction)
      : null,
    geometry: zone.geometry
      ? JSON.stringify(zone.geometry)
      : null
  }
}

export function useBackendSync(localEngine) {
  const [backendZoneOverrides, setBackendZoneOverrides] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeDevices, setActiveDevices] = useState(0);

  // Firebase Refs
  const lastWrittenZonesRef = useRef(new Map());
  const hasSeededRef = useRef(false);
  const initialZonesRef = useRef(localEngine.zones);

  // FIREBASE SYNC (Legacy, keeping for compatibility if requested)
  useEffect(() => {
    if (!firebaseEnabled) return;

    let mounted = true;
    let unsubscribe = null;

    const init = async () => {
      try {
        const unsub = await subscribeZones((zones) => {
          if (!mounted) return;
          setIsConnected(true);
          setLastUpdated(new Date());

          if (zones.length === 0 && !hasSeededRef.current) {
            hasSeededRef.current = true;
            seedInitialZones(initialZonesRef.current).catch(err => console.warn("Seed error:", err.message));
          } else if (zones.length > 0) {
            hasSeededRef.current = true;
            const overrides = {};
            for (const z of zones) {
               overrides[z.id] = z;
            }
            setBackendZoneOverrides(overrides);
          }
        }, (err) => {
          console.warn("Firestore subscription error:", err.message);
        });

        if (mounted) {
           unsubscribe = unsub;
        } else {
           unsub();
        }
      } catch (err) {
        console.warn("Firebase init error:", err.message);
      }
    };
    init();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // FASTAPI WEBSOCKET SYNC (SNAPSHOT Protocol)
  useEffect(() => {
    if (firebaseEnabled) return;

    let mounted = true;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleSnapshot = (envelope) => {
      if (!mounted) return;
      const data = envelope; // type: "SNAPSHOT"
      setLastUpdated(new Date(data.server_time || Date.now()));
      setActiveDevices(data.active_devices || 0);

      const overrides = {};
      if (data.zones) {
        for (const z of data.zones) {
          overrides[z.zone_id] = {
            id: z.zone_id,
            occupancy: z.occupancy,
            capacity: z.capacity,
            ratio: z.capacity ? z.occupancy / z.capacity : 0,
            risk: z.level.toLowerCase()
          };
        }
      }
      setBackendZoneOverrides(overrides);
    };

    const unsubConnect = backendAdapter.subscribe('sys.connected', handleConnect);
    const unsubDisconnect = backendAdapter.subscribe('sys.disconnected', handleDisconnect);
    const unsubSnapshot = backendAdapter.subscribe('SNAPSHOT', handleSnapshot);

    // Hardcode test-event for now, event selector comes later
    backendAdapter.connect('test-event', 'dev_token');

    return () => {
      mounted = false;
      unsubConnect();
      unsubDisconnect();
      unsubSnapshot();
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
        count: overrides.occupancy ?? overrides.count ?? localZone.count,
        ratio: overrides.ratio ?? localZone.ratio
      };
    });
  }, [localEngine.zones, backendZoneOverrides]);

  let mergedKpis = localEngine.kpis;
  if (backendZoneOverrides) {
    let total = 0;
    let highRisk = 0;
    let activeZones = 0;
    mergedZones.forEach(z => {
      total += (z.count ?? 0);
      if (z.risk === 'critical' || z.risk === 'high') highRisk++;
      if (z.active !== false) activeZones++;
    });
    mergedKpis = {
      ...localEngine.kpis,
      totalCrowd: total,
      highRisk,
      activeZones,
      activeDevices // Added for UI binding
    };
  }

  return {
    ...localEngine,
    zones: mergedZones,
    kpis: mergedKpis,
    isBackendSynced: isConnected && backendZoneOverrides !== null,
    lastUpdated,
    activeDevices
  };
}
