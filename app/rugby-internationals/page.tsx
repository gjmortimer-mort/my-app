import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import Countdown from "../Countdown";
import Footer from "../Footer";
import FixturesBoard from "../FixturesBoard";
import { getTeamFixtures, ZONE_LABEL } from "../lib/teamFixtures";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "International Rugby 2026 — Tier 1",
  description: "2026 international rugby for the Tier 1 nations: Six Nations, The Rugby Championship and test windows.",
};

// Tier 1 national rugby team ids in TheSportsDB.
const TIER1 = [
  { id: "137137", name: "South Africa" },
  { id: "137133", name: "New Zealand" },
  { id: "137125", name: "Australia" },
  { id: "137123", name: "England" },
  { id: "137130", name: "Ireland" },
  { id: "137141", name: "Wales" },
  { id: "137136", name: "Scotland" },
  { id: "137128", name: "France" },
  { id: "137175", name: "Italy" },
  { id: "137124", name: "Argentina" },
];

const TOGGLE = [
  { key: "South Africa", label: "🇿🇦 South Africa" },
  { key: "Australia", label: "🇦🇺 Australia" },
  { key: "New Zealand", label: "🇳🇿 New Zealand" },
];

export default async function RugbyInternationalsPage() {
  const { failed, matches, fixtures, updatedLabel, hasLive } = await getTeamFixtures({
    teamIds: TIER1.map((t) => t.id),
    teamSuffix: " Rugby",
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh intervalMs={hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://flagcdn.com/w640/za.png"
              alt="Flag of South Africa"
              className="h-16 w-auto rounded-md shadow-lg ring-1 ring-white/10 sm:h-20"
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
            International Rugby 2026 · Tier 1 🏉
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Tests &amp; championships</h1>
          <p className="mt-2 text-sm text-slate-400">
            Six Nations · The Rugby Championship · test windows · all times {ZONE_LABEL} · updated {updatedLabel} ·{" "}
            {hasLive ? (
              <span className="font-medium text-rose-300">live — refreshing every minute</span>
            ) : (
              "refreshes automatically"
            )}
          </p>
        </header>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the rugby feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : (
          <FixturesBoard matches={matches} teams={TOGGLE} />
        )}
      </div>
      <Footer />
    </main>
  );
}
