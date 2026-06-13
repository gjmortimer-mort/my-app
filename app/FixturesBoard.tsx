"use client";

import { useState } from "react";

// A match from a national-team feed (cricket, international rugby, etc.):
// carries a competition name and an optional result line, unlike the
// group-stage Match used by Board.
export type TeamMatch = {
  id: string;
  home: string;
  away: string;
  homeBadge: string | null;
  awayBadge: string | null;
  homeScore: string | null;
  awayScore: string | null;
  phase: "upcoming" | "live" | "final";
  statusLabel: string;
  result: string; // e.g. "South Africa won by 6 wickets" (cricket) — may be empty
  competition: string; // strLeague
  etDateKey: string;
  dateHeading: string;
};

export type TeamOption = { key: string; label: string };

function Badge({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="h-8 w-8 shrink-0 rounded-full bg-slate-700" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />;
}

function MatchCard({ m }: { m: TeamMatch }) {
  const hasScore = m.homeScore != null && m.awayScore != null;
  const pill =
    m.phase === "live"
      ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40"
      : m.phase === "final"
        ? "bg-slate-700/60 text-slate-300"
        : "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        {m.competition && (
          <span className="truncate rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-violet-300 ring-1 ring-violet-500/30">
            {m.competition}
          </span>
        )}
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pill}`}>
          {m.phase === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />}
          {m.statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Badge src={m.homeBadge} alt={m.home} />
          <span className="truncate font-medium text-white">{m.home}</span>
        </div>
        <div className="shrink-0 text-lg font-semibold tabular-nums text-white">
          {hasScore ? (
            <span>
              {m.homeScore}
              <span className="px-1.5 text-slate-500">–</span>
              {m.awayScore}
            </span>
          ) : (
            <span className="text-slate-500">vs</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
          <span className="truncate font-medium text-white">{m.away}</span>
          <Badge src={m.awayBadge} alt={m.away} />
        </div>
      </div>

      {m.result && <p className="mt-3 text-center text-sm text-emerald-300/90">{m.result}</p>}
    </div>
  );
}

export default function FixturesBoard({ matches, teams }: { matches: TeamMatch[]; teams: TeamOption[] }) {
  const [team, setTeam] = useState<string>("all");
  const options: TeamOption[] = [{ key: "all", label: "All teams" }, ...teams];

  const visible = matches.filter((m) => team === "all" || m.home === team || m.away === team);

  const groups: { key: string; heading: string; matches: TeamMatch[] }[] = [];
  for (const m of visible) {
    let g = groups.find((x) => x.key === m.etDateKey);
    if (!g) {
      g = { key: m.etDateKey, heading: m.dateHeading, matches: [] };
      groups.push(g);
    }
    g.matches.push(m);
  }

  return (
    <div>
      <div className="mb-6 inline-flex flex-wrap rounded-lg border border-slate-700 p-0.5">
        {options.map((t) => (
          <button
            key={t.key}
            onClick={() => setTeam(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              team === t.key ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
          No {team !== "all" ? `${team} ` : ""}matches to show yet. Recent results and new fixtures appear here as the
          feed publishes them.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{g.heading}</h2>
              <div className="space-y-3">
                {g.matches.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
