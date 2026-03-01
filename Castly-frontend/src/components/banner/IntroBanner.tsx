/**
 * Intro Banner — Hero section with value proposition and Castly logo.
 */
export function IntroBanner() {
  const scrollToMatches = () => {
    document
      .getElementById("matches")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="card overflow-hidden">
      <div className="relative px-8 py-8 md:px-12 md:py-10 bg-linear-to-br from-sky-50 via-white to-orange-50">
        {/* Subtle decorative circles */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sky-100/60" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-orange-100/40" />

        <div className="relative z-10 flex items-center justify-between gap-8">
          {/* Left: copy + CTA */}
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-sky-600">
              Real-Time Broadcasting
            </p>
            <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl lg:text-4xl">
              Live Sports.
              <br />
              <span className="text-sky-600">Zero Delay.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 md:text-base">
              Professional match coverage with real-time commentary
              and instant event tracking — powered by Castly.
            </p>
            <button
              onClick={scrollToMatches}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-orange-500 bg-orange-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 hover:border-orange-600 active:scale-[0.98]"
            >
              View Live Matches
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Right: Castly Logo */}
          <div className="hidden md:flex shrink-0 flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-sky-600 shadow-lg">
              <svg
                className="h-10 w-10 text-white"
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
            <span className="text-lg font-black tracking-tight text-slate-800">
              Castly
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Broadcast Engine
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
