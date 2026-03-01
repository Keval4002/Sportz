import { useState, useEffect } from "react";
import { MS_PER_MINUTE } from "../../config";

interface Props {
  startTime: string;
}

/**
 * Always-running match clock.
 * Derives minute from match.startTime + MS_PER_MINUTE speed.
 * Ticks every second for live feel.
 */
export function MatchClock({ startTime }: Props) {
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => {
      const m = Math.min(
        90,
        Math.max(0, Math.floor((Date.now() - start) / MS_PER_MINUTE)),
      );
      setMinute(m);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums text-slate-900">
      <span className="live-dot h-1.5! w-1.5!" />
      {minute}
      <span className="text-slate-400">&prime;</span>
    </span>
  );
}
