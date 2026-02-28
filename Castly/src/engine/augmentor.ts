/**
 * Augmentation Layer
 *
 * Wraps a real SocketService and enriches the event stream.
 *
 * Behavior:
 * - Passes ALL real events through untouched (real data always wins)
 * - Monitors commentary flow — injects supplemental commentary when sparse
 * - Generates viewer counts, stats, chat (backend doesn't provide these yet)
 * - Automatically throttles commentary augmentation when real events flow
 * - Never changes match status, never overrides real scores
 *
 * Design:
 *   UI → augmentor.on(handler) → receives both real + augmented events
 *   UI → augmentor.send(event) → forwarded to real socket
 *
 * The UI does not know or care which events are real vs augmented.
 */

import type { SocketService } from "../services/socket";
import type {
  ServerEvent,
  Match,
  MatchStats,
  Commentary,
  ChatMessage,
} from "../types";
import {
  generateCommentaryText,
  type EventType,
  type CommentaryContext,
} from "./commentary";
import { getPlayersForTeam, pick, CHAT_NAMES, CHAT_REACTIONS } from "./data";
import { MS_PER_MINUTE } from "../config";

/* ─── Config ────────────────────────────────────────────── */

interface AugmentorConfig {
  /** Inject supplemental commentary after this many ms of silence */
  commentaryGapMs: number;
  /** Run the gap monitor every N ms */
  monitorIntervalMs: number;
  /** Fluctuate viewer count every N ms */
  viewerIntervalMs: number;
  /** Update stats every N ms */
  statsIntervalMs: number;
  /** Generate chat message every N ms (base) */
  chatIntervalBaseMs: number;
  /** Random additional delay for chat (ms) */
  chatIntervalJitterMs: number;
}

const DEFAULTS: AugmentorConfig = {
  commentaryGapMs: 25_000,
  monitorIntervalMs: 5_000,
  viewerIntervalMs: 5_000,
  statsIntervalMs: 8_000,
  chatIntervalBaseMs: 12_000,
  chatIntervalJitterMs: 15_000,
};

/* ─── Weighted commentary event picker ──────────────────── */

const COMMENTARY_WEIGHTS: [EventType, number][] = [
  ["possession", 35],
  ["pass", 20],
  ["foul", 12],
  ["shot", 8],
  ["corner", 7],
  ["save", 5],
  ["chance", 5],
  ["tackle", 5],
];
const TOTAL_W = COMMENTARY_WEIGHTS.reduce((s, [, w]) => s + w, 0);

function pickCommentaryEvent(): EventType {
  let r = Math.random() * TOTAL_W;
  for (const [t, w] of COMMENTARY_WEIGHTS) {
    r -= w;
    if (r <= 0) return t;
  }
  return "possession";
}

/* ─── Per-match activity state ──────────────────────────── */

interface MatchActivity {
  match: Match;
  lastRealCommentary: number;
  viewerCount: number;
  stats: MatchStats;
  cSeq: number;
  chatSeq: number;
}

function createMatchActivity(m: Match): MatchActivity {
  const hp = 45 + Math.floor(Math.random() * 12);
  return {
    match: m,
    lastRealCommentary: Date.now(),
    viewerCount: 800 + Math.floor(Math.random() * 600),
    stats: {
      possession: { home: hp, away: 100 - hp },
      shots: {
        home: 3 + Math.floor(Math.random() * 6),
        away: 2 + Math.floor(Math.random() * 5),
      },
      shotsOnTarget: {
        home: 1 + Math.floor(Math.random() * 3),
        away: 1 + Math.floor(Math.random() * 2),
      },
      fouls: {
        home: 2 + Math.floor(Math.random() * 4),
        away: 2 + Math.floor(Math.random() * 4),
      },
      corners: {
        home: 1 + Math.floor(Math.random() * 3),
        away: 1 + Math.floor(Math.random() * 3),
      },
      yellowCards: {
        home: Math.floor(Math.random() * 2),
        away: Math.floor(Math.random() * 2),
      },
      redCards: { home: 0, away: 0 },
      passes: {
        home: 180 + Math.floor(Math.random() * 120),
        away: 160 + Math.floor(Math.random() * 100),
      },
    },
    cSeq: -1,
    chatSeq: 0,
  };
}

/* ─── Factory ───────────────────────────────────────────── */

export interface AugmentedSocketService extends SocketService {
  /** Register a match so the augmentor can generate contextual events */
  registerMatch(match: Match): void;
}

export function createAugmentor(
  realSocket: SocketService,
  config?: Partial<AugmentorConfig>,
): AugmentedSocketService {
  const cfg = { ...DEFAULTS, ...config };

  type Handler = (e: ServerEvent) => void;
  const outerHandlers = new Set<Handler>();

  /** Match data registry (populated by registerMatch) */
  const matchRegistry = new Map<number, Match>();
  /** Per-match activity tracking */
  const activityMap = new Map<number, MatchActivity>();
  /** Currently subscribed match ID */
  let subscribedMatchId: number | null = null;
  /** Timers for the subscribed match (cleared on unsub) */
  const subTimers: ReturnType<typeof setTimeout>[] = [];
  /** Background timers (cleared on disconnect) */
  const bgTimers: ReturnType<typeof setInterval>[] = [];
  let _connected = false;

  /* ── Emit helpers ── */

  const emitOuter = (e: ServerEvent) => outerHandlers.forEach((h) => h(e));

  /* ── Match helpers ── */

  function getMinute(m: Match): number {
    return Math.min(
      90,
      Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(m.startTime).getTime()) / MS_PER_MINUTE,
        ),
      ),
    );
  }

  function makeCtx(a: MatchActivity, isHome: boolean): CommentaryContext {
    const m = a.match;
    const team = isHome ? m.homeTeam : m.awayTeam;
    const otherTeam = isHome ? m.awayTeam : m.homeTeam;
    const players = getPlayersForTeam(team);
    return {
      team,
      otherTeam,
      player: pick(players),
      minute: getMinute(m),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
    };
  }

  /* ── Commentary augmentation ── */

  function injectCommentary(matchId: number) {
    const a = activityMap.get(matchId);
    if (!a || a.match.status !== "live") return;

    const type = pickCommentaryEvent();
    const isHome = Math.random() > 0.45;
    const ctx = makeCtx(a, isHome);

    const c: Commentary = {
      id: a.cSeq--,
      matchId,
      minutes: getMinute(a.match),
      sequence: null,
      period: ctx.minute <= 45 ? "1st half" : "2nd half",
      eventType: type,
      actor: ctx.player,
      team: ctx.team,
      message: generateCommentaryText(type, ctx),
      metadata: null,
      tags: [type],
      createdAt: new Date().toISOString(),
    };
    emitOuter({ type: "commentary", data: c });

    /* Side-effect: update stats for certain event types */
    const side: "home" | "away" = isHome ? "home" : "away";
    if (type === "foul") a.stats.fouls[side]++;
    else if (type === "shot") {
      a.stats.shots[side]++;
      if (Math.random() > 0.5) a.stats.shotsOnTarget[side]++;
    } else if (type === "corner") a.stats.corners[side]++;

    /* Possession drift */
    const shift = Math.floor(Math.random() * 3) - 1;
    const h = Math.max(30, Math.min(70, a.stats.possession.home + shift));
    a.stats.possession = { home: h, away: 100 - h };
    a.stats.passes.home += Math.floor(Math.random() * 5);
    a.stats.passes.away += Math.floor(Math.random() * 5);
  }

  /* ── Gap monitor: checks if real commentary has gone silent ── */

  function startMonitor(matchId: number) {
    const id = setInterval(() => {
      const a = activityMap.get(matchId);
      if (!a || a.match.status !== "live") return;
      if (Date.now() - a.lastRealCommentary > cfg.commentaryGapMs) {
        injectCommentary(matchId);
        // Reset timer so we don't spam — wait another full gap
        a.lastRealCommentary = Date.now();
      }
    }, cfg.monitorIntervalMs);
    bgTimers.push(id);
  }

  /* ── Viewer count generator ── */

  function startViewerLoop(matchId: number) {
    const id = setInterval(() => {
      const a = activityMap.get(matchId);
      if (!a) return;
      a.viewerCount = Math.max(
        400,
        a.viewerCount + Math.floor(Math.random() * 20) - 10,
      );
      emitOuter({
        type: "viewer_count",
        data: { matchId, count: a.viewerCount },
      });
    }, cfg.viewerIntervalMs);
    bgTimers.push(id);
  }

  /* ── Stats generator ── */

  function startStatsLoop(matchId: number) {
    // Emit initial stats immediately
    const a = activityMap.get(matchId);
    if (a) {
      emitOuter({
        type: "stats_update",
        data: { matchId, stats: { ...a.stats } },
      });
    }

    const id = setInterval(() => {
      const act = activityMap.get(matchId);
      if (!act || act.match.status !== "live") return;
      emitOuter({
        type: "stats_update",
        data: { matchId, stats: { ...act.stats } },
      });
    }, cfg.statsIntervalMs);
    bgTimers.push(id);
  }

  /* ── Chat generator ── */

  function startChatLoop(matchId: number) {
    const loop = () => {
      const a = activityMap.get(matchId);
      if (!a) return;
      const msg: ChatMessage = {
        id: `aug-chat-${matchId}-${a.chatSeq++}`,
        matchId,
        author: pick(CHAT_NAMES),
        message: pick(CHAT_REACTIONS.general),
        createdAt: new Date().toISOString(),
      };
      emitOuter({ type: "chat_message", data: msg });
      const t = setTimeout(
        loop,
        cfg.chatIntervalBaseMs + Math.random() * cfg.chatIntervalJitterMs,
      );
      subTimers.push(t);
    };
    const t = setTimeout(
      loop,
      5_000 + Math.random() * 5_000,
    );
    subTimers.push(t);
  }

  /* ── Start augmentation for a match subscription ── */

  function startAugmentation(matchId: number) {
    const match = matchRegistry.get(matchId);
    if (!match) return;

    if (!activityMap.has(matchId)) {
      activityMap.set(matchId, createMatchActivity(match));
    }

    startMonitor(matchId);
    startViewerLoop(matchId);
    startStatsLoop(matchId);
    startChatLoop(matchId);
  }

  function stopSubTimers() {
    subTimers.forEach(clearTimeout);
    subTimers.length = 0;
  }

  /* ── Real event interceptor ── */

  function onRealEvent(event: ServerEvent) {
    // Always pass through
    emitOuter(event);

    // Track activity
    if (event.type === "commentary" && subscribedMatchId !== null) {
      const a = activityMap.get(subscribedMatchId);
      if (a && event.data.matchId === subscribedMatchId) {
        a.lastRealCommentary = Date.now();
      }
    }

    if (event.type === "score_update") {
      // Update match score in registry
      const m = matchRegistry.get(event.data.matchId);
      if (m) {
        m.homeScore = event.data.homeScore;
        m.awayScore = event.data.awayScore;
      }
    }
  }

  /* ─── SocketService Interface ─────────────────────────── */

  function connect() {
    realSocket.connect();
    _connected = true;

    // Listen to real socket events through interceptor
    realSocket.on(onRealEvent);
  }

  function disconnect() {
    _connected = false;
    stopSubTimers();
    bgTimers.forEach(clearInterval);
    bgTimers.length = 0;
    activityMap.clear();
    realSocket.disconnect();
  }

  function send(event: { type: string; matchId?: number }) {
    // Forward to real socket
    realSocket.send(event as never);

    // Track subscriptions for augmentation
    if (event.type === "subscribe" && event.matchId) {
      subscribedMatchId = event.matchId;
      // Start augmentation after a short delay (let real events arrive first)
      const t = setTimeout(() => startAugmentation(event.matchId!), 1_500);
      subTimers.push(t);
    }

    if (event.type === "unsubscribe" && event.matchId) {
      if (subscribedMatchId === event.matchId) subscribedMatchId = null;
      stopSubTimers();
    }
  }

  function on(handler: Handler): () => void {
    outerHandlers.add(handler);
    return () => {
      outerHandlers.delete(handler);
    };
  }

  function registerMatch(match: Match) {
    matchRegistry.set(match.id, { ...match });
  }

  return {
    connect,
    disconnect,
    send,
    on,
    registerMatch,
    get connected() {
      return _connected || realSocket.connected;
    },
  };
}
