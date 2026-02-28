/**
 * Pure-Offline Simulation Engine
 *
 * Used when VITE_SIMULATION_MODE=true (no backend available).
 * Implements SocketService — emits structured events identical to real backend schema.
 * Uses weighted probabilities, time gaps, and intensity surges for realism.
 *
 * When the real backend is available, use the augmentor instead.
 */

import type {
  ServerEvent,
  Commentary,
  MatchEvent,
  MatchStats,
  Match,
  ChatMessage,
} from "../types";
import type { SocketService } from "../services/socket";
import {
  generateCommentaryText,
  type EventType,
  type CommentaryContext,
} from "./commentary";
import {
  getPlayersForTeam,
  pick,
  CHAT_NAMES,
  CHAT_REACTIONS,
} from "./data";
import { MS_PER_MINUTE } from "../config";

/* ─── Timing ────────────────────────────────────────────── */

const MIN_DELAY = 8_000;
const MAX_DELAY = 25_000;
const POST_GOAL_MULT = 0.6;
const POST_GOAL_WINDOW = 30_000;

/* ─── Weighted Event Probabilities ──────────────────────── */

const WEIGHTS: [EventType, number][] = [
  ["possession", 35],
  ["pass", 20],
  ["foul", 12],
  ["shot", 8],
  ["corner", 7],
  ["save", 5],
  ["chance", 5],
  ["tackle", 5],
  ["goal", 3],
];
const TOTAL_W = WEIGHTS.reduce((s, [, w]) => s + w, 0);

function pickEvent(): EventType {
  let r = Math.random() * TOTAL_W;
  for (const [t, w] of WEIGHTS) {
    r -= w;
    if (r <= 0) return t;
  }
  return "possession";
}

/* ─── Simulation Match Data ─────────────────────────────── */

const now = Date.now();

export const SIMULATION_MATCHES: Match[] = [
  {
    id: 1,
    sport: "Football",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    status: "live",
    startTime: new Date(now - 70 * MS_PER_MINUTE).toISOString(),
    endTime: new Date(now + 20 * MS_PER_MINUTE).toISOString(),
    homeScore: 2,
    awayScore: 1,
    createdAt: new Date(now - 80 * MS_PER_MINUTE).toISOString(),
  },
  {
    id: 2,
    sport: "Football",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    status: "live",
    startTime: new Date(now - 35 * MS_PER_MINUTE).toISOString(),
    endTime: new Date(now + 55 * MS_PER_MINUTE).toISOString(),
    homeScore: 1,
    awayScore: 1,
    createdAt: new Date(now - 45 * MS_PER_MINUTE).toISOString(),
  },
  {
    id: 3,
    sport: "Football",
    homeTeam: "Liverpool",
    awayTeam: "Man United",
    status: "live",
    startTime: new Date(now - 55 * MS_PER_MINUTE).toISOString(),
    endTime: new Date(now + 35 * MS_PER_MINUTE).toISOString(),
    homeScore: 3,
    awayScore: 0,
    createdAt: new Date(now - 65 * MS_PER_MINUTE).toISOString(),
  },
];

/* ─── Per-Match State ───────────────────────────────────── */

interface SimState {
  match: Match;
  homeScore: number;
  awayScore: number;
  stats: MatchStats;
  viewers: number;
  cSeq: number;
  eSeq: number;
  chatSeq: number;
  lastGoal: number;
}

function createSimState(m: Match): SimState {
  const hp = 48 + Math.floor(Math.random() * 8);
  return {
    match: m,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    stats: {
      possession: { home: hp, away: 100 - hp },
      shots: {
        home: 4 + Math.floor(Math.random() * 8),
        away: 2 + Math.floor(Math.random() * 6),
      },
      shotsOnTarget: {
        home: 2 + Math.floor(Math.random() * 4),
        away: 1 + Math.floor(Math.random() * 3),
      },
      fouls: {
        home: 2 + Math.floor(Math.random() * 5),
        away: 2 + Math.floor(Math.random() * 5),
      },
      corners: {
        home: 1 + Math.floor(Math.random() * 4),
        away: 1 + Math.floor(Math.random() * 3),
      },
      yellowCards: {
        home: Math.floor(Math.random() * 2),
        away: Math.floor(Math.random() * 2),
      },
      redCards: { home: 0, away: 0 },
      passes: {
        home: 200 + Math.floor(Math.random() * 150),
        away: 180 + Math.floor(Math.random() * 120),
      },
    },
    viewers: 800 + Math.floor(Math.random() * 600),
    cSeq: 100,
    eSeq: 100,
    chatSeq: 0,
    lastGoal: 0,
  };
}

/* ─── Utilities ─────────────────────────────────────────── */

function getMinute(m: Match): number {
  return Math.min(
    90,
    Math.max(
      0,
      Math.floor((Date.now() - new Date(m.startTime).getTime()) / MS_PER_MINUTE),
    ),
  );
}

function makeCtx(s: SimState, isHome: boolean): CommentaryContext {
  const team = isHome ? s.match.homeTeam : s.match.awayTeam;
  const otherTeam = isHome ? s.match.awayTeam : s.match.homeTeam;
  const players = getPlayersForTeam(team);
  return {
    team,
    otherTeam,
    player: pick(players),
    minute: getMinute(s.match),
    homeTeam: s.match.homeTeam,
    awayTeam: s.match.awayTeam,
    homeScore: s.homeScore,
    awayScore: s.awayScore,
  };
}

/* ─── Engine Factory ────────────────────────────────────── */

export function createSimulationEngine(): SocketService {
  type Handler = (e: ServerEvent) => void;
  const handlers = new Set<Handler>();
  const states = new Map<number, SimState>();
  const subTimers = new Map<number, ReturnType<typeof setTimeout>[]>();
  const bgTimers: ReturnType<typeof setTimeout>[] = [];
  let _connected = false;

  const emit = (e: ServerEvent) => handlers.forEach((h) => h(e));

  function pushSub(matchId: number, t: ReturnType<typeof setTimeout>) {
    let arr = subTimers.get(matchId);
    if (!arr) {
      arr = [];
      subTimers.set(matchId, arr);
    }
    arr.push(t);
  }

  /* ── Event Generation ── */

  function emitEvent(matchId: number) {
    const s = states.get(matchId);
    if (!s) return;
    const min = getMinute(s.match);
    if (min >= 90) return;

    const type = pickEvent();
    const isHome = Math.random() > 0.45;
    const ctx = makeCtx(s, isHome);
    const side: "home" | "away" = isHome ? "home" : "away";

    const c: Commentary = {
      id: s.cSeq++,
      matchId,
      minutes: min,
      sequence: s.cSeq,
      period: min <= 45 ? "1st half" : "2nd half",
      eventType: type,
      actor: ctx.player,
      team: ctx.team,
      message: generateCommentaryText(type, ctx),
      metadata: null,
      tags: [type],
      createdAt: new Date().toISOString(),
    };

    switch (type) {
      case "goal": {
        if (isHome) s.homeScore++;
        else s.awayScore++;
        const gCtx = { ...ctx, homeScore: s.homeScore, awayScore: s.awayScore };
        c.message = generateCommentaryText("goal", gCtx);
        emit({ type: "commentary", data: c });
        emit({
          type: "score_update",
          data: { matchId, homeScore: s.homeScore, awayScore: s.awayScore },
        });
        emit({
          type: "match_event",
          data: {
            id: `e${s.eSeq++}`,
            matchId,
            minute: min,
            type: "goal",
            team: ctx.team,
            player: ctx.player,
            detail: `Goal — ${s.match.homeTeam} ${s.homeScore}-${s.awayScore} ${s.match.awayTeam}`,
          },
        });
        s.lastGoal = Date.now();
        emitChatBurst(matchId, "goal");
        break;
      }
      case "foul": {
        s.stats.fouls[side]++;
        emit({ type: "commentary", data: c });
        if (Math.random() > 0.7) {
          const red = Math.random() > 0.9;
          if (red) s.stats.redCards[side]++;
          else s.stats.yellowCards[side]++;
          const cardEvt: MatchEvent = {
            id: `e${s.eSeq++}`,
            matchId,
            minute: min,
            type: red ? "red_card" : "yellow_card",
            team: ctx.team,
            player: ctx.player,
            detail: red ? "Red card" : "Yellow card",
          };
          emit({ type: "match_event", data: cardEvt });
        }
        emit({ type: "stats_update", data: { matchId, stats: { ...s.stats } } });
        emitChatBurst(matchId, "foul");
        break;
      }
      case "shot": {
        s.stats.shots[side]++;
        if (Math.random() > 0.5) s.stats.shotsOnTarget[side]++;
        emit({ type: "commentary", data: c });
        emit({ type: "stats_update", data: { matchId, stats: { ...s.stats } } });
        break;
      }
      case "corner": {
        s.stats.corners[side]++;
        emit({ type: "commentary", data: c });
        emit({ type: "stats_update", data: { matchId, stats: { ...s.stats } } });
        break;
      }
      case "save":
        emit({ type: "commentary", data: c });
        emitChatBurst(matchId, "save");
        break;
      case "chance":
        emit({ type: "commentary", data: c });
        emitChatBurst(matchId, "chance");
        break;
      default:
        emit({ type: "commentary", data: c });
    }

    const shift = Math.floor(Math.random() * 3) - 1;
    const h = Math.max(30, Math.min(70, s.stats.possession.home + shift));
    s.stats.possession = { home: h, away: 100 - h };
    s.stats.passes.home += Math.floor(Math.random() * 6);
    s.stats.passes.away += Math.floor(Math.random() * 6);
  }

  /* ── Chat ── */

  function emitChatBurst(matchId: number, key: string) {
    const s = states.get(matchId);
    if (!s) return;
    const msgs = CHAT_REACTIONS[key] ?? CHAT_REACTIONS.general;
    const count = key === "goal" ? 3 : Math.random() > 0.4 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => {
        const cm: ChatMessage = {
          id: `chat-${matchId}-${s.chatSeq++}`,
          matchId,
          author: pick(CHAT_NAMES),
          message: pick(msgs),
          createdAt: new Date().toISOString(),
        };
        emit({ type: "chat_message", data: cm });
      }, i * 1500 + Math.random() * 2000);
      pushSub(matchId, t);
    }
  }

  function startChatLoop(matchId: number) {
    const s = states.get(matchId);
    if (!s) return;
    const loop = () => {
      const cm: ChatMessage = {
        id: `chat-${matchId}-${s.chatSeq++}`,
        matchId,
        author: pick(CHAT_NAMES),
        message: pick(CHAT_REACTIONS.general),
        createdAt: new Date().toISOString(),
      };
      emit({ type: "chat_message", data: cm });
      const t = setTimeout(loop, 10_000 + Math.random() * 15_000);
      pushSub(matchId, t);
    };
    const t = setTimeout(loop, 5_000);
    pushSub(matchId, t);
  }

  /* ── Loops ── */

  function scheduleEventLoop(matchId: number) {
    const s = states.get(matchId);
    if (!s) return;
    let delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    if (Date.now() - s.lastGoal < POST_GOAL_WINDOW) delay *= POST_GOAL_MULT;
    const t = setTimeout(() => {
      emitEvent(matchId);
      scheduleEventLoop(matchId);
    }, delay);
    pushSub(matchId, t);
  }

  function startViewerLoop(matchId: number) {
    const s = states.get(matchId);
    if (!s) return;
    const loop = () => {
      s.viewers = Math.max(500, s.viewers + Math.floor(Math.random() * 20) - 10);
      emit({ type: "viewer_count", data: { matchId, count: s.viewers } });
      const t = setTimeout(loop, 3_000 + Math.random() * 4_000);
      bgTimers.push(t);
    };
    loop();
  }

  function seedCommentary(s: SimState): Commentary[] {
    const min = getMinute(s.match);
    const entries: Commentary[] = [];
    const types: EventType[] = [
      "possession",
      "pass",
      "tackle",
      "foul",
      "shot",
      "chance",
    ];
    for (
      let m = Math.max(0, min - 12);
      m < min;
      m += 2 + Math.floor(Math.random() * 2)
    ) {
      const isHome = Math.random() > 0.45;
      const ctx = makeCtx(s, isHome);
      ctx.minute = m;
      const type = pick(types);
      entries.push({
        id: s.cSeq++,
        matchId: s.match.id,
        minutes: m,
        sequence: s.cSeq,
        period: m <= 45 ? "1st half" : "2nd half",
        eventType: type,
        actor: ctx.player,
        team: ctx.team,
        message: generateCommentaryText(type, ctx),
        metadata: null,
        tags: [type],
        createdAt: new Date(Date.now() - (min - m) * MS_PER_MINUTE).toISOString(),
      });
    }
    return entries;
  }

  /* ─── SocketService Interface ── */

  function connect() {
    _connected = true;
    emit({ type: "connection_upgraded" });
    SIMULATION_MATCHES.forEach((m) => states.set(m.id, createSimState(m)));
    setTimeout(() => {
      states.forEach((s, id) => {
        emit({ type: "viewer_count", data: { matchId: id, count: s.viewers } });
        startViewerLoop(id);
      });
    }, 200);
  }

  function disconnect() {
    _connected = false;
    subTimers.forEach((arr) => arr.forEach(clearTimeout));
    subTimers.clear();
    bgTimers.forEach(clearTimeout);
    bgTimers.length = 0;
    states.clear();
  }

  function send(event: { type: string; matchId?: number }) {
    if (event.type === "subscribe" && event.matchId) {
      const matchId = event.matchId;
      setTimeout(() => {
        emit({ type: "subscribed", matchId });
        const s = states.get(matchId);
        if (!s) return;
        emit({ type: "stats_update", data: { matchId, stats: { ...s.stats } } });
        const seed = seedCommentary(s);
        seed.forEach((c, i) =>
          setTimeout(() => emit({ type: "commentary", data: c }), i * 50),
        );
        const t = setTimeout(() => {
          scheduleEventLoop(matchId);
          startChatLoop(matchId);
        }, seed.length * 50 + 500);
        pushSub(matchId, t);
      }, 100);
    }
    if (event.type === "unsubscribe" && event.matchId) {
      const arr = subTimers.get(event.matchId);
      if (arr) {
        arr.forEach(clearTimeout);
        arr.length = 0;
      }
      setTimeout(() => emit({ type: "unsubscribed", matchId: event.matchId! }), 50);
    }
  }

  function on(handler: Handler): () => void {
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
