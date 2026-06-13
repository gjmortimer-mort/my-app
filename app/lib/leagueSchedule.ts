import type { Match, Phase } from "../Board";
import type { Fixture } from "../Countdown";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
const TZ = "America/New_York";
export const ZONE_LABEL = "EST";

// A round-based league with no group stage (NFL weeks, AFL rounds, etc.).
export type LeagueScheduleConfig = {
  leagueId: string;
  season: string;
  rounds: number[]; // round numbers that hold the schedule
  roundWord: string; // "Week" (NFL) or "Round" (AFL) — shown on each game
  teamSuffix?: string; // e.g. " Football Club" — stripped from names for display
};

export type LeagueData = {
  failed: boolean;
  matches: Match[];
  fixtures: Fixture[];
  updatedLabel: string;
  hasLive: boolean;
};

type ApiEvent = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string | null;
  strStatus: string | null;
  strPostponed: string | null;
  intRound: string | null;
};

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "Q1", "Q2", "Q3", "Q4", "IN PROGRESS", "LIVE"]);
const FINAL_STATUSES = new Set(["FT", "AOT", "FINAL", "MATCH FINISHED"]);

function classify(e: ApiEvent): Phase {
  const s = (e.strStatus ?? "").toUpperCase();
  if (e.strPostponed === "yes" || s === "PST" || s === "CANC") return "postponed";
  if (LIVE_STATUSES.has(s)) return "live";
  if (FINAL_STATUSES.has(s)) return "final";
  if (e.intHomeScore != null && e.intAwayScore != null && s !== "NS") return "final";
  return "upcoming";
}

function kickoff(e: ApiEvent): Date | null {
  if (!e.strTimestamp) return null;
  const d = new Date(`${e.strTimestamp}Z`);
  return isNaN(d.getTime()) ? null : d;
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts }).format(d);
const dateKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

function statusLabel(e: ApiEvent, phase: Phase, d: Date | null): string {
  if (phase === "live") return "Live";
  if (phase === "final") return "Final";
  if (phase === "postponed") return "Postponed";
  return d ? `${fmt(d, { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}` : "TBD";
}

async function getJson(url: string): Promise<ApiEvent[] | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { events: ApiEvent[] | null };
    return data.events ?? [];
  } catch {
    return null;
  }
}

export async function getLeagueSchedule(config: LeagueScheduleConfig): Promise<LeagueData> {
  const { leagueId, season, rounds, roundWord, teamSuffix } = config;
  const feeds = await Promise.all(
    rounds.map((r) => getJson(`${BASE}/eventsround.php?id=${leagueId}&r=${r}&s=${season}`)),
  );
  const failed = feeds.every((f) => f === null);

  const byId = new Map<string, ApiEvent>();
  for (const e of feeds.flatMap((f) => f ?? [])) byId.set(e.idEvent, e);

  const events = [...byId.values()]
    .filter((e) => kickoff(e))
    .sort((a, b) => kickoff(a)!.getTime() - kickoff(b)!.getTime());

  const clean = (name: string) =>
    teamSuffix && name.endsWith(teamSuffix) ? name.slice(0, -teamSuffix.length) : name;

  const matches: Match[] = events.map((e) => {
    const d = kickoff(e)!;
    const phase = classify(e);
    return {
      id: e.idEvent,
      home: clean(e.strHomeTeam),
      away: clean(e.strAwayTeam),
      homeBadge: e.strHomeTeamBadge,
      awayBadge: e.strAwayTeamBadge,
      homeScore: e.intHomeScore,
      awayScore: e.intAwayScore,
      phase,
      statusLabel: statusLabel(e, phase, d),
      groupLabel: e.intRound ? `${roundWord} ${e.intRound}` : "",
      etDateKey: dateKey(d),
      dateHeading: fmt(d, { weekday: "long", month: "long", day: "numeric" }),
    };
  });

  const now = Date.now();
  const fixtures: Fixture[] = events
    .filter((e) => kickoff(e)!.getTime() > now)
    .map((e) => ({ iso: kickoff(e)!.toISOString(), home: clean(e.strHomeTeam), away: clean(e.strAwayTeam) }));

  return {
    failed,
    matches,
    fixtures,
    updatedLabel: `${fmt(new Date(), { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`,
    hasLive: matches.some((m) => m.phase === "live"),
  };
}
