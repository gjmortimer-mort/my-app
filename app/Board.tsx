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

export type TeamOption = { key: string; label: string };

export type StandingRow = {
  team: string;
  badge: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scoreFor: number;
  scoreAgainst: number;
  diff: number;
  points: number;
};

export type GroupTable = { group: string; rows: StandingRow[] };
export type KnockoutRound = { label: string; matches: Match[] };

const DEFAULT_TEAMS: TeamOption[] = [
  { key: "South Africa", label: "🇿🇦 South Africa" },
  { key: "Australia", label: "🇦🇺 Australia" },
];

function todayKeyET(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function TeamBadge({ src, alt, size = 10 }: { src: string | null; alt: string; size?: number }) {
  const cls = size === 10 ? "h-10 w-10" : "h-6 w-6";
  if (!src) {
    return <div className={`${cls} shrink-0 rounded-full bg-slate-700`} aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={size * 4} height={size * 4} className={`${cls} shrink-0 object-contain`} />;
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

// ---- Live banner ---------------------------------------------------------
function LiveBanner({ live }: { live: Match[] }) {
  if (live.length === 0) return null;
  return (
    <div className="mb-6 space-y-2">
      {live.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-rose-500/15 px-5 py-4 shadow-lg shadow-rose-500/10"
        >
          <div className="flex items-center gap-2 text-rose-300">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400" />
            <span className="text-xs font-bold uppercase tracking-widest">{m.statusLabel}</span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-right font-semibold text-white sm:text-lg">{m.home}</span>
            <TeamBadge src={m.homeBadge} alt={m.home} size={6} />
            <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
              {m.homeScore ?? 0}
              <span className="px-1 text-rose-300/60">–</span>
              {m.awayScore ?? 0}
            </span>
            <TeamBadge src={m.awayBadge} alt={m.away} size={6} />
            <span className="truncate font-semibold text-white sm:text-lg">{m.away}</span>
          </div>
          <span className="hidden text-xs font-semibold uppercase tracking-wide text-rose-300/70 sm:block">
            {m.groupLabel}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- Standings ------------------------------------------------------------
function StandingsTables({ standings, pointsNote }: { standings: GroupTable[]; pointsNote?: string }) {
  if (standings.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        Standings will appear once group games have been played.
      </div>
    );
  }
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        {standings.map((t) => (
          <section key={t.group} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <h2 className="border-b border-slate-800 bg-slate-800/40 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-violet-300">
              {t.group}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pl-4 font-medium">Team</th>
                  <th className="px-1.5 text-center font-medium">P</th>
                  <th className="px-1.5 text-center font-medium">W</th>
                  <th className="px-1.5 text-center font-medium">D</th>
                  <th className="px-1.5 text-center font-medium">L</th>
                  <th className="px-1.5 text-center font-medium">+/−</th>
                  <th className="py-2 pr-4 text-center font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, i) => (
                  <tr key={r.team} className={`border-t border-slate-800/60 ${i < 2 ? "bg-emerald-500/[0.06]" : ""}`}>
                    <td className="py-2 pl-4">
                      <span className="flex items-center gap-2">
                        <span className={`w-4 text-xs tabular-nums ${i < 2 ? "text-emerald-400" : "text-slate-600"}`}>
                          {i + 1}
                        </span>
                        <TeamBadge src={r.badge} alt={r.team} size={6} />
                        <span className="truncate font-medium text-white">{r.team}</span>
                      </span>
                    </td>
                    <td className="px-1.5 text-center tabular-nums text-slate-300">{r.played}</td>
                    <td className="px-1.5 text-center tabular-nums text-slate-300">{r.won}</td>
                    <td className="px-1.5 text-center tabular-nums text-slate-300">{r.drawn}</td>
                    <td className="px-1.5 text-center tabular-nums text-slate-300">{r.lost}</td>
                    <td className="px-1.5 text-center tabular-nums text-slate-300">
                      {r.diff > 0 ? `+${r.diff}` : r.diff}
                    </td>
                    <td className="py-2 pr-4 text-center font-bold tabular-nums text-white">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Top two in each group highlighted.{pointsNote ? ` ${pointsNote}` : ""}
      </p>
    </div>
  );
}

// ---- Knockouts ------------------------------------------------------------
function KnockoutView({ knockouts }: { knockouts: KnockoutRound[] }) {
  if (knockouts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        The knockout bracket will appear here once the group stage sets the matchups.
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {knockouts.map((round) => (
        <section key={round.label}>
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-amber-300">{round.label}</h2>
          <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-900">
            {round.matches.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---- The board -------------------------------------------------------------
type View = "today" | "all" | "standings" | "knockouts";

export default function Board({
  matches,
  teams = DEFAULT_TEAMS,
  standings = [],
  knockouts = [],
  pointsNote,
}: {
  matches: Match[];
  teams?: TeamOption[];
  standings?: GroupTable[];
  knockouts?: KnockoutRound[];
  pointsNote?: string;
}) {
  const teamOptions: TeamOption[] = [{ key: "all", label: "All teams" }, ...teams];
  const today = todayKeyET();
  const hasToday = useMemo(() => matches.some((m) => m.etDateKey === today), [matches, today]);
  const [view, setView] = useState<View>(hasToday ? "today" : "all");
  const [team, setTeam] = useState<string>("all");

  const live = matches.filter((m) => m.phase === "live");

  const visible = matches.filter(
    (m) =>
      (view !== "today" || m.etDateKey === today) &&
      (team === "all" || m.home === team || m.away === team),
  );

  // Selecting a specific team shows all of that team's games (not just today's).
  function pickTeam(t: string) {
    setTeam(t);
    if (t !== "all" && view === "today") setView("all");
  }

  const groups: { key: string; heading: string; matches: Match[] }[] = [];
  for (const m of visible) {
    let g = groups.find((x) => x.key === m.etDateKey);
    if (!g) {
      g = { key: m.etDateKey, heading: m.dateHeading, matches: [] };
      groups.push(g);
    }
    g.matches.push(m);
  }

  const VIEWS: { key: View; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "all", label: "Full schedule" },
    { key: "standings", label: "Standings" },
    { key: "knockouts", label: "Knockouts" },
  ];

  return (
    <div>
      <LiveBanner live={live} />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="inline-flex flex-wrap rounded-lg border border-slate-700 p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                view === v.key ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {(view === "today" || view === "all") && (
          <div className="inline-flex flex-wrap rounded-lg border border-slate-700 p-0.5">
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
        )}
      </div>

      {view === "standings" ? (
        <StandingsTables standings={standings} pointsNote={pointsNote} />
      ) : view === "knockouts" ? (
        <KnockoutView knockouts={knockouts} />
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
          No {team !== "all" ? `${team} ` : ""}matches {view === "today" ? "today" : "scheduled"}.{" "}
          <button
            onClick={() => {
              setView("all");
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
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{g.heading}</h2>
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
