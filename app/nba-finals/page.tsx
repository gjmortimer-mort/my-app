import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import Countdown from "../Countdown";
import Footer from "../Footer";
import type { TeamMatch } from "../FixturesBoard";
import { getTeamFixtures, ZONE_LABEL } from "../lib/teamFixtures";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "NBA Finals 2026 — Spurs vs Knicks",
  description: "2026 NBA Finals — San Antonio Spurs vs New York Knicks, live series score and game-by-game.",
};

const SPURS = "134879";
const KNICKS = "134862";
const TEAMS = {
  "San Antonio Spurs": { short: "Spurs", emoji: "🌶️", accent: "text-slate-200" },
  "New York Knicks": { short: "Knicks", emoji: "🗽", accent: "text-orange-300" },
} as const;
type TeamName = keyof typeof TEAMS;
const isFinalist = (n: string): n is TeamName => n in TEAMS;

function winnerOf(m: TeamMatch): TeamName | null {
  if (m.homeScore == null || m.awayScore == null || !isFinalist(m.home) || !isFinalist(m.away)) return null;
  return Number(m.homeScore) > Number(m.awayScore) ? m.home : m.away;
}

export default async function NbaFinalsPage() {
  const { failed, matches, fixtures, updatedLabel, hasLive } = await getTeamFixtures({ teamIds: [SPURS, KNICKS], sport: "Basketball" });

  // Head-to-head games between the two finalists, oldest first.
  const series = matches.filter((m) => isFinalist(m.home) && isFinalist(m.away));
  const seriesFixtures = fixtures.filter((f) => isFinalist(f.home) && isFinalist(f.away));

  const wins = (team: TeamName) => series.filter((m) => winnerOf(m) === team).length;
  const spursW = wins("San Antonio Spurs");
  const knicksW = wins("New York Knicks");
  const champion: TeamName | null = spursW === 4 ? "San Antonio Spurs" : knicksW === 4 ? "New York Knicks" : null;
  const leader: TeamName | null =
    spursW > knicksW ? "San Antonio Spurs" : knicksW > spursW ? "New York Knicks" : null;

  const seriesLine = champion
    ? `${champion} win the 2026 NBA title! 🏆`
    : leader
      ? `${TEAMS[leader].short} lead the series${Math.max(spursW, knicksW) === 3 ? " — one win from the title" : ""}`
      : "Series all square";

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
          {seriesFixtures.length > 0 && <Countdown fixtures={seriesFixtures} />}
        </div>

        {/* series hero */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-orange-500/40 bg-gradient-to-br from-blue-600/20 via-orange-500/10 to-slate-900 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-300">🏀 NBA Finals 2026</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Go Knicks! <span className="text-orange-400">🗽</span>
          </h1>
          <p className="mt-2 text-sm text-slate-300">All in behind the New York Knicks for the title. 🧡💙</p>
          <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-right">
              <div className="text-lg font-semibold text-white sm:text-xl">🌶️ Spurs</div>
              <div className={`text-5xl font-extrabold tabular-nums ${spursW >= knicksW ? "text-white" : "text-slate-500"}`}>
                {spursW}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-500">–</div>
            <div className="text-left">
              <div className="text-lg font-semibold text-white sm:text-xl">🗽 Knicks</div>
              <div className={`text-5xl font-extrabold tabular-nums ${knicksW >= spursW ? "text-orange-400" : "text-slate-500"}`}>
                {knicksW}
              </div>
            </div>
          </div>
          <p className="mt-4 font-medium text-amber-200">{seriesLine}</p>
          <p className="mt-2 text-xs text-slate-500">
            Best of 7 · all times {ZONE_LABEL} · updated {updatedLabel} ·{" "}
            {hasLive ? <span className="font-medium text-orange-300">LIVE — refreshing every minute</span> : "auto-refreshing"}
          </p>
        </section>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the NBA feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : series.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Series games will appear here as they&apos;re scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {series.map((m, i) => {
              const w = winnerOf(m);
              const played = w !== null;
              return (
                <div key={m.id} className={`rounded-2xl border p-4 ${played ? "border-slate-800" : "border-orange-500/20"} bg-slate-900`}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wide text-violet-300">Game {i + 1}</span>
                    <span className="text-slate-400">{m.dateHeading}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {([m.home, m.away] as const).map((side, idx) => {
                      const t = TEAMS[side as TeamName];
                      const score = side === m.home ? m.homeScore : m.awayScore;
                      const isWinner = w === side;
                      return (
                        <div key={side} className={`flex flex-1 items-center gap-2 ${idx === 1 ? "justify-end text-right" : ""}`}>
                          {idx === 1 && played && (
                            <span className={`text-xl font-bold tabular-nums ${isWinner ? "text-white" : "text-slate-500"}`}>{score}</span>
                          )}
                          <span className={`truncate font-medium ${isWinner ? "text-white" : played ? "text-slate-400" : "text-white"}`}>
                            {t?.emoji} {t?.short ?? side}
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
