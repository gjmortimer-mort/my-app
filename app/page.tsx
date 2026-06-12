import Link from "next/link";
import AutoRefresh from "./AutoRefresh";
import Board, { type Match, type Phase } from "./Board";
import Countdown, { type Fixture } from "./Countdown";

// Refresh the cached data at most once an hour (ISR). The client <AutoRefresh>
// then pulls the latest copy into open tabs on the same cadence.
export const revalidate = 3600;

const SEASON = "2026";
const LEAGUE = "4429";
const BASE = "https://www.thesportsdb.com/api/v1/json/3";
const SEASON_URL = `${BASE}/eventsseason.php?id=${LEAGUE}&s=${SEASON}`;
const GROUPS_URL = `${BASE}/eventsround.php?id=${LEAGUE}&r=1&s=${SEASON}`; // round 1 carries group letters

const TZ = "America/New_York";
const ZONE_LABEL = "EST";

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

export default async function Home() {
  const [season, roundOne] = await Promise.all([getJson(SEASON_URL), getJson(GROUPS_URL)]);

  // Build a team -> group letter map from the round that carries group data.
  // Each team belongs to exactly one group, so this labels matches in any feed.
  const teamGroup = new Map<string, string>();
  for (const e of roundOne ?? []) {
    if (e.strGroup) {
      teamGroup.set(e.strHomeTeam, e.strGroup);
      teamGroup.set(e.strAwayTeam, e.strGroup);
    }
  }

  const updatedLabel = `${fmt(new Date(), { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`;

  const matches: Match[] = (season ?? [])
    .filter((e) => kickoff(e))
    .sort((a, b) => kickoff(a)!.getTime() - kickoff(b)!.getTime())
    .map((e) => {
      const d = kickoff(e)!;
      const phase = classify(e);
      const grp = e.strGroup ?? teamGroup.get(e.strHomeTeam) ?? teamGroup.get(e.strAwayTeam) ?? "";
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
        groupLabel: grp ? `Group ${grp}` : "",
        etDateKey: dateKey(d),
        dateHeading: fmt(d, { weekday: "long", month: "long", day: "numeric" }),
      };
    });

  const failed = season === null;

  // All kickoffs (UTC ISO) so the client clock can count down to the next one.
  const fixtures: Fixture[] = (season ?? [])
    .map((e) => {
      const d = kickoff(e);
      return d ? { iso: d.toISOString(), home: e.strHomeTeam, away: e.strAwayTeam } : null;
    })
    .filter((f): f is Fixture => f !== null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://flagcdn.com/w640/za.png"
            alt="Flag of South Africa"
            className="h-16 w-auto rounded-md shadow-lg ring-1 ring-white/10 sm:h-20"
          />
          <Countdown fixtures={fixtures} />
        </div>
        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            FIFA World Cup {SEASON}
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

        <footer className="mt-12 flex items-center justify-between border-t border-slate-800 pt-6 text-sm text-slate-500">
          <span>Data: TheSportsDB</span>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="hover:text-slate-300">
              Temp dashboard
            </Link>
            <Link href="/weather" className="hover:text-slate-300">
              Weather check
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
