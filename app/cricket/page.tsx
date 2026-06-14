import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import Countdown from "../Countdown";
import Footer from "../Footer";
import FixturesBoard from "../FixturesBoard";
import { getTeamFixtures, ZONE_LABEL } from "../lib/teamFixtures";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cricket — South Africa · Australia · New Zealand",
  description: "Recent and upcoming international cricket for South Africa, Australia and New Zealand.",
};

// National cricket team ids in TheSportsDB.
const CRICKET_TEAMS = [
  { id: "137150", key: "South Africa", label: "🇿🇦 South Africa" },
  { id: "137146", key: "Australia", label: "🇦🇺 Australia" },
  { id: "137145", key: "New Zealand", label: "🇳🇿 New Zealand" },
];

export default async function CricketPage() {
  const { failed, matches, fixtures, updatedLabel, hasLive } = await getTeamFixtures({
    teamIds: CRICKET_TEAMS.map((t) => t.id),
    teamSuffix: " Cricket",
    sport: "Cricket",
  });

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
            International Cricket 🏏
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            South Africa · Australia · New Zealand
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            All times {ZONE_LABEL} · recent results &amp; fixtures · updated {updatedLabel} ·{" "}
            {hasLive ? (
              <span className="font-medium text-rose-300">live — refreshing every minute</span>
            ) : (
              "refreshes automatically"
            )}
          </p>
        </header>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the cricket feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : (
          <FixturesBoard matches={matches} teams={CRICKET_TEAMS.map((t) => ({ key: t.key, label: t.label }))} />
        )}
      </div>
      <Footer />
    </main>
  );
}
