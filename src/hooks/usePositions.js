import { useState, useEffect, useRef } from 'react';
import { backendAdapter } from '../lib/backendAdapter';

export function usePositions(enabled, eventId = 'test-event', token = 'dev_token') {
  const [positions, setPositions] = useState(new Map());
  const [seq, setSeq] = useState(-1);
  const mapRef = useRef(new Map());

  useEffect(() => {
    if (!enabled) {
      backendAdapter.disconnectPositions();
      mapRef.current.clear();
      setPositions(new Map());
      return;
    }

    backendAdapter.connectPositions(eventId, token);

    const handleFull = (data) => {
      const newMap = new Map();
      for (const pt of data.points) {
         // [short_id, lat, lng, acc_m, zone, movement_score]
         newMap.set(pt[0], {
           short_id: pt[0], lat: pt[1], lng: pt[2], acc_m: pt[3], zone: pt[4], score: pt[5],
           lastSeen: Date.now()
         });
      }
      mapRef.current = newMap;
      setSeq(data.seq);
      setPositions(new Map(newMap));
    };

    const handleDelta = (data) => {
      // Gap detection
      if (seq !== -1 && data.seq > seq + 1) {
        console.warn(`[Positions] Seq gap detected. Reconnecting...`);
        backendAdapter.disconnectPositions();
        backendAdapter.connectPositions(eventId, token);
        return;
      }

      const map = mapRef.current;
      let changed = false;

      if (data.remove) {
        for (const id of data.remove) {
          if (map.has(id)) {
            map.delete(id);
            changed = true;
          }
        }
      }

      if (data.upsert) {
        for (const pt of data.upsert) {
          map.set(pt[0], {
            short_id: pt[0], lat: pt[1], lng: pt[2], acc_m: pt[3], zone: pt[4], score: pt[5],
            lastSeen: Date.now()
          });
          changed = true;
        }
      }

      if (changed) {
        setSeq(data.seq);
        setPositions(new Map(map));
      }
    };

    const unsubFull = backendAdapter.subscribe('POSITIONS_FULL', handleFull);
    const unsubDelta = backendAdapter.subscribe('POSITIONS_DELTA', handleDelta);

    // Stale checker interval (fade at 30s, drop at 60s)
    const interval = setInterval(() => {
      const now = Date.now();
      const map = mapRef.current;
      let changed = false;

      for (const [id, pt] of map.entries()) {
        const age = now - pt.lastSeen;
        if (age > 60000) {
          map.delete(id);
          changed = true;
        } else if (age > 30000 && !pt.stale) {
          pt.stale = true;
          changed = true;
        }
      }

      if (changed) {
        setPositions(new Map(map));
      }
    }, 5000);

    return () => {
      unsubFull();
      unsubDelta();
      clearInterval(interval);
      // We don't disconnect immediately on unmount in case it's a quick remount,
      // but if !enabled, we do disconnect at the top.
    };
  }, [enabled, eventId, token, seq]);

  return Array.from(positions.values());
}

