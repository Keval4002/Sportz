import type { ServerEvent, ClientEvent } from "../types";

type EventHandler = (event: ServerEvent) => void;

/**
 * Socket service abstraction.
 * Both the real WebSocket and the simulation engine implement this interface.
 * Swap between them via VITE_SIMULATION_MODE — zero UI refactor needed.
 */
export interface SocketService {
  connect(): void;
  disconnect(): void;
  send(event: ClientEvent): void;
  on(handler: EventHandler): () => void;
  readonly connected: boolean;
}

/* ─── Real WebSocket implementation ─────────────────────── */

export function createRealSocket(url: string): SocketService {
  let ws: WebSocket | null = null;
  const handlers = new Set<EventHandler>();
  let _connected = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (ws) return;
    ws = new WebSocket(url);

    ws.onopen = () => {
      _connected = true;
      console.log("[Castly WS] Connected to", url);
    };

    ws.onmessage = (event) => {
      try {
        const parsed: ServerEvent = JSON.parse(event.data);
        handlers.forEach((h) => h(parsed));
      } catch {
        console.warn("[Castly WS] Failed to parse:", event.data);
      }
    };

    ws.onclose = () => {
      _connected = false;
      ws = null;
      console.log("[Castly WS] Disconnected. Reconnecting in 3 s…");
      reconnectTimer = setTimeout(connect, 3_000);
    };

    ws.onerror = (err) => {
      console.error("[Castly WS] Error:", err);
      ws?.close();
    };
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
    ws = null;
    _connected = false;
  }

  function send(event: ClientEvent) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  function on(handler: EventHandler): () => void {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }

  return {
    connect,
    disconnect,
    send,
    on,
    get connected() {
      return _connected;
    },
  };
}
