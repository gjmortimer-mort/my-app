import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import Countdown from "../Countdown";
import Footer from "../Footer";
import FixturesBoard from "../FixturesBoard";
import { getTeamFixtures, ZONE_LABEL } from "../lib/teamFixtures";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stanley Cup Final 2026 — Go Canes!",
  description: "Carolina Hurricanes in the 2026 Stanley Cup Final — live scores and next game.",
};

const HURRICANES = "134838";

export default async function StanleyCupPage() {
  const { failed, matches, fixtures, updatedLabel, hasLive } = await getTeamFixtures({
    teamIds: [HURRICANES],
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

        {/* Hurricanes-supporting hero */}
        <section className="mb-10 overflow-hidden rounded-3xl border border-red-600/40 bg-gradient-to-br from-red-600/25 via-red-600/10 to-slate-900 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-300">🏒 Stanley Cup Final 2026</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Go Canes! <span className="text-red-400">🌀</span>
          </h1>
          <p className="mt-3 text-slate-300">
            All the way behind the Carolina Hurricanes for the Cup. Bring the Storm. ⚡
          </p>
          <p className="mt-2 text-xs text-slate-500">
            All times {ZONE_LABEL} · updated {updatedLabel} ·{" "}
            {hasLive ? (
              <span className="font-medium text-red-300">LIVE — refreshing every minute</span>
            ) : (
              "live scores refresh every minute during games"
            )}
          </p>
        </section>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the NHL feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : (
          <FixturesBoard matches={matches} teams={[{ key: "Carolina Hurricanes", label: "🌀 Hurricanes" }]} />
        )}
      </div>
      <Footer />
    </main>
  );
}
