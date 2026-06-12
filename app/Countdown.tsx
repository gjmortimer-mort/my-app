"use client";

import { useEffect, useMemo, useState } from "react";

export type Fixture = { iso: string; home: string; away: string };

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({ fixtures }: { fixtures: Fixture[] }) {
  // null until mounted on the client — avoids a hydration mismatch on the clock.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(
    () =>
      fixtures
        .map((f) => ({ ...f, t: new Date(f.iso).getTime() }))
        .filter((f) => !isNaN(f.t))
        .sort((a, b) => a.t - b.t),
    [fixtures],
  );

  const next = now == null ? null : (sorted.find((f) => f.t > now) ?? null);

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

  return (
    <div className="text-right">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Next kickoff</div>
      {now == null ? (
        <div className="font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl">--:--:--</div>
      ) : next ? (
        <>
          <div className="font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl">
            {d > 0 && <span>{d}<span className="pr-1.5 text-base font-medium text-slate-400">d</span></span>}
            {pad(h)}:{pad(m)}:{pad(s)}
          </div>
          <div className="max-w-[12rem] truncate text-xs text-slate-400">
            {next.home} v {next.away}
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-400">No upcoming matches</div>
      )}
    </div>
  );
}
