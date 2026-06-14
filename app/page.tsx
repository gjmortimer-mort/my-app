import type { Metadata } from "next";
import Link from "next/link";
import Footer from "./Footer";
import LiveStrip, { type StripGame } from "./LiveStrip";
import { getMultiSportDay } from "./lib/todaysGames";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Morts Bar on Old Graham",
  description: "Your home for live sport — World Cup soccer & rugby, cricket, NFL, AFL and more.",
};

const TILES = [
  { href: "/soccer", emoji: "⚽", title: "Soccer World Cup", desc: "2026 results, standings & live scores", glow: "from-emerald-500/25", ring: "hover:border-emerald-500/60" },
  { href: "/rugby", emoji: "🏉", title: "Rugby World Cup", desc: "RWC 2027 in Australia", glow: "from-amber-500/25", ring: "hover:border-amber-500/60" },
  { href: "/rugby-internationals", emoji: "🏉", title: "International Rugby", desc: "Springboks, Six Nations & more", glow: "from-lime-500/25", ring: "hover:border-lime-500/60" },
  { href: "/cricket", emoji: "🏏", title: "Cricket", desc: "South Africa, Australia & NZ", glow: "from-sky-500/25", ring: "hover:border-sky-500/60" },
  { href: "/nfl", emoji: "🏈", title: "NFL", desc: "2026 schedule · go Panthers", glow: "from-orange-500/25", ring: "hover:border-orange-500/60" },
  { href: "/afl", emoji: "🏉", title: "AFL", desc: "Aussie rules · go Tigers", glow: "from-yellow-500/25", ring: "hover:border-yellow-500/60" },
  { href: "/stanley-cup", emoji: "🏒", title: "Stanley Cup", desc: "Go Canes! 🌀 NHL Final 2026", glow: "from-red-500/25", ring: "hover:border-red-500/60" },
  { href: "/nba-finals", emoji: "🏀", title: "NBA Finals", desc: "Spurs vs Knicks 2026", glow: "from-orange-500/25", ring: "hover:border-orange-500/60" },
  { href: "/tv", emoji: "📺", title: "TV Mode", desc: "Full-screen scoreboard for the big screen", glow: "from-rose-500/25", ring: "hover:border-rose-500/60" },
  { href: "/dashboard", emoji: "🌡️", title: "Temperature Dashboard", desc: "Live weather around the world", glow: "from-cyan-500/25", ring: "hover:border-cyan-500/60" },
  { href: "/socials", emoji: "📸", title: "Socials", desc: "Follow @morts.bar", glow: "from-fuchsia-500/25", ring: "hover:border-fuchsia-500/60" },
];

export default async function Home() {
  const day = await getMultiSportDay();
  const live: StripGame[] = day.sports.flatMap((s) =>
    s.games
      .filter((g) => g.phase === "live")
      .map((g) => ({ id: g.id, sport: s.sport, emoji: s.emoji, home: g.home, away: g.away, homeScore: g.homeScore, awayScore: g.awayScore })),
  );
  const nowMs = Date.now();
  const next =
    day.fixtures
      .map((f) => ({ ...f, t: new Date(f.iso).getTime() }))
      .filter((f) => !isNaN(f.t) && f.t > nowMs)
      .sort((a, b) => a.t - b.t)[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* hero — compact banner */}
      <div className="border-b border-slate-800">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/morts-logo.png"
            alt="Morts Bar"
            className="h-14 w-14 shrink-0 rounded-full shadow-lg ring-1 ring-white/10 sm:h-16 sm:w-16"
          />
          <div className="min-w-0">
            <h1
              className="text-3xl leading-tight text-amber-300 sm:text-4xl"
              style={{
                fontFamily: "var(--font-display)",
                textShadow: "0 0 10px rgba(251,191,36,0.5), 0 0 24px rgba(251,191,36,0.3)",
              }}
            >
              Morts Bar <span className="text-amber-200/80">on Old Graham</span>
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">Your home for live sport — pick your game below. ⚽ 🏉 🏏 🏈</p>
          </div>
        </div>
      </div>

      <LiveStrip live={live} next={next ? { home: next.home, away: next.away, iso: next.iso } : null} />

      {/* tiles */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-colors ${t.ring}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.glow} to-transparent opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="text-4xl">{t.emoji}</div>
                <h2 className="mt-3 text-lg font-semibold text-white">{t.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{t.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-300">
                  Open
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
