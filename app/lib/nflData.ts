import type { Match, Phase } from "../Board";
import type { Fixture } from "../Countdown";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
const LEAGUE = "4391";
const TZ = "America/New_York";
export const ZONE_LABEL = "EST";

// Regular-season weeks 1–18 give the complete 272-game schedule.
const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

export type NflData = {
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
  intRound: string | null; // week number
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

export async function getNflData(season: string): Promise<NflData> {
  const feeds = await Promise.all(WEEKS.map((w) => getJson(`${BASE}/eventsround.php?id=${LEAGUE}&r=${w}&s=${season}`)));
  const failed = feeds.every((f) => f === null);

  const byId = new Map<string, ApiEvent>();
  for (const e of feeds.flatMap((f) => f ?? [])) byId.set(e.idEvent, e);

  const events = [...byId.values()]
    .filter((e) => kickoff(e))
    .sort((a, b) => kickoff(a)!.getTime() - kickoff(b)!.getTime());

  const matches: Match[] = events.map((e) => {
    const d = kickoff(e)!;
    const phase = classify(e);
    return {
      id: e.idEvent,
      home: e.strHomeTeam,
      away: e.strAwayTeam,
      homeBadge: e.strHomeTeamBadge,
      awayBadge: e.strAwayTeamBadge,
      homeScore: e.intHomeScore,
      awayScore: e.intAwayScore,
      phase,
      statusLabel: statusLabel(e, phase, d),
      groupLabel: e.intRound ? `Week ${e.intRound}` : "",
      etDateKey: dateKey(d),
      dateHeading: fmt(d, { weekday: "long", month: "long", day: "numeric" }),
    };
  });

  const now = Date.now();
  const fixtures: Fixture[] = events
    .filter((e) => kickoff(e)!.getTime() > now)
    .map((e) => ({ iso: kickoff(e)!.toISOString(), home: e.strHomeTeam, away: e.strAwayTeam }));

  return {
    failed,
    matches,
    fixtures,
    updatedLabel: `${fmt(new Date(), { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`,
    hasLive: matches.some((m) => m.phase === "live"),
  };
}
