import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import Footer from "../Footer";
import FixturesBoard, { type TeamMatch } from "../FixturesBoard";
import { getU20Data, ZONE_LABEL } from "../lib/u20Data";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "U20 World Cup 2026 — Junior Boks",
  description: "World Rugby U20 Championship 2026 fixtures, pools and results — backing the Junior Boks.",
};

const TOGGLE = [
  { key: "South Africa", label: "🇿🇦 South Africa" },
  { key: "Australia", label: "🇦🇺 Australia" },
  { key: "New Zealand", label: "🇳🇿 New Zealand" },
];

export default async function RugbyU20Page() {
  const { failed, matches, updatedLabel, hasLive } = await getU20Data();

  const board: TeamMatch[] = matches.map((m) => ({
    id: m.id,
    home: m.home,
    away: m.away,
    homeBadge: null,
    awayBadge: null,
    homeScore: m.homeScore != null ? String(m.homeScore) : null,
    awayScore: m.awayScore != null ? String(m.awayScore) : null,
    phase: m.phase,
    statusLabel: m.phase === "upcoming" ? m.timeLabel : m.phase === "live" ? "Live" : "Final",
    result: "",
    competition: m.pool,
    etDateKey: m.etDateKey,
    dateHeading: m.dateHeading,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh intervalMs={hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
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
          <p className="mt-2 text-sm text-slate-400">
            Backing the Junior Boks 🇿🇦 · all times {ZONE_LABEL} · updated {updatedLabel} ·{" "}
            {hasLive ? <span className="font-medium text-rose-300">live — refreshing every minute</span> : "kicks off June 27"}
          </p>
        </header>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the U20 feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : (
          <FixturesBoard matches={board} teams={TOGGLE} />
        )}
      </div>
      <Footer />
    </main>
  );
}
