/** Reusable LIVE badge with pulsing dot */
export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700 border border-yellow-300 ${className}`}
    >
      <span className="live-dot" />
      LIVE
    </span>
  );
}
