import { useEffect, useRef, useState } from "react";
import { useMatchContext } from "../../context/MatchContext";
import { MatchClock } from "../common/MatchClock";
import type { Commentary } from "../../types";

/* ─── Event icons ───────────────────────────────────────── */

const ICON: Record<string, string> = {
  goal: "⚽",
  yellow_card: "🟡",
  red_card: "🔴",
  foul: "⚠️",
  corner: "🚩",
  save: "🧤",
  kickoff: "🏁",
  halftime: "⏸",
  fulltime: "🏆",
  chance: "💨",
  substitution: "🔄",
  offside: "🚫",
  shot: "🎯",
  tackle: "💪",
  possession: "⚡",
  pass: "↗️",
};

/* ─── Commentary Item ───────────────────────────────────── */

function CommentaryItem({ item }: { item: Commentary }) {
  const icon = ICON[item.eventType ?? ""] ?? "📝";
  const isGoal = item.eventType === "goal";
  const isCard =
    item.eventType === "yellow_card" || item.eventType === "red_card";

  return (
    <div
      className={`slide-in flex gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
        isGoal
          ? "border-green-200 bg-green-50"
          : isCard
            ? "border-yellow-200 bg-yellow-50"
            : "border-slate-100 bg-slate-50/60"
      }`}
    >
      {/* Minute + icon */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        <span className="font-mono text-xs font-bold text-slate-500">
          {item.minutes}&prime;
        </span>
        <span className="text-base">{icon}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          {item.actor && (
            <span className="text-xs font-bold text-slate-800">
              {item.actor}
            </span>
          )}
          {item.team && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {item.team}
            </span>
          )}
        </div>
        <p
          className={`text-sm leading-relaxed ${
            isGoal ? "font-bold text-green-700" : "text-slate-700"
          }`}
        >
          {item.message}
        </p>
      </div>
    </div>
  );
}

/* ─── Commentary Feed ───────────────────────────────────── */

export function CommentaryFeed() {
  const { state, currentMatch } = useMatchContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = useState(false);

  /* Auto-scroll + pulse on new entry */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;

    if (state.commentary.length > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [state.commentary.length]);

  return (
    <div
      className={`card flex h-130 flex-col ${pulse ? "activity-pulse" : ""}`}
    >
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">
          Live Commentary
        </h3>
        {currentMatch && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800">
              {currentMatch.homeTeam}{" "}
              <span className="text-sky-600">
                {currentMatch.homeScore}-{currentMatch.awayScore}
              </span>{" "}
              {currentMatch.awayTeam}
            </span>
            <MatchClock startTime={currentMatch.startTime} />
          </div>
        )}
      </div>

      {/* Feed */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto p-4 feed-scroll"
      >
        {state.commentary.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">
              Waiting for commentary…
            </p>
          </div>
        ) : (
          state.commentary.map((item) => (
            <CommentaryItem key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
