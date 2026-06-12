import Link from "next/link";
import AutoRefresh from "./AutoRefresh";

// Refresh the cached data at most once an hour (ISR). The client <AutoRefresh>
// then pulls the latest copy into open tabs on the same cadence.
export const revalidate = 3600;

const SEASON = "2026";
const WORLD_CUP_LEAGUE_ID = "4429";
const API = `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=${WORLD_CUP_LEAGUE_ID}&s=${SEASON}`;

const TZ = "America/New_York";

type ApiEvent = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string | null; // UTC, e.g. "2026-06-11T19:00:00"
  strStatus: string | null; // NS, 1H, HT, 2H, FT, AET, PEN, PST...
  strPostponed: string | null;
  strGroup: string | null;
  strVenue: string | null;
};

type Phase = "upcoming" | "live" | "final" | "postponed";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INPLAY"]);
const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "AP"]);

function classify(e: ApiEvent): Phase {
  const s = (e.strStatus ?? "").toUpperCase();
  if (e.strPostponed === "yes" || s === "PST" || s === "CANC" || s === "ABD") return "postponed";
  if (LIVE_STATUSES.has(s)) return "live";
  if (FINAL_STATUSES.has(s)) return "final";
  // Fall back to the score if the status string is missing/unknown.
  if (e.intHomeScore != null && e.intAwayScore != null) return "final";
  return "upcoming";
}

function kickoff(e: ApiEvent): Date | null {
  if (!e.strTimestamp) return null;
  // Timestamps are UTC but lack a zone suffix — append Z so they parse as UTC.
  const d = new Date(`${e.strTimestamp}Z`);
  return isNaN(d.getTime()) ? null : d;
}

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function fmtDateHeading(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(d);
}

// A stable yyyy-mm-dd key in Eastern time, for grouping by matchday.
function dateKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

async function getEvents(): Promise<ApiEvent[] | null> {
  try {
    const res = await fetch(API, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { events: ApiEvent[] | null };
    return data.events ?? [];
  } catch {
    return null;
  }
}

function TeamBadge({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return <div className="h-7 w-7 shrink-0 rounded-full bg-slate-700" aria-hidden />;
  }
  // Plain <img> avoids next/image remote-host config for the badge CDN.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />;
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

function MatchRow({ e }: { e: ApiEvent }) {
  const phase = classify(e);
  const d = kickoff(e);
  const hasScore = e.intHomeScore != null && e.intAwayScore != null;

  const statusLabel =
    phase === "live"
      ? e.strStatus === "HT"
        ? "Halftime"
        : "Live"
      : phase === "final"
        ? e.strStatus === "AET"
          ? "Final (AET)"
          : e.strStatus === "PEN"
            ? "Final (pens)"
            : "Final"
        : phase === "postponed"
          ? "Postponed"
          : d
            ? `${fmtTime(d)} ET`
            : "TBD";

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Home */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
        <span className="truncate font-medium text-white">{e.strHomeTeam}</span>
        <TeamBadge src={e.strHomeTeamBadge} alt={e.strHomeTeam} />
      </div>

      {/* Score / center */}
      <div className="flex w-24 shrink-0 flex-col items-center">
        <div className="text-lg font-semibold tabular-nums text-white">
          {hasScore ? (
            <span>
              {e.intHomeScore}
              <span className="px-1.5 text-slate-500">–</span>
              {e.intAwayScore}
            </span>
          ) : (
            <span className="text-slate-500">vs</span>
          )}
        </div>
        <StatusPill phase={phase} label={statusLabel} />
      </div>

      {/* Away */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TeamBadge src={e.strAwayTeamBadge} alt={e.strAwayTeam} />
        <span className="truncate font-medium text-white">{e.strAwayTeam}</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const events = await getEvents();

  // Build "last updated" stamp at render time. Because the page is ISR-cached,
  // this reflects when the data was last refreshed.
  const updatedLabel = `${fmtTime(new Date())} ET`;

  // Sort by kickoff and group by Eastern calendar day.
  const sorted = (events ?? [])
    .filter((e) => kickoff(e))
    .sort((a, b) => kickoff(a)!.getTime() - kickoff(b)!.getTime());

  const groups: { key: string; heading: string; date: Date; matches: ApiEvent[] }[] = [];
  for (const e of sorted) {
    const d = kickoff(e)!;
    const key = dateKey(d);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, heading: fmtDateHeading(d), date: d, matches: [] };
      groups.push(g);
    }
    g.matches.push(e);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            FIFA World Cup {SEASON}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Results &amp; fixtures</h1>
          <p className="mt-2 text-sm text-slate-400">
            All times Eastern · scores fill in as games are played · updated {updatedLabel}, refreshes hourly
          </p>
        </header>

        {events === null ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the scores feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            No matches scheduled yet. They&apos;ll appear here as soon as the fixtures are published.
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {g.heading}
                </h2>
                <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  {g.matches.map((e) => (
                    <MatchRow key={e.idEvent} e={e} />
                  ))}
                </div>
              </section>
            ))}
          </div>
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
