import { useState } from "react";
import { useMatchContext } from "../../context/MatchContext";
import { LiveBadge } from "../common/LiveBadge";
import { MatchClock } from "../common/MatchClock";
import type { Match, MatchStatus } from "../../types";

/* ─── Filter Tabs ───────────────────────────────────────── */

type Filter = "all" | MatchStatus;
const TABS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "scheduled" },
  { label: "Ended", value: "finished" },
];

/* ─── Status Badge ──────────────────────────────────────── */

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === "live") return <LiveBadge />;
  if (status === "scheduled")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-600">
        Upcoming
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
      Ended
    </span>
  );
}

/* ─── Match Card ────────────────────────────────────────── */

function MatchCard({
  match,
  selected,
  viewers,
  onSelect,
}: {
  match: Match;
  selected: boolean;
  viewers?: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all ${
        selected
          ? "border-sky-400 bg-sky-50/70 shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
      }`}
    >
      {/* Top row: status badge + viewers */}
      <div className="flex items-center justify-between mb-2">
        <StatusBadge status={match.status} />
        <div className="flex items-center gap-2">
          {match.status === "live" && (
            <MatchClock startTime={match.startTime} />
          )}
          {viewers !== undefined && match.status === "live" && (
            <span className="text-[10px] font-semibold text-slate-400">
              {viewers.toLocaleString()} watching
            </span>
          )}
        </div>
      </div>

      {/* Teams & score */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {match.homeTeam}
          </p>
          <p className="text-sm font-bold text-slate-800 truncate">
            {match.awayTeam}
          </p>
        </div>

        {match.status !== "scheduled" && (
          <div className="flex flex-col items-center shrink-0">
            <span
              className={`text-lg font-black tabular-nums ${
                selected ? "text-sky-600" : "text-slate-700"
              }`}
            >
              {match.homeScore}
            </span>
            <span className="text-[10px] font-bold text-slate-300">—</span>
            <span
              className={`text-lg font-black tabular-nums ${
                selected ? "text-sky-600" : "text-slate-700"
              }`}
            >
              {match.awayScore}
            </span>
          </div>
        )}

        {match.status === "scheduled" && (
          <div className="shrink-0 text-center">
            <p className="text-xs font-semibold text-slate-400">
              {new Date(match.startTime).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-xs font-bold text-slate-500">
              {new Date(match.startTime).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

/* ─── CurrentMatches ────────────────────────────────────── */

export function CurrentMatches() {
  const { state, selectMatch } = useMatchContext();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? state.matches
      : state.matches.filter((m) => m.status === filter);

  const counts: Record<Filter, number> = {
    all: state.matches.length,
    live: state.matches.filter((m) => m.status === "live").length,
    scheduled: state.matches.filter((m) => m.status === "scheduled").length,
    finished: state.matches.filter((m) => m.status === "finished").length,
  };

  return (
    <div className="card" id="matches">
      {/* Header + Tabs row */}
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">
          Matches
        </h3>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`relative px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                filter === tab.value
                  ? "bg-sky-50 text-sky-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span
                  className={`ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                    filter === tab.value
                      ? "bg-sky-100 text-sky-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal scrollable match list */}
      <div className="flex gap-3 overflow-x-auto p-3 feed-scroll">
        {state.matchesLoading ? (
          <div className="flex w-full items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex w-full items-center justify-center py-8">
            <p className="text-sm text-slate-400">
              No {filter === "all" ? "" : filter} matches found
            </p>
          </div>
        ) : (
          filtered.map((match) => (
            <div key={match.id} className="shrink-0 w-64">
              <MatchCard
                match={match}
                selected={state.selectedMatchId === match.id}
                viewers={state.viewerCounts[match.id]}
                onSelect={() => selectMatch(match.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
