import type { Metadata } from "next";
import Footer from "../Footer";

export const metadata: Metadata = {
  title: "U20 World Cup 2026 — Junior Boks",
  description: "World Rugby U20 Championship 2026 fixtures and results.",
};

// World Rugby U20 Championship isn't in the data feed, so fixtures are pinned
// from a source. Add games here (same idea as the Stanley Cup page) and they'll
// render below; until then the page shows a friendly placeholder.
type U20Game = {
  dateLabel: string;
  home: string;
  away: string;
  hs?: number;
  as?: number;
  comp?: string;
};
const U20_FIXTURES: U20Game[] = [];

export default function RugbyU20Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/morts-logo.png"
            alt="Morts Bar"
            className="h-16 w-16 rounded-full shadow-lg ring-1 ring-white/10 sm:h-20 sm:w-20"
          />
          <span
            className="text-2xl leading-tight text-amber-300 sm:text-4xl"
            style={{
              fontFamily: "var(--font-display)",
              textShadow: "0 0 8px rgba(251,191,36,0.55), 0 0 22px rgba(251,191,36,0.35)",
            }}
          >
            Morts Bar on Old Graham
          </span>
        </div>

        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            World Rugby U20 Championship 2026 🌱
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">U20 World Cup</h1>
          <p className="mt-2 text-sm text-slate-400">Backing the Junior Boks 🇿🇦 for the title.</p>
        </header>

        {U20_FIXTURES.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
            <p className="text-lg font-medium text-slate-300">Fixtures coming soon 🌱</p>
            <p className="mt-2 text-sm">
              The U20 World Cup isn&apos;t in the live data feed, so the schedule will be pinned by hand. Send the
              fixtures and they&apos;ll appear right here, with scores added as games are played.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {U20_FIXTURES.map((g, i) => {
              const played = g.hs != null && g.as != null;
              return (
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wide text-violet-300">{g.comp ?? "U20 World Cup"}</span>
                    <span className="text-slate-400">{g.dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex-1 truncate font-medium text-white">{g.home}</span>
                    <span className="shrink-0 text-lg font-semibold tabular-nums text-white">
                      {played ? `${g.hs} – ${g.as}` : "vs"}
                    </span>
                    <span className="flex-1 truncate text-right font-medium text-white">{g.away}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
