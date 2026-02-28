/* ─── Match ──────────────────────────────────────────────────── */

export type MatchStatus = "scheduled" | "live" | "finished";

export interface Match {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  startTime: string;
  endTime: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

/* ─── Commentary ─────────────────────────────────────────────── */

export interface Commentary {
  id: number;
  matchId: number;
  minutes: number;
  sequence: number | null;
  period: string | null;
  eventType: string | null;
  actor: string | null;
  team: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  createdAt: string;
}

/* ─── Stats ──────────────────────────────────────────────────── */

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  fouls: { home: number; away: number };
  corners: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  passes: { home: number; away: number };
}

/* ─── Events (Timeline) ─────────────────────────────────────── */

export interface MatchEvent {
  id: string;
  matchId: number;
  minute: number;
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "foul"
    | "corner"
    | "kickoff"
    | "halftime"
    | "fulltime"
    | "var"
    | "penalty"
    | "save";
  team: string | null;
  player: string | null;
  detail: string;
}

/* ─── Chat ───────────────────────────────────────────────────── */

export interface ChatMessage {
  id: string | number;
  matchId: number;
  author: string;
  message: string;
  createdAt: string;
  isSystem?: boolean;
}

/* ─── WebSocket Event Payloads (from backend) ────────────────── */

export type ServerEvent =
  | { type: "connection_upgraded" }
  | { type: "subscribed"; matchId: number }
  | { type: "unsubscribed"; matchId: number }
  | { type: "match_created"; data: Match }
  | { type: "commentary"; data: Commentary }
  | {
      type: "score_update";
      data: { matchId: number; homeScore: number; awayScore: number };
    }
  | { type: "stats_update"; data: { matchId: number; stats: MatchStats } }
  | { type: "match_event"; data: MatchEvent }
  | { type: "viewer_count"; data: { matchId: number; count: number } }
  | { type: "chat_message"; data: ChatMessage }
  | { type: "error"; message: string };

export type ClientEvent =
  | { type: "subscribe"; matchId: number }
  | { type: "unsubscribe"; matchId: number };
