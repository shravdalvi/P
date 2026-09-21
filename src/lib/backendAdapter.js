/**
 * Backend Adapter for Pulse Command
 *
 * Handles the seam between the frontend and the FastAPI backend.
 * Provides WebSocket connection management and a method for the local
 * simulator to forward data into the backend ingestion pipeline.
 */

const BACKEND_HTTP_URL = import.meta.env.VITE_BACKEND_HTTP_URL || 'http://localhost:8000';
const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000/ws';

class BackendAdapter {
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  async getInitialZones() {
    try {
      const response = await fetch(`${BACKEND_HTTP_URL}/api/zones`);
      if (response.ok) {
        const data = await response.json();
        return data; // { zones: [], timestamp: "..." }
      }
    } catch (err) {
      console.warn('[BackendAdapter] Failed to fetch initial state');
    }
    return null;
  }

  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.previousZones = new Map();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(BACKEND_WS_URL);

      this.ws.onopen = () => {
        console.log('[BackendAdapter] Connected to realtime backend');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data);
          this._handleEvent(envelope);
        } catch (err) {
          console.error('[BackendAdapter] Error parsing websocket message', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[BackendAdapter] Disconnected from backend');
        this._attemptReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[BackendAdapter] WebSocket error', err);
      };
    } catch (err) {
      console.error('[BackendAdapter] Connection failed', err);
      this._attemptReconnect();
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`[BackendAdapter] Reconnecting in ${timeout}ms...`);
      setTimeout(() => this.connect(), timeout);
    }
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    return () => {
      if (this.listeners.has(eventType)) {
        this.listeners.get(eventType).delete(callback);
      }
    };
  }

  _handleEvent(envelope) {
    const { type, entityId, data } = envelope;
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(cb => cb({ entityId, data }));
    }
  }

  // Seam for the local simulator to push data to the backend
  async ingestSimulatorData(zones) {
    const changedZones = [];

    for (const z of zones) {
      const prev = this.previousZones.get(z.id);
      // Check if critical telemetry fields changed to avoid sending unchanged zones
      if (!prev ||
          prev.count !== z.count ||
          prev.ratio !== z.ratio ||
          prev.netFlow !== z.netFlow ||
          prev.risk !== z.risk ||
          prev.incoming !== z.incoming ||
          prev.outgoing !== z.outgoing) {

        changedZones.push(z);
        this.previousZones.set(z.id, { ...z });
      }
    }

    if (changedZones.length === 0) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_HTTP_URL}/api/ingest/simulator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedZones)
      });
      if (!response.ok) {
        console.warn('[BackendAdapter] Simulator ingestion warning', response.status);
      }
    } catch (err) {
      // Fail silently if backend is not running to avoid breaking local dev
    }
  }
}

export const backendAdapter = new BackendAdapter();
