"use client";

import { useEffect, useMemo, useState } from "react";
import type { GroupTable } from "../Board";
import type { Fixture } from "../Countdown";
import type { SportDay, TvGame } from "../lib/todaysGames";

const SLIDE_MS = 12_000;
const GROUPS_PER_SLIDE = 6;
const pad = (n: number) => String(n).padStart(2, "0");

function BigMatchRow({ g }: { g: TvGame }) {
  const hasScore = g.homeScore != null && g.awayScore != null;
  const live = g.phase === "live";
  return (
    <div
      className={`flex items-center gap-6 rounded-2xl border px-6 py-4 ${
        live ? "border-rose-500/50 bg-rose-500/10" : "border-slate-800 bg-slate-900"
      }`}
    >
      <span className="flex-1 truncate text-right text-3xl font-semibold text-white">{g.home}</span>
      <div className="flex w-48 shrink-0 flex-col items-center">
        <span className="text-4xl font-bold tabular-nums text-white">
          {hasScore ? (
            <>
              {g.homeScore}
              <span className="px-2 text-slate-500">–</span>
              {g.awayScore}
            </>
          ) : (
            <span className="text-2xl text-slate-500">vs</span>
          )}
        </span>
        <span
          className={`mt-1 text-center text-sm font-bold uppercase tracking-widest ${
            live ? "animate-pulse text-rose-400" : g.phase === "final" ? "text-slate-400" : "text-sky-300"
          }`}
        >
          {g.statusLabel}
        </span>
      </div>
      <span className="flex-1 truncate text-3xl font-semibold text-white">{g.away}</span>
    </div>
  );
}

type Slide =
  | { kind: "sport"; sport: SportDay }
  | { kind: "standings"; groups: GroupTable[] }
  | { kind: "countdown" };

export default function TvClient({
  sports,
  standings,
  fixtures,
  updatedLabel,
}: {
  sports: SportDay[];
  standings: GroupTable[];
  fixtures: Fixture[];
  updatedLabel: string;
}) {
  const [slide, setSlide] = useState(0);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const standingSlides = useMemo(() => {
    const out: GroupTable[][] = [];
    for (let i = 0; i < standings.length; i += GROUPS_PER_SLIDE) out.push(standings.slice(i, i + GROUPS_PER_SLIDE));
    return out;
  }, [standings]);

  const slides: Slide[] = useMemo(
    () => [
      ...sports.map((s) => ({ kind: "sport", sport: s }) as Slide),
      ...standingSlides.map((g) => ({ kind: "standings", groups: g }) as Slide),
      { kind: "countdown" } as Slide,
    ],
    [sports, standingSlides],
  );

  const slideLabels = slides.map((s) =>
    s.kind === "sport" ? s.sport.sport : s.kind === "standings" ? "Standings" : "Next Game",
  );

  const next = useMemo(() => {
    if (now == null) return null;
    return (
      fixtures
        .map((f) => ({ ...f, t: new Date(f.iso).getTime() }))
        .filter((f) => !isNaN(f.t) && f.t > now)
        .sort((a, b) => a.t - b.t)[0] ?? null
    );
  }, [fixtures, now]);

  const slideCount = slides.length;
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slideCount), SLIDE_MS);
    return () => clearInterval(id);
  }, [slideCount, slide]);

  const cur = slides[Math.min(slide, slideCount - 1)];

  let d = 0,
    h = 0,
    m = 0,
    s = 0;
  if (now != null && next) {
    let diff = Math.max(0, Math.floor((next.t - now) / 1000));
    d = Math.floor(diff / 86400);
    diff -= d * 86400;
    h = Math.floor(diff / 3600);
    diff -= h * 3600;
    m = Math.floor(diff / 60);
    s = diff - m * 60;
  }

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 px-10 py-8 text-slate-100">
      {/* header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/morts-logo.png" alt="Morts Bar" className="h-16 w-16 rounded-full shadow-lg ring-1 ring-white/10 sm:h-20 sm:w-20" />
          <span
            className="text-4xl text-amber-300"
            style={{ fontFamily: "var(--font-display)", textShadow: "0 0 8px rgba(251,191,36,0.55), 0 0 22px rgba(251,191,36,0.35)" }}
          >
            Morts Bar on Old Graham
          </span>
        </div>
        <div className="text-right text-slate-400">
          <div className="text-lg font-semibold text-white">{todayLabel}</div>
          <div className="text-sm">updated {updatedLabel}</div>
        </div>
      </div>

      {/* slide body */}
      <div className="flex-1">
        {cur?.kind === "sport" && (
          <div>
            <h2 className="mb-5 text-2xl font-bold uppercase tracking-widest text-slate-400">
              {cur.sport.emoji} {cur.sport.sport} — Today
            </h2>
            <div className="space-y-4">
              {cur.sport.games.slice(0, 7).map((g) => (
                <BigMatchRow key={g.id} g={g} />
              ))}
            </div>
          </div>
        )}

        {cur?.kind === "standings" && (
          <div>
            <h2 className="mb-5 text-2xl font-bold uppercase tracking-widest text-slate-400">⚽ World Cup Standings</h2>
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {cur.groups.map((t) => (
                <div key={t.group} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  <h3 className="border-b border-slate-800 bg-slate-800/40 px-4 py-2 text-lg font-bold text-violet-300">{t.group}</h3>
                  <table className="w-full text-lg">
                    <tbody>
                      {t.rows.map((r, i) => (
                        <tr key={r.team} className={`border-t border-slate-800/60 ${i < 2 ? "bg-emerald-500/[0.07]" : ""}`}>
                          <td className="truncate py-1.5 pl-4 font-medium text-white">{r.team}</td>
                          <td className="px-2 text-center tabular-nums text-slate-400">{r.played}</td>
                          <td className="px-2 text-center tabular-nums text-slate-400">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                          <td className="py-1.5 pr-4 text-right text-xl font-bold tabular-nums text-white">{r.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {cur?.kind === "countdown" && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold uppercase tracking-[0.3em] text-slate-400">Next game</div>
            {next ? (
              <>
                <div className="mt-6 font-mono text-[7rem] font-bold leading-none tabular-nums text-white">
                  {d > 0 && (
                    <span>
                      {d}
                      <span className="px-2 text-5xl text-slate-400">d</span>
                    </span>
                  )}
                  {pad(h)}:{pad(m)}:{pad(s)}
                </div>
                <div className="mt-6 text-4xl font-semibold text-amber-300">
                  {next.home} <span className="text-slate-500">v</span> {next.away}
                </div>
              </>
            ) : (
              <div className="mt-6 text-4xl text-slate-400">No upcoming games</div>
            )}
          </div>
        )}

        {sports.length === 0 && cur?.kind !== "countdown" && cur?.kind !== "standings" && (
          <div className="flex h-full items-center justify-center text-3xl text-slate-500">No games today</div>
        )}
      </div>

      {/* slide picker */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {slideLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-current={i === slide ? "true" : undefined}
            className={`rounded-full px-5 py-2.5 text-base font-semibold transition-colors ${
              i === slide ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
