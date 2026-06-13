import type { GroupTable, KnockoutRound, Match, Phase, StandingRow } from "../Board";
import type { Fixture } from "../Countdown";

import { SPORTSDB_BASE as BASE } from "./sportsdb";
const TZ = "America/New_York";
export const ZONE_LABEL = "EST";

export type DataConfig = {
  leagueId: string;
  season: string;
  groupWord: string; // "Group" or "Pool"
  rounds: number[]; // group/pool-stage rounds
  teamSuffix?: string; // stripped from team names for display
  pointsScheme: "soccer" | "rugby"; // 3/1/0 vs 4/2/0
};

export type TournamentData = {
  failed: boolean;
  matches: Match[];
  fixtures: Fixture[];
  standings: GroupTable[];
  knockouts: KnockoutRound[];
  updatedLabel: string;
  hasLive: boolean;
};

// While a match is in progress we want near-live scores; otherwise stay lazy.
export const LIVE_REFRESH_MS = 60_000;
export const IDLE_REFRESH_MS = 600_000;

type ApiEvent = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string | null; // UTC without zone suffix
  strStatus: string | null;
  strPostponed: string | null;
  strGroup: string | null;
  intRound: string | null;
};

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INPLAY"]);
const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "AP"]);

// TheSportsDB knockout round codes, with a size-based fallback for the rest.
const ROUND_LABELS: Record<string, string> = {
  "80": "Round of 16",
  "125": "Quarter-finals",
  "150": "Semi-finals",
  "160": "Third place play-off",
  "200": "Final",
};

function classify(e: ApiEvent): Phase {
  const s = (e.strStatus ?? "").toUpperCase();
  if (e.strPostponed === "yes" || s === "PST" || s === "CANC" || s === "ABD") return "postponed";
  if (LIVE_STATUSES.has(s)) return "live";
  if (FINAL_STATUSES.has(s)) return "final";
  if (e.intHomeScore != null && e.intAwayScore != null) return "final";
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
  if (phase === "live") return e.strStatus === "HT" ? "Halftime" : "Live";
  if (phase === "final")
    return e.strStatus === "AET" ? "Final (AET)" : e.strStatus === "PEN" ? "Final (pens)" : "Final";
  if (phase === "postponed") return "Postponed";
  return d ? `${fmt(d, { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}` : "TBD";
}

async function getJson(url: string): Promise<ApiEvent[] | null> {
  try {
    // Re-fetch at most once a minute so live scores stay fresh; the per-visitor
    // load is deduped by Next's cache regardless of how many people are watching.
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { events: ApiEvent[] | null };
    return data.events ?? [];
  } catch {
    return null;
  }
}

type TableRow = {
  strTeam: string;
  strBadge: string | null;
  strGroup: string | null; // "Group A" / "Pool A"
  intPlayed?: string;
  intWin?: string;
  intDraw?: string;
  intLoss?: string;
  intGoalsFor?: string;
  intGoalsAgainst?: string;
  intGoalDifference?: string;
  intPoints?: string;
};

// The official standings table (premium endpoint). Returns [] if a season has
// no table yet (e.g. a future tournament), null only on a real fetch failure.
async function getTable(url: string): Promise<TableRow[] | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { table?: TableRow[] | null };
    return data.table ?? [];
  } catch {
    return null;
  }
}

const groupLetter = (g: string | null | undefined) => (g ?? "").replace(/^(group|pool)\s+/i, "").trim();

function knockoutLabel(roundCode: string, gameCount: number): string {
  if (ROUND_LABELS[roundCode]) return ROUND_LABELS[roundCode];
  if (gameCount >= 12) return "Round of 32";
  if (gameCount >= 6) return "Round of 16";
  if (gameCount >= 3) return "Quarter-finals";
  if (gameCount === 2) return "Semi-finals";
  return "Knockout";
}

export async function getTournamentData(config: DataConfig): Promise<TournamentData> {
  const { leagueId, season, groupWord, rounds, teamSuffix } = config;

  const [seasonEvents, table] = await Promise.all([
    getJson(`${BASE}/eventsseason.php?id=${leagueId}&s=${season}`),
    getTable(`${BASE}/lookuptable.php?l=${leagueId}&s=${season}`),
  ]);
  const failed = seasonEvents === null;

  const events = (seasonEvents ?? [])
    .filter((e) => kickoff(e))
    .sort((a, b) => kickoff(a)!.getTime() - kickoff(b)!.getTime());

  const clean = (name: string) =>
    teamSuffix && name.endsWith(teamSuffix) ? name.slice(0, -teamSuffix.length) : name;

  // team -> group letter, taken from the official standings table
  const teamGroup = new Map<string, string>();
  for (const r of table ?? []) {
    const letter = groupLetter(r.strGroup);
    if (letter) teamGroup.set(r.strTeam, letter);
  }

  const groupRounds = new Set(rounds.map(String));
  const groupOf = (e: ApiEvent): string =>
    groupRounds.has(e.intRound ?? "") ? (teamGroup.get(e.strHomeTeam) ?? teamGroup.get(e.strAwayTeam) ?? "") : "";

  const toMatch = (e: ApiEvent): Match => {
    const d = kickoff(e)!;
    const phase = classify(e);
    const g = groupOf(e);
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
      groupLabel: g ? `${groupWord} ${g}` : "",
      etDateKey: dateKey(d),
      dateHeading: fmt(d, { weekday: "long", month: "long", day: "numeric" }),
    };
  };

  const matches = events.map(toMatch);

  const fixtures: Fixture[] = events.map((e) => ({
    iso: kickoff(e)!.toISOString(),
    home: clean(e.strHomeTeam),
    away: clean(e.strAwayTeam),
  }));

  // ---- Standings: straight from the official table -----------------------
  const byGroup = new Map<string, StandingRow[]>();
  for (const r of table ?? []) {
    const letter = groupLetter(r.strGroup);
    if (!letter) continue;
    if (!byGroup.has(letter)) byGroup.set(letter, []);
    byGroup.get(letter)!.push({
      team: clean(r.strTeam),
      badge: r.strBadge ?? null,
      played: Number(r.intPlayed ?? 0),
      won: Number(r.intWin ?? 0),
      drawn: Number(r.intDraw ?? 0),
      lost: Number(r.intLoss ?? 0),
      scoreFor: Number(r.intGoalsFor ?? 0),
      scoreAgainst: Number(r.intGoalsAgainst ?? 0),
      diff: Number(r.intGoalDifference ?? 0),
      points: Number(r.intPoints ?? 0),
    });
  }
  const standings: GroupTable[] = [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, rows]) => ({
      group: `${groupWord} ${letter}`,
      rows: rows.sort(
        (a, b) => b.points - a.points || b.diff - a.diff || b.scoreFor - a.scoreFor || a.team.localeCompare(b.team),
      ),
    }));

  // ---- Knockouts: games outside the group rounds -------------------------
  const koByRound = new Map<string, ApiEvent[]>();
  for (const e of events) {
    if (groupRounds.has(e.intRound ?? "")) continue;
    const r = e.intRound ?? "";
    if (!koByRound.has(r)) koByRound.set(r, []);
    koByRound.get(r)!.push(e);
  }
  const knockouts: KnockoutRound[] = [...koByRound.entries()]
    .map(([code, evs]) => ({
      code,
      label: knockoutLabel(code, evs.length),
      first: Math.min(...evs.map((e) => kickoff(e)!.getTime())),
      matches: evs.map(toMatch),
    }))
    .sort((a, b) => a.first - b.first)
    .map(({ label, matches }) => ({ label, matches }));

  const updatedLabel = `${fmt(new Date(), { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`;
  const hasLive = matches.some((m) => m.phase === "live");

  return { failed, matches, fixtures, standings, knockouts, updatedLabel, hasLive };
}
