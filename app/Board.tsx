"use client";

import { useMemo, useState } from "react";

export type Phase = "upcoming" | "live" | "final" | "postponed";

export type Match = {
  id: string;
  home: string;
  away: string;
  homeBadge: string | null;
  awayBadge: string | null;
  homeScore: string | null;
  awayScore: string | null;
  phase: Phase;
  statusLabel: string;
  groupLabel: string; // e.g. "Group D" or "" when unknown
  etDateKey: string; // yyyy-mm-dd in Eastern, for grouping/filtering
  dateHeading: string; // e.g. "Friday, June 12"
};

function todayKeyET(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function TeamBadge({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return <div className="h-10 w-10 shrink-0 rounded-full bg-slate-700" aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />;
}

function StatusPill({ phase, label }: { phase: Phase; label: string }) {
  const styles: Record<Phase, string> = {
    live: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40",
    final: "bg-slate-700/60 text-slate-300",
    upcoming: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30",
    postponed: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[phase]}`}>
      {phase === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />}
      {label}
    </span>
  );
}

function MatchRow({ m }: { m: Match }) {
  const hasScore = m.homeScore != null && m.awayScore != null;
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
        <span className="truncate font-medium text-white">{m.home}</span>
        <TeamBadge src={m.homeBadge} alt={m.home} />
      </div>

      <div className="flex w-28 shrink-0 flex-col items-center gap-1.5">
        {m.groupLabel && (
          <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-violet-300 ring-1 ring-violet-500/30">
            {m.groupLabel}
          </span>
        )}
        <div className="text-xl font-semibold tabular-nums text-white">
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
        <StatusPill phase={m.phase} label={m.statusLabel} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <TeamBadge src={m.awayBadge} alt={m.away} />
        <span className="truncate font-medium text-white">{m.away}</span>
      </div>
    </div>
  );
}

export type TeamOption = { key: string; label: string };

const DEFAULT_TEAMS: TeamOption[] = [
  { key: "South Africa", label: "🇿🇦 South Africa" },
  { key: "Australia", label: "🇦🇺 Australia" },
];

export default function Board({ matches, teams = DEFAULT_TEAMS }: { matches: Match[]; teams?: TeamOption[] }) {
  const teamOptions: TeamOption[] = [{ key: "all", label: "All teams" }, ...teams];
  const today = todayKeyET();
  const hasToday = useMemo(() => matches.some((m) => m.etDateKey === today), [matches, today]);
  const [filter, setFilter] = useState<"today" | "all">(hasToday ? "today" : "all");
  const [team, setTeam] = useState<string>("all");

  const visible = matches.filter(
    (m) =>
      (filter === "all" || m.etDateKey === today) &&
      (team === "all" || m.home === team || m.away === team),
  );

  // Selecting a specific team shows all of that team's games (not just today's).
  function pickTeam(t: string) {
    setTeam(t);
    if (t !== "all") setFilter("all");
  }

  // Group the visible matches by Eastern day, preserving chronological order.
  const groups: { key: string; heading: string; matches: Match[] }[] = [];
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
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-slate-700 p-0.5">
          {(["today", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {f === "today" ? "Today" : "Full schedule"}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-slate-700 p-0.5">
          {teamOptions.map((t) => (
            <button
              key={t.key}
              onClick={() => pickTeam(t.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                team === t.key ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
          No {team !== "all" ? `${team} ` : ""}matches {filter === "today" ? "today" : "scheduled"}.{" "}
          <button
            onClick={() => {
              setFilter("all");
              setTeam("all");
            }}
            className="font-medium text-sky-400 hover:text-sky-300"
          >
            Show everything →
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {g.heading}
              </h2>
              <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {g.matches.map((m) => (
                  <MatchRow key={m.id} m={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
