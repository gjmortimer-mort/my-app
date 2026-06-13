import type { TeamMatch } from "../FixturesBoard";
import type { Fixture } from "../Countdown";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
const TZ = "America/New_York";
export const ZONE_LABEL = "EST";

export type TeamFixturesConfig = {
  teamIds: string[]; // national-team ids to pull recent + upcoming events for
  teamSuffix?: string; // e.g. " Rugby" / " Cricket" — stripped from names
};

export type TeamFixturesData = {
  failed: boolean;
  matches: TeamMatch[];
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
  strResult: string | null;
  strLeague: string | null;
};

const FINAL_STATUSES = new Set(["FT", "AOT", "MATCH FINISHED", "AET", "FINAL"]);
const LIVE_STATUSES = new Set(["LIVE", "IN PROGRESS", "1H", "2H", "HT", "INNINGS BREAK"]);

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts }).format(d);
const dateKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

function kickoff(e: ApiEvent): Date | null {
  if (!e.strTimestamp) return null;
  const d = new Date(`${e.strTimestamp}Z`);
  return isNaN(d.getTime()) ? null : d;
}

async function getJson(url: string): Promise<ApiEvent[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: ApiEvent[] | null; results?: ApiEvent[] | null };
    return data.events ?? data.results ?? [];
  } catch {
    return [];
  }
}

export async function getTeamFixtures(config: TeamFixturesConfig): Promise<TeamFixturesData> {
  const { teamIds, teamSuffix } = config;
  const urls = teamIds.flatMap((id) => [`${BASE}/eventslast.php?id=${id}`, `${BASE}/eventsnext.php?id=${id}`]);
  const results = await Promise.all(urls.map(getJson));
  const failed = results.every((r) => r.length === 0);

  const byId = new Map<string, ApiEvent>();
  for (const e of results.flat()) if (e.idEvent) byId.set(e.idEvent, e);

  const events = [...byId.values()]
    .filter((e) => kickoff(e))
    .sort((a, b) => kickoff(a)!.getTime() - kickoff(b)!.getTime());

  const clean = (name: string) => (teamSuffix && name.endsWith(teamSuffix) ? name.slice(0, -teamSuffix.length) : name);

  const matches: TeamMatch[] = events.map((e) => {
    const d = kickoff(e)!;
    const s = (e.strStatus ?? "").toUpperCase();
    const hasScore = e.intHomeScore != null && e.intAwayScore != null;
    const phase: TeamMatch["phase"] = FINAL_STATUSES.has(s)
      ? "final"
      : LIVE_STATUSES.has(s)
        ? "live"
        : hasScore && s !== "NS"
          ? "final"
          : "upcoming";
    const statusLabel =
      phase === "live"
        ? "Live"
        : phase === "final"
          ? "Final"
          : `${fmt(d, { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`;
    return {
      id: e.idEvent,
      home: clean(e.strHomeTeam),
      away: clean(e.strAwayTeam),
      homeBadge: e.strHomeTeamBadge,
      awayBadge: e.strAwayTeamBadge,
      homeScore: e.intHomeScore,
      awayScore: e.intAwayScore,
      phase,
      statusLabel,
      result: e.strResult?.trim() ?? "",
      competition: e.strLeague ?? "",
      etDateKey: dateKey(d),
      dateHeading: fmt(d, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
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
