import AutoRefresh from "./AutoRefresh";
import Board, { type Match, type Phase } from "./Board";
import Countdown, { type Fixture } from "./Countdown";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
const TZ = "America/New_York";
const ZONE_LABEL = "EST";

export type TournamentConfig = {
  leagueId: string;
  season: string;
  badge: string; // e.g. "FIFA World Cup 2026"
  groupWord: string; // "Group" (soccer) or "Pool" (rugby)
  rounds: number[]; // pool/group-stage rounds that carry group letters
  teamSuffix?: string; // e.g. " Rugby" — stripped from team names for display
};

type ApiEvent = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string | null; // UTC, e.g. "2026-06-11T19:00:00"
  strStatus: string | null;
  strPostponed: string | null;
  strGroup: string | null;
};

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INPLAY"]);
const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "AP"]);

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
  const d = new Date(`${e.strTimestamp}Z`); // append Z so the UTC stamp parses correctly
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
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { events: ApiEvent[] | null };
    return data.events ?? [];
  } catch {
    return null;
  }
}

export default async function Tournament({ config }: { config: TournamentConfig }) {
  const { leagueId, season, badge, groupWord, rounds, teamSuffix } = config;

  const seasonUrl = `${BASE}/eventsseason.php?id=${leagueId}&s=${season}`;
  const roundUrls = rounds.map((r) => `${BASE}/eventsround.php?id=${leagueId}&r=${r}&s=${season}`);

  const feeds = await Promise.all([getJson(seasonUrl), ...roundUrls.map(getJson)]);
  const failed = feeds.every((f) => f === null);

  // Merge every feed by event id. The round feeds carry group letters; if any
  // feed has a score/status/group for an event, keep it (handles feeds that lag).
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

  const clean = (name: string) => (teamSuffix && name.endsWith(teamSuffix) ? name.slice(0, -teamSuffix.length) : name);

  const updatedLabel = `${fmt(new Date(), { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`;

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
      groupLabel: e.strGroup ? `${groupWord} ${e.strGroup}` : "",
      etDateKey: dateKey(d),
      dateHeading: fmt(d, { weekday: "long", month: "long", day: "numeric" }),
    };
  });

  // All kickoffs (UTC ISO) so the client clock can count down to the next one.
  const fixtures: Fixture[] = events.map((e) => ({
    iso: kickoff(e)!.toISOString(),
    home: clean(e.strHomeTeam),
    away: clean(e.strAwayTeam),
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://flagcdn.com/w640/za.png"
              alt="Flag of South Africa"
              className="h-16 w-auto rounded-md shadow-lg ring-1 ring-white/10 sm:h-20"
            />
            <span
              className="text-2xl leading-tight text-amber-300 sm:text-4xl"
              style={{
                fontFamily: "var(--font-display)",
                textShadow: "0 0 8px rgba(251,191,36,0.55), 0 0 22px rgba(251,191,36,0.35)",
              }}
            >
              Morts Bar on Old Graham
            </span>
          </div>
          <Countdown fixtures={fixtures} />
        </div>
        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            {badge}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Results &amp; fixtures</h1>
          <p className="mt-2 text-sm text-slate-400">
            All times {ZONE_LABEL} · scores fill in as games are played · updated {updatedLabel}, refreshes hourly
          </p>
        </header>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the scores feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            No matches scheduled yet. They&apos;ll appear here as soon as the fixtures are published.
          </div>
        ) : (
          <Board matches={matches} />
        )}

        <footer className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          Data: TheSportsDB
        </footer>
      </div>
    </main>
  );
}
