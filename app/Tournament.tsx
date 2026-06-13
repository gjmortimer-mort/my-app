import AutoRefresh from "./AutoRefresh";
import Board, { type TeamOption } from "./Board";
import Countdown from "./Countdown";
import Footer from "./Footer";
import { getTournamentData, IDLE_REFRESH_MS, LIVE_REFRESH_MS, ZONE_LABEL, type DataConfig } from "./lib/tournamentData";

export type TournamentConfig = DataConfig & {
  badge: string; // e.g. "FIFA World Cup 2026"
  teams?: TeamOption[]; // team-filter toggle options (defaults to SA + Australia)
  pointsNote?: string; // small print under the standings tables
};

export default async function Tournament({ config }: { config: TournamentConfig }) {
  const { badge, teams, pointsNote, season } = config;
  const { failed, matches, fixtures, standings, knockouts, updatedLabel, hasLive } =
    await getTournamentData(config);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh intervalMs={hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
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
          <Countdown fixtures={fixtures} />
        </div>
        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            {badge}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Results &amp; fixtures</h1>
          <p className="mt-2 text-sm text-slate-400">
            All times {ZONE_LABEL} · updated {updatedLabel} ·{" "}
            {hasLive ? (
              <span className="font-medium text-rose-300">live — refreshing every minute</span>
            ) : (
              "live scores refresh every minute during games"
            )}
          </p>
        </header>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the scores feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            No matches scheduled yet for the {season} season. They&apos;ll appear here as soon as fixtures are
            published.
          </div>
        ) : (
          <Board
            matches={matches}
            teams={teams}
            standings={standings}
            knockouts={knockouts}
            pointsNote={pointsNote}
          />
        )}
      </div>
      <Footer />
    </main>
  );
}
