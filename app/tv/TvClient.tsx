"use client";

import { useEffect, useMemo, useState } from "react";
import type { Fixture } from "../Countdown";
import type { SportDay, TvGame } from "../lib/todaysGames";

const pad = (n: number) => String(n).padStart(2, "0");

function GameRow({ g }: { g: TvGame }) {
  const hasScore = g.homeScore != null && g.awayScore != null;
  const live = g.phase === "live";
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2 ${live ? "bg-rose-500/15 ring-1 ring-rose-500/40" : "bg-slate-800/40"}`}>
      <span className="flex-1 truncate text-right text-xl font-semibold text-white">{g.home}</span>
      <div className="flex w-24 shrink-0 flex-col items-center leading-none">
        <span className="text-2xl font-bold tabular-nums text-white">
          {hasScore ? (
            <>
              {g.homeScore}
              <span className="px-1 text-slate-500">–</span>
              {g.awayScore}
            </>
          ) : (
            <span className="text-lg text-slate-500">vs</span>
          )}
        </span>
        <span className={`mt-1 text-center text-[11px] font-bold uppercase tracking-wider ${live ? "animate-pulse text-rose-400" : g.phase === "final" ? "text-slate-500" : "text-sky-300"}`}>
          {g.statusLabel}
        </span>
      </div>
      <span className="flex-1 truncate text-xl font-semibold text-white">{g.away}</span>
    </div>
  );
}

export default function TvClient({
  sports,
  fixtures,
  updatedLabel,
}: {
  sports: SportDay[];
  fixtures: Fixture[];
  updatedLabel: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    if (now == null) return null;
    return (
      fixtures
        .map((f) => ({ ...f, t: new Date(f.iso).getTime() }))
        .filter((f) => !isNaN(f.t) && f.t > now)
        .sort((a, b) => a.t - b.t)[0] ?? null
    );
  }, [fixtures, now]);

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

  const cols = Math.min(Math.max(sports.length, 1), 3);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 px-8 py-6 text-slate-100">
      {/* header */}
      <div className="mb-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/morts-logo.png" alt="Morts Bar" className="h-16 w-16 rounded-full shadow-lg ring-1 ring-white/10" />
          <div>
            <div
              className="text-3xl text-amber-300"
              style={{ fontFamily: "var(--font-display)", textShadow: "0 0 8px rgba(251,191,36,0.55), 0 0 22px rgba(251,191,36,0.35)" }}
            >
              Morts Bar
            </div>
            <div className="text-sm font-semibold uppercase tracking-widest text-slate-400">{todayLabel}</div>
          </div>
        </div>

        {/* next-game countdown */}
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Next game</div>
          {next ? (
            <>
              <div className="font-mono text-3xl font-bold tabular-nums text-white">
                {d > 0 && <span className="text-amber-300">{d}d </span>}
                {pad(h)}:{pad(m)}:{pad(s)}
              </div>
              <div className="max-w-xs truncate text-sm text-amber-200">
                {next.home} v {next.away}
              </div>
            </>
          ) : (
            <div className="text-lg text-slate-500">—</div>
          )}
        </div>
      </div>

      {/* sport grid */}
      {sports.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-4xl text-slate-500">No games today — check back soon</div>
      ) : (
        <div className="grid flex-1 gap-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {sports.map((sp) => (
            <section key={sp.sport} className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <h2 className="flex items-center gap-2 border-b border-slate-800 bg-slate-800/40 px-4 py-3 text-xl font-bold text-white">
                <span className="text-2xl">{sp.emoji}</span>
                {sp.sport}
                {sp.games.some((g) => g.phase === "live") && (
                  <span className="ml-auto flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-rose-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> Live
                  </span>
                )}
              </h2>
              <div className="flex flex-col gap-2 p-3">
                {sp.games.slice(0, 8).map((g) => (
                  <GameRow key={g.id} g={g} />
                ))}
                {sp.games.length > 8 && (
                  <div className="px-3 py-1 text-center text-sm text-slate-500">+{sp.games.length - 8} more</div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-xs text-slate-600">Updated {updatedLabel} · refreshes automatically</div>
    </div>
  );
}
