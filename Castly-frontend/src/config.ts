/**
 * Global configuration derived from environment.
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
 * If VITE_WS_URL is set, use it directly.
 * Otherwise auto-derive from window.location (works with Vite proxy).
 */
export const WS_URL: string =
  (import.meta.env.VITE_WS_URL as string) ||
  (typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
    : "");

/** REST API base path */
export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string) || "/api";

/**
 * Milliseconds per match minute.
 * - Offline simulation: 4 000 ms (90-min match in ~6 min)
 * - Real backend: 60 000 ms (real time)
 */
export const MS_PER_MINUTE = OFFLINE_MODE ? 4_000 : 60_000;

/** How often to poll backend for match list updates (ms) */
export const MATCH_POLL_INTERVAL = 30_000;
