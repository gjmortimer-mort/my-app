"use client";

import { useEffect, useMemo, useState } from "react";

export type StripGame = {
  id: string;
  sport: string;
  emoji: string;
  home: string;
  away: string;
  homeScore: string | null;
  awayScore: string | null;
};
type Fix = { iso: string; home: string; away: string };

const pad = (n: number) => String(n).padStart(2, "0");

export default function LiveStrip({ live, fixtures }: { live: StripGame[]; fixtures: Fix[] }) {
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

  let countdown = "";
  if (now != null && next) {
    let diff = Math.max(0, Math.floor((next.t - now) / 1000));
    const d = Math.floor(diff / 86400);
    diff -= d * 86400;
    const h = Math.floor(diff / 3600);
    diff -= h * 3600;
    const m = Math.floor(diff / 60);
    const s = diff - m * 60;
    countdown = d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  if (live.length === 0 && !next) return null;

  return (
    <div className="border-b border-slate-800 bg-slate-900/40">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-2.5 text-sm">
        {live.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
              Live now
            </span>
            {live.map((g) => (
              <span key={g.id} className="text-slate-200">
                {g.emoji} {g.home} <span className="font-bold tabular-nums text-white">{g.homeScore ?? 0}–{g.awayScore ?? 0}</span> {g.away}
              </span>
            ))}
          </div>
        )}
        {next && (
          <div className="ml-auto flex items-center gap-2 text-slate-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Up next</span>
            <span className="text-slate-200">
              {next.home} <span className="text-slate-500">v</span> {next.away}
            </span>
            <span className="font-mono tabular-nums text-amber-300">{countdown}</span>
          </div>
        )}
      </div>
    </div>
  );
}
