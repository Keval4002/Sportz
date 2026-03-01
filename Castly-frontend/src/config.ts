/**
 * Global configuration derived from environment variables.
 * 
 * All environment variables are defined in the .env file.
 * See .env.example for a complete list and descriptions.
 *
 * Three modes:
 * 1. SIMULATION_MODE=true  → Pure offline simulation (no backend)
 * 2. SIMULATION_MODE=false + AUGMENT_MODE=true  → Real backend + augmentation
 * 3. SIMULATION_MODE=false + AUGMENT_MODE=false → Raw backend, no augmentation
 */

export const SIMULATION_MODE =
  import.meta.env.VITE_SIMULATION_MODE === "true";

export const AUGMENT_MODE =
  !SIMULATION_MODE && import.meta.env.VITE_AUGMENT_MODE !== "false";

/** Alias for readability */
export const OFFLINE_MODE = SIMULATION_MODE;

/**
 * WebSocket URL.
 * Automatically derives from VITE_BACKEND_URL in production,
 * or from window.location in development (works with Vite proxy).
 */
export const WS_URL: string = (() => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  
  // If BACKEND_URL is set and looks like a full URL, derive WebSocket from it
  if (backendUrl && (backendUrl.startsWith('http://') || backendUrl.startsWith('https://'))) {
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws';
    return wsUrl;
  }
  
  // Otherwise auto-derive from window.location (development with Vite proxy)
  if (typeof window !== "undefined") {
    return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
  }
  
  return "";
})();

/**
 * REST API base URL.
 * In development: Uses "/api" (Vite proxy handles routing to backend)
 * In production: Uses VITE_BACKEND_URL directly (no proxy)
 */
export const API_BASE: string = (() => {
  const apiBase = import.meta.env.VITE_API_BASE as string;
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  
  // If API_BASE is explicitly set and not empty, use it (development with proxy)
  if (apiBase && apiBase.trim() !== "") {
    return apiBase;
  }
  
  // If BACKEND_URL is a full URL, use it directly (production, no proxy)
  if (backendUrl && (backendUrl.startsWith('http://') || backendUrl.startsWith('https://'))) {
    return backendUrl;
  }
  
  // Default fallback
  return "/api";
})();

/**
 * Milliseconds per match minute.
 * - Offline simulation: 4 000 ms (90-min match in ~6 min)
 * - Real backend: 60 000 ms (real time)
 */
export const MS_PER_MINUTE = OFFLINE_MODE ? 4_000 : 60_000;

/** How often to poll backend for match list updates (ms) */
export const MATCH_POLL_INTERVAL = 30_000;
