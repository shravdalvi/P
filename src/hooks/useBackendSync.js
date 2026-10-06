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

  const bufferRef = useRef([]);
  const activeRecsRef = useRef(new Map());

  // Firebase Refs
  const lastWrittenZonesRef = useRef(new Map());
  const hasSeededRef = useRef(false);
  const initialZonesRef = useRef(localEngine.zones);

  // FIREBASE SYNC
  useEffect(() => {
    if (!firebaseEnabled) return;

    let mounted = true;
    let unsubscribe = null;

    const init = async () => {
      try {
        const unsub = await subscribeZones((zones) => {
          if (!mounted) return;
          setIsConnected(true);

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

  // LOCAL SIMULATOR TO FIRESTORE WRITE
  useEffect(() => {
    if (!firebaseEnabled || !hasSeededRef.current) return;

    const toWrite = [];
    for (const lz of localEngine.zones) {
      const last = lastWrittenZonesRef.current.get(lz.id);
      const currentSnapshot = zoneSnapshot(lz);

      if (!last || JSON.stringify(last) !== JSON.stringify(currentSnapshot)) {
        toWrite.push(lz);
        lastWrittenZonesRef.current.set(lz.id, currentSnapshot);
      }
    }

    if (toWrite.length > 0) {
      writeZones(toWrite).catch(err => console.warn("Firestore write error:", err.message));
    }
  }, [localEngine.zones]);

  // FASTAPI WEBSOCKET SYNC (Preserved for when Firebase is disabled)
  useEffect(() => {
    if (firebaseEnabled) return;

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

        const buffer = bufferRef.current;
        bufferRef.current = [];

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
        count: overrides.occupancy ?? overrides.count ?? localZone.count,
        ratio: overrides.occupancyPercentage ?? overrides.ratio ?? localZone.ratio
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
