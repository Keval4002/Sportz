import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  Match,
  Commentary,
  MatchStats,
  MatchEvent,
  ChatMessage,
  ServerEvent,
} from "../types";
import { fetchMatches, fetchCommentary, fetchChat, postChat } from "../services/api";
import { SIMULATION_MATCHES } from "../engine/simulation";
import { SIMULATION_MODE, MATCH_POLL_INTERVAL } from "../config";
import { useSocketContext } from "./SocketContext";

/* ─── State ─────────────────────────────────────────────── */

interface MatchState {
  matches: Match[];
  matchesLoading: boolean;
  selectedMatchId: number | null;
  commentary: Commentary[];
  events: MatchEvent[];
  stats: MatchStats | null;
  viewerCounts: Record<number, number>;
  chatMessages: ChatMessage[];
}

const initialState: MatchState = {
  matches: [],
  matchesLoading: true,
  selectedMatchId: null,
  commentary: [],
  events: [],
  stats: null,
  viewerCounts: {},
  chatMessages: [],
};

/* ─── Actions ───────────────────────────────────────────── */

type Action =
  | { type: "SET_MATCHES"; payload: Match[] }
  | { type: "SET_MATCHES_LOADING"; payload: boolean }
  | { type: "SELECT_MATCH"; payload: number }
  | { type: "ADD_MATCH"; payload: Match }
  | { type: "ADD_COMMENTARY"; payload: Commentary }
  | { type: "SET_COMMENTARY"; payload: Commentary[] }
  | { type: "ADD_EVENT"; payload: MatchEvent }
  | { type: "UPDATE_STATS"; payload: MatchStats }
  | {
      type: "UPDATE_SCORE";
      payload: { matchId: number; homeScore: number; awayScore: number };
    }
  | { type: "SET_VIEWER_COUNT"; payload: { matchId: number; count: number } }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "SET_CHAT"; payload: ChatMessage[] };

function reducer(state: MatchState, action: Action): MatchState {
  switch (action.type) {
    case "SET_MATCHES":
      return { ...state, matches: action.payload, matchesLoading: false };

    case "SET_MATCHES_LOADING":
      return { ...state, matchesLoading: action.payload };

    case "SELECT_MATCH":
      return {
        ...state,
        selectedMatchId: action.payload,
        commentary: [],
        events: [],
        stats: null,
        chatMessages: [],
      };

    case "ADD_MATCH":
      if (state.matches.some((m) => m.id === action.payload.id)) return state;
      return { ...state, matches: [action.payload, ...state.matches] };

    case "ADD_COMMENTARY":
      if (state.commentary.some((c) => c.id === action.payload.id))
        return state;
      return {
        ...state,
        commentary: [...state.commentary, action.payload],
      };

    case "SET_COMMENTARY": {
      // Merge with any already-received WS entries (avoid losing live data)
      const existing = state.commentary;
      const ids = new Set(existing.map((c) => c.id));
      const merged = [...existing];
      for (const c of action.payload) {
        if (!ids.has(c.id)) merged.push(c);
      }
      merged.sort((a, b) => a.minutes - b.minutes || a.id - b.id);
      return { ...state, commentary: merged };
    }

    case "ADD_EVENT":
      if (state.events.some((e) => e.id === action.payload.id)) return state;
      return { ...state, events: [...state.events, action.payload] };

    case "UPDATE_STATS":
      return { ...state, stats: action.payload };

    case "UPDATE_SCORE": {
      const updated = state.matches.map((m) =>
        m.id === action.payload.matchId
          ? {
              ...m,
              homeScore: action.payload.homeScore,
              awayScore: action.payload.awayScore,
            }
          : m,
      );
      return { ...state, matches: updated };
    }

    case "SET_VIEWER_COUNT":
      return {
        ...state,
        viewerCounts: {
          ...state.viewerCounts,
          [action.payload.matchId]: action.payload.count,
        },
      };

    case "ADD_CHAT_MESSAGE":
      if (state.chatMessages.some((m) => m.id === action.payload.id))
        return state;
      return {
        ...state,
        chatMessages: [...state.chatMessages.slice(-99), action.payload],
      };

    case "SET_CHAT": {
      const existing = state.chatMessages;
      const ids = new Set(existing.map((m) => m.id));
      const merged = [...existing];
      for (const m of action.payload) {
        if (!ids.has(m.id)) merged.push(m);
      }
      return { ...state, chatMessages: merged };
    }

    default:
      return state;
  }
}

/* ─── Context ───────────────────────────────────────────── */

interface MatchContextValue {
  state: MatchState;
  selectMatch: (id: number) => void;
  sendChatMessage: (message: string) => void;
  currentMatch: Match | undefined;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { service, registerMatch } = useSocketContext();
  const selectedRef = useRef(state.selectedMatchId);
  selectedRef.current = state.selectedMatchId;

  /* ── Fetch matches from REST (or use simulation fallback) ── */
  useEffect(() => {
    if (SIMULATION_MODE) {
      dispatch({ type: "SET_MATCHES", payload: SIMULATION_MATCHES });
      // No auto-select — user picks a match
      return;
    }

    let cancelled = false;

    const load = () => {
      fetchMatches()
        .then((matches) => {
          if (cancelled) return;
          dispatch({ type: "SET_MATCHES", payload: matches });
          // Register matches with augmentor for contextual event generation
          matches.forEach(registerMatch);
          // No auto-select — user picks a match from the list
        })
        .catch((err) => {
          console.warn("[Castly] Failed to fetch matches:", err);
          if (!cancelled)
            dispatch({ type: "SET_MATCHES_LOADING", payload: false });
        });
    };

    load();

    // Poll for match list updates (scores, status changes)
    const pollId = setInterval(load, MATCH_POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, [registerMatch]);

  /* ── Fetch existing commentary + chat on match select ── */
  useEffect(() => {
    if (SIMULATION_MODE || state.selectedMatchId === null) return;

    let cancelled = false;

    // Fetch commentary
    fetchCommentary(state.selectedMatchId, 50)
      .then((data) => {
        if (cancelled) return;
        data.sort((a, b) => a.minutes - b.minutes || a.id - b.id);
        dispatch({ type: "SET_COMMENTARY", payload: data });
      })
      .catch((err) =>
        console.warn("[Castly] Failed to fetch commentary:", err),
      );

    // Fetch chat history
    fetchChat(state.selectedMatchId, 50)
      .then((data) => {
        if (cancelled) return;
        // REST returns desc order, reverse for chronological
        data.reverse();
        dispatch({ type: "SET_CHAT", payload: data });
      })
      .catch((err) =>
        console.warn("[Castly] Failed to fetch chat:", err),
      );

    return () => {
      cancelled = true;
    };
  }, [state.selectedMatchId]);

  /* ── Listen to socket events ── */
  useEffect(() => {
    const unsub = service.on((event: ServerEvent) => {
      switch (event.type) {
        case "commentary":
          if (event.data.matchId === selectedRef.current)
            dispatch({ type: "ADD_COMMENTARY", payload: event.data });
          break;
        case "match_created":
          dispatch({ type: "ADD_MATCH", payload: event.data });
          registerMatch(event.data);
          break;
        case "score_update":
          dispatch({ type: "UPDATE_SCORE", payload: event.data });
          break;
        case "stats_update":
          if (event.data.matchId === selectedRef.current)
            dispatch({ type: "UPDATE_STATS", payload: event.data.stats });
          break;
        case "match_event":
          if (event.data.matchId === selectedRef.current)
            dispatch({ type: "ADD_EVENT", payload: event.data });
          break;
        case "viewer_count":
          dispatch({ type: "SET_VIEWER_COUNT", payload: event.data });
          break;
        case "chat_message":
          if (event.data.matchId === selectedRef.current)
            dispatch({ type: "ADD_CHAT_MESSAGE", payload: event.data });
          break;
      }
    });
    return unsub;
  }, [service, registerMatch]);

  /* ── Subscribe to selected match ── */
  useEffect(() => {
    if (state.selectedMatchId !== null) {
      service.send({ type: "subscribe", matchId: state.selectedMatchId });
    }
    return () => {
      if (state.selectedMatchId !== null) {
        service.send({ type: "unsubscribe", matchId: state.selectedMatchId });
      }
    };
  }, [service, state.selectedMatchId]);

  /* ── Actions ── */

  const selectMatch = useCallback((id: number) => {
    dispatch({ type: "SELECT_MATCH", payload: id });
  }, []);

  const sendChatMessage = useCallback(
    (message: string) => {
      if (!state.selectedMatchId) return;

      const author = "You";

      if (SIMULATION_MODE) {
        // Offline: local-only
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          payload: {
            id: `user-${Date.now()}`,
            matchId: state.selectedMatchId,
            author,
            message,
            createdAt: new Date().toISOString(),
          },
        });
      } else {
        // Real backend: POST to API; WS broadcast will add it to state
        postChat(state.selectedMatchId, author, message).catch((err) => {
          console.warn("[Castly] Failed to send chat:", err);
          // Fallback: add locally so user sees their message
          dispatch({
            type: "ADD_CHAT_MESSAGE",
            payload: {
              id: `user-${Date.now()}`,
              matchId: state.selectedMatchId!,
              author,
              message,
              createdAt: new Date().toISOString(),
            },
          });
        });
      }
    },
    [state.selectedMatchId],
  );

  const currentMatch = state.matches.find(
    (m) => m.id === state.selectedMatchId,
  );

  return (
    <MatchContext.Provider
      value={{ state, selectMatch, sendChatMessage, currentMatch }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatchContext(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx)
    throw new Error("useMatchContext must be used within <MatchProvider>");
  return ctx;
}
