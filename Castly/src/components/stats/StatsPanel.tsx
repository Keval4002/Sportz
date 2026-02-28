import { useMatchContext } from "../../context/MatchContext";
import type { MatchStats } from "../../types";

/* ─── Single Stat Row ───────────────────────────────────── */

function StatRow({
  label,
  home,
  away,
}: {
  label: string;
  home: number;
  away: number;
}) {
  const total = home + away || 1;
  const hp = (home / total) * 100;
  const ap = (away / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold text-slate-600">
        <span className="tabular-nums">{home}</span>
        <span className="text-slate-400">{label}</span>
        <span className="tabular-nums">{away}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <div
          className="rounded-full bg-sky-400 transition-all duration-700"
          style={{ width: `${hp}%` }}
        />
        <div
          className="rounded-full bg-orange-400 transition-all duration-700"
          style={{ width: `${ap}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Stats Grid ────────────────────────────────────────── */

function StatsGrid({ stats }: { stats: MatchStats }) {
  return (
    <div className="space-y-3">
      <StatRow label="Possession %" home={stats.possession.home} away={stats.possession.away} />
      <StatRow label="Shots" home={stats.shots.home} away={stats.shots.away} />
      <StatRow label="On Target" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
      <StatRow label="Fouls" home={stats.fouls.home} away={stats.fouls.away} />
      <StatRow label="Corners" home={stats.corners.home} away={stats.corners.away} />
      <StatRow label="Passes" home={stats.passes.home} away={stats.passes.away} />
      <StatRow label="Yellow Cards" home={stats.yellowCards.home} away={stats.yellowCards.away} />
      <StatRow label="Red Cards" home={stats.redCards.home} away={stats.redCards.away} />
    </div>
  );
}

/* ─── StatsPanel ────────────────────────────────────────── */

export function StatsPanel() {
  const { state, currentMatch } = useMatchContext();

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">
          Match Stats
        </h3>
        {currentMatch && (
          <div className="flex gap-4 text-xs font-bold">
            <span className="text-sky-600">{currentMatch.homeTeam}</span>
            <span className="text-orange-500">{currentMatch.awayTeam}</span>
          </div>
        )}
      </div>

      <div className="p-5">
        {state.stats ? (
          <StatsGrid stats={state.stats} />
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-slate-400">Waiting for stats…</p>
          </div>
        )}
      </div>
    </div>
  );
}
