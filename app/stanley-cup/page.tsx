import type { Metadata } from "next";
import Countdown from "../Countdown";
import Footer from "../Footer";

export const metadata: Metadata = {
  title: "Stanley Cup Final 2026 — Go Canes!",
  description: "Carolina Hurricanes vs Vegas Golden Knights — 2026 Stanley Cup Final schedule, scores & series.",
};

// 2026 Stanley Cup Final (source: Sportsnet). Hand-pinned so the page is
// complete and reliable regardless of the live feed. Update G6/G7 once played.
type Game = {
  game: number;
  iso?: string; // kickoff for unplayed games
  dateLabel: string;
  home: "Carolina" | "Vegas";
  away: "Carolina" | "Vegas";
  hs?: number;
  as?: number;
  ot?: string; // "OT" / "2OT"
  ifNec?: boolean;
};

const SERIES: Game[] = [
  { game: 1, dateLabel: "Tue, Jun 2", home: "Carolina", away: "Vegas", hs: 4, as: 5 },
  { game: 2, dateLabel: "Jun 4", home: "Carolina", away: "Vegas", hs: 4, as: 3, ot: "OT" },
  { game: 3, dateLabel: "Jun 7", home: "Vegas", away: "Carolina", hs: 5, as: 4, ot: "2OT" },
  { game: 4, dateLabel: "Jun 9", home: "Vegas", away: "Carolina", hs: 3, as: 5 },
  { game: 5, dateLabel: "Fri, Jun 12", home: "Carolina", away: "Vegas", hs: 4, as: 2 },
  { game: 6, dateLabel: "Sun, Jun 14 · 8:00 PM EST", iso: "2026-06-14T20:00:00-04:00", home: "Vegas", away: "Carolina" },
  { game: 7, dateLabel: "Wed, Jun 17 · 8:00 PM EST", iso: "2026-06-17T20:00:00-04:00", home: "Carolina", away: "Vegas", ifNec: true },
];

const TEAMS = {
  Carolina: { name: "Carolina Hurricanes", short: "Hurricanes", emoji: "🌀", accent: "text-red-300" },
  Vegas: { name: "Vegas Golden Knights", short: "Golden Knights", emoji: "⚔️", accent: "text-yellow-300" },
} as const;

function winnerOf(g: Game): "Carolina" | "Vegas" | null {
  if (g.hs == null || g.as == null) return null;
  return g.hs > g.as ? g.home : g.away;
}

export default function StanleyCupPage() {
  const caroWins = SERIES.filter((g) => winnerOf(g) === "Carolina").length;
  const vegasWins = SERIES.filter((g) => winnerOf(g) === "Vegas").length;
  const champion = caroWins === 4 ? "Carolina" : vegasWins === 4 ? "Vegas" : null;
  const leader = caroWins > vegasWins ? "Carolina" : vegasWins > caroWins ? "Vegas" : null;

  const nextGame = SERIES.find((g) => g.iso && winnerOf(g) === null && !champion);
  const fixtures = nextGame
    ? [{ iso: nextGame.iso!, home: TEAMS[nextGame.home].short, away: TEAMS[nextGame.away].short }]
    : [];

  const seriesLine = champion
    ? `${TEAMS[champion].name} win the Stanley Cup! 🏆`
    : leader
      ? `${TEAMS[leader].short} lead the series${Math.max(caroWins, vegasWins) === 3 ? " — one win from the Cup" : ""}`
      : "Series all square";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
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
          {fixtures.length > 0 && <Countdown fixtures={fixtures} />}
        </div>

        {/* Hurricanes-supporting hero + series score */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-red-600/40 bg-gradient-to-br from-red-600/25 via-red-600/10 to-slate-900 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-300">🏒 Stanley Cup Final 2026</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Go Canes! <span className="text-red-400">🌀</span>
          </h1>

          <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-right">
              <div className="text-lg font-semibold text-white sm:text-xl">Hurricanes</div>
              <div className={`text-5xl font-extrabold tabular-nums ${caroWins >= vegasWins ? "text-red-400" : "text-slate-500"}`}>
                {caroWins}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-500">–</div>
            <div className="text-left">
              <div className="text-lg font-semibold text-white sm:text-xl">Golden Knights</div>
              <div className={`text-5xl font-extrabold tabular-nums ${vegasWins > caroWins ? "text-yellow-400" : "text-slate-500"}`}>
                {vegasWins}
              </div>
            </div>
          </div>
          <p className="mt-4 font-medium text-amber-200">{seriesLine}</p>
        </section>

        {/* game-by-game */}
        <div className="space-y-3">
          {SERIES.map((g) => {
            const w = winnerOf(g);
            const played = w !== null;
            const skip = g.ifNec && (champion !== null || (!played && Math.max(caroWins, vegasWins) === 4));
            return (
              <div
                key={g.game}
                className={`rounded-2xl border p-4 ${played ? "border-slate-800 bg-slate-900" : "border-red-500/20 bg-slate-900"} ${skip ? "opacity-50" : ""}`}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wide text-violet-300">
                    Game {g.game}
                    {g.ifNec && <span className="ml-2 text-slate-500">if necessary</span>}
                  </span>
                  <span className="text-slate-400">{g.dateLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  {([g.home, g.away] as const).map((side, i) => {
                    const t = TEAMS[side];
                    const score = side === g.home ? g.hs : g.as;
                    const isWinner = w === side;
                    return (
                      <div key={side} className={`flex flex-1 items-center gap-2 ${i === 1 ? "justify-end text-right" : ""}`}>
                        {i === 1 && played && (
                          <span className={`text-xl font-bold tabular-nums ${isWinner ? "text-white" : "text-slate-500"}`}>{score}</span>
                        )}
                        <span className={`truncate font-medium ${isWinner ? "text-white" : played ? "text-slate-400" : "text-white"}`}>
                          {t.emoji} {t.short}
                        </span>
                        {i === 0 && played && (
                          <span className={`text-xl font-bold tabular-nums ${isWinner ? "text-white" : "text-slate-500"}`}>{score}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  {played ? `Final${g.ot ? ` · ${g.ot}` : ""}` : skip ? "Not needed if the series ends earlier" : "Upcoming"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </main>
  );
}
