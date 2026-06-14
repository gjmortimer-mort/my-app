import type { GroupTable } from "../Board";
import type { Fixture } from "../Countdown";
import { getLeagueSchedule } from "./leagueSchedule";
import { getTeamFixtures } from "./teamFixtures";
import { getTournamentData } from "./tournamentData";
import { getU20Data } from "./u20Data";

const TZ = "America/New_York";
export const ZONE_LABEL = "EST";

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o }).format(d);
const dateKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export type TvGame = {
  id: string;
  home: string;
  away: string;
  homeScore: string | null;
  awayScore: string | null;
  phase: "upcoming" | "live" | "final" | "postponed";
  statusLabel: string;
};
export type SportDay = { sport: string; emoji: string; games: TvGame[] };
export type MultiSportDay = {
  sports: SportDay[];
  standings: GroupTable[];
  fixtures: Fixture[];
  updatedLabel: string;
};

const weeks = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const CRICKET = ["137150", "137146", "137145"];
const TIER1 = ["137137", "137133", "137125", "137123", "137130", "137141", "137136", "137128", "137175", "137124"];
const NBA = ["134879", "134862"];
const NHL = ["134838"];

type WithDate = { id: string; home: string; away: string; homeScore: string | null; awayScore: string | null; phase: TvGame["phase"]; statusLabel: string; etDateKey: string };
const pick = (arr: WithDate[], today: string): TvGame[] =>
  arr.filter((m) => m.etDateKey === today).map((m) => ({ id: m.id, home: m.home, away: m.away, homeScore: m.homeScore, awayScore: m.awayScore, phase: m.phase, statusLabel: m.statusLabel }));

export async function getMultiSportDay(): Promise<MultiSportDay> {
  const today = dateKey(new Date());

  const [soccer, rugbyWc, nfl, afl, cricket, rugbyIntl, nba, nhl, u20] = await Promise.all([
    getTournamentData({ leagueId: "4429", season: "2026", groupWord: "Group", rounds: [1, 2, 3], pointsScheme: "soccer", sport: "Soccer" }),
    getTournamentData({ leagueId: "4574", season: "2027", groupWord: "Pool", rounds: [1, 2, 3], pointsScheme: "rugby", teamSuffix: " Rugby", sport: "Rugby" }),
    getLeagueSchedule({ leagueId: "4391", season: "2026", rounds: weeks(18), roundWord: "Week", sport: "American Football" }),
    getLeagueSchedule({ leagueId: "4456", season: "2026", rounds: weeks(24), roundWord: "Round", teamSuffix: " Football Club", sport: "Australian Football" }),
    getTeamFixtures({ teamIds: CRICKET, teamSuffix: " Cricket", sport: "Cricket" }),
    getTeamFixtures({ teamIds: TIER1, teamSuffix: " Rugby", sport: "Rugby" }),
    getTeamFixtures({ teamIds: NBA, sport: "Basketball" }),
    getTeamFixtures({ teamIds: NHL, sport: "Ice Hockey" }),
    getU20Data(),
  ]);

  const u20Games: WithDate[] = u20.matches.map((m) => ({
    id: m.id,
    home: m.home,
    away: m.away,
    homeScore: m.homeScore != null ? String(m.homeScore) : null,
    awayScore: m.awayScore != null ? String(m.awayScore) : null,
    phase: m.phase,
    statusLabel: m.phase === "upcoming" ? m.timeLabel : m.phase === "live" ? "Live" : "Final",
    etDateKey: m.etDateKey,
  }));

  const candidates: { sport: string; emoji: string; src: WithDate[] }[] = [
    { sport: "Soccer World Cup", emoji: "⚽", src: soccer.matches },
    { sport: "Rugby World Cup", emoji: "🏉", src: rugbyWc.matches },
    { sport: "International Rugby", emoji: "🏉", src: rugbyIntl.matches },
    { sport: "U20 World Cup", emoji: "🌱", src: u20Games },
    { sport: "Cricket", emoji: "🏏", src: cricket.matches },
    { sport: "NFL", emoji: "🏈", src: nfl.matches },
    { sport: "AFL", emoji: "🏉", src: afl.matches },
    { sport: "NBA Finals", emoji: "🏀", src: nba.matches },
    { sport: "Stanley Cup", emoji: "🏒", src: nhl.matches },
  ];

  const sports: SportDay[] = candidates
    .map(({ sport, emoji, src }) => ({ sport, emoji, games: pick(src, today) }))
    .filter((s) => s.games.length > 0);

  const fixtures: Fixture[] = [
    soccer.fixtures, rugbyWc.fixtures, nfl.fixtures, afl.fixtures,
    cricket.fixtures, rugbyIntl.fixtures, nba.fixtures, nhl.fixtures,
  ].flat();

  return {
    sports,
    standings: soccer.standings,
    fixtures,
    updatedLabel: `${fmt(new Date(), { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`,
  };
}
