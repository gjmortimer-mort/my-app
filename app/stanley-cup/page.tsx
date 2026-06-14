import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import Countdown from "../Countdown";
import Footer from "../Footer";
import { getTeamFixtures, ZONE_LABEL } from "../lib/teamFixtures";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stanley Cup Final 2026 — Go Canes!",
  description: "Carolina Hurricanes vs Vegas Golden Knights — 2026 Stanley Cup Final, live series score & game-by-game.",
};

const HURRICANES = "134838";
const FINALISTS = new Set(["Carolina Hurricanes", "Vegas Golden Knights"]);
const SHORT: Record<string, { short: string; emoji: string }> = {
  "Carolina Hurricanes": { short: "Hurricanes", emoji: "🌀" },
  "Vegas Golden Knights": { short: "Golden Knights", emoji: "⚔️" },
};

export default async function StanleyCupPage() {
  const { matches, fixtures, updatedLabel, hasLive } = await getTeamFixtures({ teamIds: [HURRICANES] });

  // Head-to-head games = the Final series, chronological.
  const series = matches.filter((m) => FINALISTS.has(m.home) && FINALISTS.has(m.away));
  const seriesFixtures = fixtures.filter((f) => FINALISTS.has(f.home) && FINALISTS.has(f.away));

  const winnerOf = (m: (typeof series)[number]): string | null =>
    m.homeScore == null || m.awayScore == null ? null : Number(m.homeScore) > Number(m.awayScore) ? m.home : m.away;

  const caroWins = series.filter((m) => winnerOf(m) === "Carolina Hurricanes").length;
  const vegasWins = series.filter((m) => winnerOf(m) === "Vegas Golden Knights").length;
  const champion = caroWins === 4 ? "Carolina Hurricanes" : vegasWins === 4 ? "Vegas Golden Knights" : null;
  const leader = caroWins > vegasWins ? "Hurricanes" : vegasWins > caroWins ? "Golden Knights" : null;

  const seriesLine = champion
    ? `${SHORT[champion].short} win the Stanley Cup! 🏆`
    : leader
      ? `${leader} lead the series${Math.max(caroWins, vegasWins) === 3 ? " — one win from the Cup" : ""}`
      : "Series all square";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh intervalMs={hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/morts-logo.png" alt="Morts Bar" className="h-16 w-16 rounded-full shadow-lg ring-1 ring-white/10 sm:h-20 sm:w-20" />
            <span
              className="text-2xl leading-tight text-amber-300 sm:text-4xl"
              style={{ fontFamily: "var(--font-display)", textShadow: "0 0 8px rgba(251,191,36,0.55), 0 0 22px rgba(251,191,36,0.35)" }}
            >
              Morts Bar on Old Graham
            </span>
          </div>
          {seriesFixtures.length > 0 && <Countdown fixtures={seriesFixtures} />}
        </div>

        <section className="mb-8 overflow-hidden rounded-3xl border border-red-600/40 bg-gradient-to-br from-red-600/25 via-red-600/10 to-slate-900 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-300">🏒 Stanley Cup Final 2026</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Go Canes! <span className="text-red-400">🌀</span>
          </h1>
          <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-right">
              <div className="text-lg font-semibold text-white sm:text-xl">Hurricanes</div>
              <div className={`text-5xl font-extrabold tabular-nums ${caroWins >= vegasWins ? "text-red-400" : "text-slate-500"}`}>{caroWins}</div>
            </div>
            <div className="text-2xl font-bold text-slate-500">–</div>
            <div className="text-left">
              <div className="text-lg font-semibold text-white sm:text-xl">Golden Knights</div>
              <div className={`text-5xl font-extrabold tabular-nums ${vegasWins > caroWins ? "text-yellow-400" : "text-slate-500"}`}>{vegasWins}</div>
            </div>
          </div>
          <p className="mt-4 font-medium text-amber-200">{seriesLine}</p>
          <p className="mt-2 text-xs text-slate-500">
            All times {ZONE_LABEL} · updated {updatedLabel} ·{" "}
            {hasLive ? <span className="font-medium text-red-300">LIVE — refreshing every minute</span> : "auto-updating"}
          </p>
        </section>

        {series.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Series games will appear here.</div>
        ) : (
          <div className="space-y-3">
            {series.map((m, i) => {
              const w = winnerOf(m);
              const played = w !== null;
              return (
                <div key={m.id} className={`rounded-2xl border p-4 ${played ? "border-slate-800" : "border-red-500/20"} bg-slate-900`}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wide text-violet-300">Game {i + 1}</span>
                    <span className="text-slate-400">{m.dateHeading}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {([m.home, m.away] as const).map((side, idx) => {
                      const t = SHORT[side] ?? { short: side, emoji: "" };
                      const score = side === m.home ? m.homeScore : m.awayScore;
                      const isWinner = w === side;
                      return (
                        <div key={side} className={`flex flex-1 items-center gap-2 ${idx === 1 ? "justify-end text-right" : ""}`}>
                          {idx === 1 && played && (
                            <span className={`text-xl font-bold tabular-nums ${isWinner ? "text-white" : "text-slate-500"}`}>{score}</span>
                          )}
                          <span className={`truncate font-medium ${isWinner ? "text-white" : played ? "text-slate-400" : "text-white"}`}>
                            {t.emoji} {t.short}
                          </span>
                          {idx === 0 && played && (
                            <span className={`text-xl font-bold tabular-nums ${isWinner ? "text-white" : "text-slate-500"}`}>{score}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-center text-xs text-slate-500">{played ? "Final" : m.statusLabel}</p>
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
