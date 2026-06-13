"use client";

import { useEffect, useMemo, useState } from "react";
import type { GroupTable, Match } from "../Board";
import type { Fixture } from "../Countdown";

const SLIDE_MS = 12_000;
const GROUPS_PER_SLIDE = 6;

const pad = (n: number) => String(n).padStart(2, "0");

function Badge({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="inline-block h-12 w-12 rounded-full bg-slate-700" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />;
}

function BigMatchRow({ m }: { m: Match }) {
  const hasScore = m.homeScore != null && m.awayScore != null;
  const live = m.phase === "live";
  return (
    <div
      className={`flex items-center gap-6 rounded-2xl border px-6 py-4 ${
        live ? "border-rose-500/50 bg-rose-500/10" : "border-slate-800 bg-slate-900"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center justify-end gap-4 text-right">
        <span className="truncate text-3xl font-semibold text-white">{m.home}</span>
        <Badge src={m.homeBadge} alt={m.home} />
      </div>
      <div className="flex w-44 shrink-0 flex-col items-center">
        <span className="text-4xl font-bold tabular-nums text-white">
          {hasScore ? (
            <>
              {m.homeScore}
              <span className="px-2 text-slate-500">–</span>
              {m.awayScore}
            </>
          ) : (
            <span className="text-2xl text-slate-500">vs</span>
          )}
        </span>
        <span
          className={`mt-1 text-sm font-bold uppercase tracking-widest ${
            live ? "animate-pulse text-rose-400" : m.phase === "final" ? "text-slate-400" : "text-sky-300"
          }`}
        >
          {m.statusLabel}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Badge src={m.awayBadge} alt={m.away} />
        <span className="truncate text-3xl font-semibold text-white">{m.away}</span>
      </div>
    </div>
  );
}

export default function TvClient({
  matches,
  standings,
  fixtures,
  updatedLabel,
}: {
  matches: Match[];
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

  // Today's (or next upcoming day's) matches in Eastern time.
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const todays = useMemo(() => {
    const t = matches.filter((m) => m.etDateKey === todayKey);
    if (t.length) return { heading: "Today's matches", list: t.slice(0, 6) };
    const upcoming = matches.find((m) => m.phase === "upcoming");
    if (!upcoming) return { heading: "Matches", list: matches.slice(-6) };
    const list = matches.filter((m) => m.etDateKey === upcoming.etDateKey);
    return { heading: upcoming.dateHeading, list: list.slice(0, 6) };
  }, [matches, todayKey]);

  const standingSlides = useMemo(() => {
    const out: GroupTable[][] = [];
    for (let i = 0; i < standings.length; i += GROUPS_PER_SLIDE) out.push(standings.slice(i, i + GROUPS_PER_SLIDE));
    return out;
  }, [standings]);

  const next = useMemo(() => {
    if (now == null) return null;
    return (
      fixtures
        .map((f) => ({ ...f, t: new Date(f.iso).getTime() }))
        .filter((f) => !isNaN(f.t) && f.t > now)
        .sort((a, b) => a.t - b.t)[0] ?? null
    );
  }, [fixtures, now]);

  const slideCount = 1 + standingSlides.length + 1;

  // Auto-advance; the timer restarts whenever the slide changes (incl. manual
  // picks below), so a tap always buys a full interval on that slide.
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slideCount), SLIDE_MS);
    return () => clearInterval(id);
  }, [slideCount, slide]);

  const slideLabels = [
    "Matches",
    ...standingSlides.map((_, i) => (standingSlides.length > 1 ? `Standings ${i + 1}` : "Standings")),
    "Countdown",
  ];

  let h = 0,
    m = 0,
    s = 0;
  if (now != null && next) {
    let diff = Math.max(0, Math.floor((next.t - now) / 1000));
    h = Math.floor(diff / 3600);
    diff -= h * 3600;
    m = Math.floor(diff / 60);
    s = diff - m * 60;
  }

  const isMatches = slide === 0;
  const isCountdown = slide === slideCount - 1;
  const standingsIdx = slide - 1;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 px-10 py-8 text-slate-100">
      {/* header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/morts-logo.png"
            alt="Morts Bar"
            className="h-16 w-16 rounded-full shadow-lg ring-1 ring-white/10 sm:h-20 sm:w-20"
          />
          <span
            className="text-4xl text-amber-300"
            style={{
              fontFamily: "var(--font-display)",
              textShadow: "0 0 8px rgba(251,191,36,0.55), 0 0 22px rgba(251,191,36,0.35)",
            }}
          >
            Morts Bar on Old Graham
          </span>
        </div>
        <div className="text-right text-slate-400">
          <div className="text-lg font-semibold text-white">FIFA World Cup 2026</div>
          <div className="text-sm">updated {updatedLabel}</div>
        </div>
      </div>

      {/* slide body */}
      <div className="flex-1">
        {isMatches && (
          <div>
            <h2 className="mb-5 text-2xl font-bold uppercase tracking-widest text-slate-400">{todays.heading}</h2>
            <div className="space-y-4">
              {todays.list.map((mt) => (
                <BigMatchRow key={mt.id} m={mt} />
              ))}
            </div>
          </div>
        )}

        {!isMatches && !isCountdown && standingSlides[standingsIdx] && (
          <div>
            <h2 className="mb-5 text-2xl font-bold uppercase tracking-widest text-slate-400">Standings</h2>
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {standingSlides[standingsIdx].map((t) => (
                <div key={t.group} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  <h3 className="border-b border-slate-800 bg-slate-800/40 px-4 py-2 text-lg font-bold text-violet-300">
                    {t.group}
                  </h3>
                  <table className="w-full text-lg">
                    <tbody>
                      {t.rows.map((r, i) => (
                        <tr key={r.team} className={`border-t border-slate-800/60 ${i < 2 ? "bg-emerald-500/[0.07]" : ""}`}>
                          <td className="truncate py-1.5 pl-4 font-medium text-white">{r.team}</td>
                          <td className="px-2 text-center tabular-nums text-slate-400">{r.played}</td>
                          <td className="px-2 text-center tabular-nums text-slate-400">
                            {r.diff > 0 ? `+${r.diff}` : r.diff}
                          </td>
                          <td className="py-1.5 pr-4 text-right text-xl font-bold tabular-nums text-white">
                            {r.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCountdown && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold uppercase tracking-[0.3em] text-slate-400">Next kickoff</div>
            {next ? (
              <>
                <div className="mt-6 font-mono text-[9rem] font-bold leading-none tabular-nums text-white">
                  {pad(h)}:{pad(m)}:{pad(s)}
                </div>
                <div className="mt-6 text-4xl font-semibold text-amber-300">
                  {next.home} <span className="text-slate-500">v</span> {next.away}
                </div>
              </>
            ) : (
              <div className="mt-6 text-4xl text-slate-400">No upcoming matches</div>
            )}
          </div>
        )}
      </div>

      {/* slide picker */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {slideLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-current={i === slide ? "true" : undefined}
            className={`rounded-full px-6 py-3 text-lg font-semibold transition-colors ${
              i === slide
                ? "bg-sky-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
