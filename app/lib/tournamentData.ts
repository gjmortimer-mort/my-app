import type { GroupTable, KnockoutRound, Match, Phase, StandingRow } from "../Board";
import type { Fixture } from "../Countdown";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
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

function knockoutLabel(roundCode: string, gameCount: number): string {
  if (ROUND_LABELS[roundCode]) return ROUND_LABELS[roundCode];
  if (gameCount >= 12) return "Round of 32";
  if (gameCount >= 6) return "Round of 16";
  if (gameCount >= 3) return "Quarter-finals";
  if (gameCount === 2) return "Semi-finals";
  return "Knockout";
}

export async function getTournamentData(config: DataConfig): Promise<TournamentData> {
  const { leagueId, season, groupWord, rounds, teamSuffix, pointsScheme } = config;

  const seasonUrl = `${BASE}/eventsseason.php?id=${leagueId}&s=${season}`;
  const roundUrls = rounds.map((r) => `${BASE}/eventsround.php?id=${leagueId}&r=${r}&s=${season}`);
  const feeds = await Promise.all([getJson(seasonUrl), ...roundUrls.map(getJson)]);
  const failed = feeds.every((f) => f === null);

  // Merge feeds by event id, preferring whichever copy has score/status/group.
  const byId = new Map<string, ApiEvent>();
  for (const e of feeds.flatMap((f) => f ?? [])) {
    const prev = byId.get(e.idEvent);
    byId.set(
      e.idEvent,
      prev
        ? {
            ...prev,
            ...e,
            strGroup: e.strGroup ?? prev.strGroup,
            intHomeScore: e.intHomeScore ?? prev.intHomeScore,
            intAwayScore: e.intAwayScore ?? prev.intAwayScore,
            strStatus: e.strStatus ?? prev.strStatus,
          }
        : e,
    );
  }
  const events = [...byId.values()]
    .filter((e) => kickoff(e))
    .sort((a, b) => kickoff(a)!.getTime() - kickoff(b)!.getTime());

  const clean = (name: string) =>
    teamSuffix && name.endsWith(teamSuffix) ? name.slice(0, -teamSuffix.length) : name;

  const toMatch = (e: ApiEvent): Match => {
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
      groupLabel: e.strGroup ? `${groupWord} ${e.strGroup}` : "",
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

  // ---- Standings: completed group-stage games only -----------------------
  const [winPts, drawPts] = pointsScheme === "rugby" ? [4, 2] : [3, 1];
  const tables = new Map<string, Map<string, StandingRow>>();

  const groupRounds = new Set(rounds.map(String));
  for (const e of events) {
    if (!e.strGroup || !groupRounds.has(e.intRound ?? "")) continue;
    const grp = e.strGroup;
    if (!tables.has(grp)) tables.set(grp, new Map());
    const table = tables.get(grp)!;
    for (const [name, badge] of [
      [e.strHomeTeam, e.strHomeTeamBadge],
      [e.strAwayTeam, e.strAwayTeamBadge],
    ] as const) {
      if (!table.has(name))
        table.set(name, {
          team: clean(name),
          badge,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          scoreFor: 0,
          scoreAgainst: 0,
          diff: 0,
          points: 0,
        });
    }
    if (classify(e) !== "final" || e.intHomeScore == null || e.intAwayScore == null) continue;
    const hs = Number(e.intHomeScore);
    const as = Number(e.intAwayScore);
    const home = table.get(e.strHomeTeam)!;
    const away = table.get(e.strAwayTeam)!;
    home.played++; away.played++;
    home.scoreFor += hs; home.scoreAgainst += as;
    away.scoreFor += as; away.scoreAgainst += hs;
    if (hs > as) { home.won++; home.points += winPts; away.lost++; }
    else if (hs < as) { away.won++; away.points += winPts; home.lost++; }
    else { home.drawn++; away.drawn++; home.points += drawPts; away.points += drawPts; }
  }

  const standings: GroupTable[] = [...tables.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, table]) => ({
      group: `${groupWord} ${group}`,
      rows: [...table.values()]
        .map((r) => ({ ...r, diff: r.scoreFor - r.scoreAgainst }))
        .sort(
          (a, b) =>
            b.points - a.points || b.diff - a.diff || b.scoreFor - a.scoreFor || a.team.localeCompare(b.team),
        ),
    }));

  // ---- Knockouts: games outside the group-stage rounds -------------------
  const koByRound = new Map<string, ApiEvent[]>();
  for (const e of events) {
    const r = e.intRound ?? "";
    if (groupRounds.has(r) || e.strGroup) continue;
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
