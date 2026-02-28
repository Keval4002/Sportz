import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { SocketService } from "../services/socket";
import { createRealSocket } from "../services/socket";
import { createSimulationEngine } from "../engine/simulation";
import {
  createAugmentor,
  type AugmentedSocketService,
} from "../engine/augmentor";
import {
  SIMULATION_MODE,
  AUGMENT_MODE,
  WS_URL,
} from "../config";
import type { ServerEvent, Match } from "../types";

interface SocketContextValue {
  service: SocketService;
  connected: boolean;
  mode: "simulation" | "augmented" | "raw";
  /** Register match data so the augmentor can generate contextual events */
  registerMatch: (match: Match) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Provides a SocketService to the tree.
 *
 * Mode resolution:
 * 1. SIMULATION_MODE=true  → pure simulation engine
 * 2. AUGMENT_MODE=true     → real socket wrapped by augmentor
 * 3. Otherwise             → raw real socket
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const serviceRef = useRef<SocketService | null>(null);
  const augmentorRef = useRef<AugmentedSocketService | null>(null);

  const mode: "simulation" | "augmented" | "raw" = SIMULATION_MODE
    ? "simulation"
    : AUGMENT_MODE
      ? "augmented"
      : "raw";

  useEffect(() => {
    let service: SocketService;

    if (SIMULATION_MODE) {
      console.log("[Castly] Pure simulation mode");
      service = createSimulationEngine();
    } else if (AUGMENT_MODE) {
      console.log("[Castly] Backend + augmentation mode");
      const realSocket = createRealSocket(WS_URL);
      const augmented = createAugmentor(realSocket);
      augmentorRef.current = augmented;
      service = augmented;
    } else {
      console.log("[Castly] Raw backend mode (no augmentation)");
      service = createRealSocket(WS_URL);
    }

    serviceRef.current = service;

    const unsub = service.on((event: ServerEvent) => {
      if (event.type === "connection_upgraded") setConnected(true);
    });

    service.connect();

    return () => {
      unsub();
      service.disconnect();
      augmentorRef.current = null;
    };
  }, [mode]);

  const registerMatch = useCallback((match: Match) => {
    augmentorRef.current?.registerMatch(match);
  }, []);

  if (!serviceRef.current) return null;

  return (
    <SocketContext.Provider
      value={{
        service: serviceRef.current,
        connected,
        mode,
        registerMatch,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx)
    throw new Error("useSocketContext must be used within <SocketProvider>");
  return ctx;
}
