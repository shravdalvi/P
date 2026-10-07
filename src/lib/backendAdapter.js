/**
 * Backend Adapter for Vibecheck Controller
 */

const BACKEND_HTTP_URL = import.meta.env.VITE_BACKEND_HTTP_URL || 'http://localhost:8000';
const BACKEND_WS_BASE_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000';

class BackendAdapter {
  constructor() {
    this.ws = null;
    this.posWs = null;
    this.reconnectAttempts = 0;
    this.posReconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.currentEventId = null;
    this.currentToken = null;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  
  isPositionsConnected() {
    return this.posWs && this.posWs.readyState === WebSocket.OPEN;
  }

  connect(eventId = 'test-event', token = 'dev_token') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentEventId === eventId) {
      return;
    }

    if (this.ws) this.ws.close();

    this.currentEventId = eventId;
    this.currentToken = token;

    try {
      const wsUrl = `${BACKEND_WS_BASE_URL}/events/${eventId}/dashboard?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[BackendAdapter] Connected to realtime dashboard');
        this.reconnectAttempts = 0;
        this._handleEvent({ type: 'sys.connected', data: {} });
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
        this._handleEvent({ type: 'sys.disconnected', data: {} });
        this._attemptReconnect();
      };
    } catch (err) {
      this._attemptReconnect();
    }
  }

  connectPositions(eventId = 'test-event', token = 'dev_token') {
    if (this.posWs && this.posWs.readyState === WebSocket.OPEN) return;
    if (this.posWs) this.posWs.close();

    try {
      const wsUrl = `${BACKEND_WS_BASE_URL}/events/${eventId}/dashboard/positions?token=${token}`;
      this.posWs = new WebSocket(wsUrl);

      this.posWs.onopen = () => {
        console.log('[BackendAdapter] Connected to positions stream');
        this.posReconnectAttempts = 0;
      };

      this.posWs.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data);
          this._handleEvent(envelope);
        } catch (err) {
          console.error('[BackendAdapter] Error parsing positions websocket message', err);
        }
      };

      this.posWs.onclose = () => {
        console.log('[BackendAdapter] Disconnected from positions stream');
        this._attemptPosReconnect();
      };
    } catch (err) {
      this._attemptPosReconnect();
    }
  }

  disconnectPositions() {
    if (this.posWs) {
      this.posWs.close();
      this.posWs = null;
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts) + Math.random() * 500, 10000);
      setTimeout(() => this.connect(this.currentEventId, this.currentToken), timeout);
    }
  }
  
  _attemptPosReconnect() {
    if (this.posReconnectAttempts < this.maxReconnectAttempts) {
      this.posReconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.posReconnectAttempts) + Math.random() * 500, 10000);
      setTimeout(() => this.connectPositions(this.currentEventId, this.currentToken), timeout);
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
    const { type } = envelope;
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(cb => cb(envelope));
    }
  }
}

export const backendAdapter = new BackendAdapter();
