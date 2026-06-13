const TZ = "America/New_York";
export const ZONE_LABEL = "EST";

// World Rugby's (Pulselive) match API — the only source that carries the U20
// World Cup. Filtered to the JWC2026 event over its date window.
const URL =
  "https://api.wr-rims-prod.pulselive.com/rugby/v3/match?startDate=2026-06-20&endDate=2026-07-25&pageSize=100&sort=asc";
const EVENT = "World Rugby U20 Championship 2026";

export type U20Match = {
  id: string;
  etDateKey: string;
  dateHeading: string;
  timeLabel: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  phase: "upcoming" | "live" | "final";
  pool: string;
  isSA: boolean;
};

export type U20Data = { failed: boolean; matches: U20Match[]; updatedLabel: string; hasLive: boolean };

const FINAL = new Set(["C", "R", "RESULT", "FT", "FT-AET", "COMPLETE"]);
const LIVE = new Set(["L", "LIVE", "L1", "L2", "HT", "FH", "SH"]);
const clean = (n: string) => (n ?? "").replace(/\s*U20$/i, "").trim();

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o }).format(d);
const dateKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export async function getU20Data(): Promise<U20Data> {
  let content: unknown[];
  try {
    const res = await fetch(URL, {
      headers: { Referer: "https://www.world.rugby/", Origin: "https://www.world.rugby", "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return { failed: true, matches: [], updatedLabel: "", hasLive: false };
    content = ((await res.json()) as { content?: unknown[] }).content ?? [];
  } catch {
    return { failed: true, matches: [], updatedLabel: "", hasLive: false };
  }

  type Raw = {
    matchId: string;
    teams: { name: string }[];
    scores: number[];
    status: string;
    time: { millis: number };
    eventPhase: string | null;
    events: { label: string }[];
  };

  const matches: U20Match[] = (content as Raw[])
    .filter((m) => (m.events?.[0]?.label ?? "") === EVENT && m.time?.millis)
    .sort((a, b) => a.time.millis - b.time.millis)
    .map((m) => {
      const d = new Date(m.time.millis);
      const s = (m.status ?? "").toUpperCase();
      const phase: U20Match["phase"] = FINAL.has(s) ? "final" : LIVE.has(s) ? "live" : "upcoming";
      const scored = phase !== "upcoming" && Array.isArray(m.scores) && m.scores.length === 2;
      const home = clean(m.teams?.[0]?.name ?? "TBD");
      const away = clean(m.teams?.[1]?.name ?? "TBD");
      return {
        id: m.matchId,
        etDateKey: dateKey(d),
        dateHeading: fmt(d, { weekday: "long", month: "long", day: "numeric" }),
        timeLabel: `${fmt(d, { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`,
        home,
        away,
        homeScore: scored ? m.scores[0] : null,
        awayScore: scored ? m.scores[1] : null,
        phase,
        pool: m.eventPhase ?? "",
        isSA: home === "South Africa" || away === "South Africa",
      };
    });

  return {
    failed: false,
    matches,
    updatedLabel: `${fmt(new Date(), { hour: "numeric", minute: "2-digit", hour12: true })} ${ZONE_LABEL}`,
    hasLive: matches.some((m) => m.phase === "live"),
  };
}
