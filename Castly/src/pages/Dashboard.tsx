import { IntroBanner } from "../components/banner/IntroBanner";
import { CurrentMatches } from "../components/matches/CurrentMatches";
import { CommentaryFeed } from "../components/commentary/CommentaryFeed";
import { ChatPanel } from "../components/chat/ChatPanel";
import { LiveBadge } from "../components/common/LiveBadge";
import { MatchClock } from "../components/common/MatchClock";
import { useMatchContext } from "../context/MatchContext";
import { useSocketContext } from "../context/SocketContext";

/* ─── Mode Badge ────────────────────────────────────────── */

function ModeBadge() {
  const { connected, mode } = useSocketContext();

  const modeLabel =
    mode === "simulation"
      ? "Simulation"
      : mode === "augmented"
        ? "Live + Augmented"
        : "Live Raw";

  const modeColor =
    mode === "simulation"
      ? "bg-orange-50 text-orange-600 border-orange-200"
      : mode === "augmented"
        ? "bg-sky-50 text-sky-600 border-sky-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
          connected
            ? "bg-green-50 text-green-600 border-green-200"
            : "bg-red-50 text-red-600 border-red-200"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`}
        />
        {connected ? "Connected" : "Reconnecting…"}
      </span>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${modeColor}`}
      >
        {modeLabel}
      </span>
    </div>
  );
}

/* ─── Match Header ──────────────────────────────────────── */

function MatchHeader() {
  const { currentMatch, state } = useMatchContext();
  if (!currentMatch) return null;

  const viewers = state.viewerCounts[currentMatch.id];

  return (
    <div className="card flex h-130 flex-col">
      <div className="card-header">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">
          Current Match
        </h3>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5">
        {currentMatch.status === "live" && <LiveBadge />}
        {currentMatch.status === "scheduled" && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-sky-500">
            Upcoming
          </span>
        )}
        {currentMatch.status === "finished" && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Full Time
          </span>
        )}

        {/* Home */}
        <p className="text-base font-black text-slate-800">
          {currentMatch.homeTeam}
        </p>

        {/* Score */}
        <div className="flex items-center gap-3">
          <span className="text-4xl font-black tabular-nums text-slate-900">
            {currentMatch.homeScore}
          </span>
          <span className="text-lg font-bold text-slate-300">–</span>
          <span className="text-4xl font-black tabular-nums text-slate-900">
            {currentMatch.awayScore}
          </span>
        </div>

        {/* Away */}
        <p className="text-base font-black text-slate-800">
          {currentMatch.awayTeam}
        </p>

        {currentMatch.status === "live" && (
          <MatchClock startTime={currentMatch.startTime} />
        )}
        {viewers !== undefined && (
          <span className="text-[10px] font-semibold text-slate-400">
            {viewers.toLocaleString()} watching
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="card flex items-center justify-center py-20 px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-700">
          Select a match to start watching
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Choose a match from the sidebar to see live commentary and stats.
        </p>
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────── */

export function Dashboard() {
  const { currentMatch } = useMatchContext();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Hero */}
      <IntroBanner />

      {/* Mode indicator */}
      <ModeBadge />

      {/* Horizontal match list */}
      <CurrentMatches />

      {/* Selected match content — 3 columns */}
      {currentMatch ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <MatchHeader />
          <CommentaryFeed />
          <ChatPanel />
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
