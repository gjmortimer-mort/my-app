// In-progress scores. TheSportsDB's schedule endpoints only carry final scores,
// so live (in-play) scores come from the v2 livescore feed, matched by event id.

const KEY = process.env.THESPORTSDB_KEY ?? "3";

export type LiveScore = { home: number | null; away: number | null; status: string };

type Scorable = {
  id: string;
  homeScore: string | null;
  awayScore: string | null;
  phase: "upcoming" | "live" | "final" | "postponed";
  statusLabel: string;
};

const FINAL = new Set(["FT", "AOT", "AET", "FINAL", "MATCH FINISHED", "AP", "PEN"]);
const PRETTY: Record<string, string> = { HT: "Halftime", "1H": "1st half", "2H": "2nd half", BT: "Break" };

function liveStatusToPhase(s: string): "upcoming" | "live" | "final" {
  const u = (s ?? "").toUpperCase().trim();
  if (FINAL.has(u)) return "final";
  if (u === "" || u === "NS" || u === "NOT STARTED") return "upcoming";
  return "live"; // anything else reported by the livescore feed is in-play
}

const num = (v: unknown): number | null => (v == null || v === "" ? null : Number(v));

export async function getLiveScores(sport: string): Promise<Map<string, LiveScore>> {
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v2/json/livescore/${encodeURIComponent(sport)}`, {
      headers: { "X-API-KEY": KEY },
      next: { revalidate: 30 },
    });
    if (!res.ok) return new Map();
    const data = (await res.json()) as { livescore?: RawLive[] | null; events?: RawLive[] | null };
    const out = new Map<string, LiveScore>();
    for (const e of data.livescore ?? data.events ?? []) {
      if (e.idEvent) out.set(e.idEvent, { home: num(e.intHomeScore), away: num(e.intAwayScore), status: e.strStatus ?? "" });
    }
    return out;
  } catch {
    return new Map();
  }
}

type RawLive = { idEvent: string; intHomeScore: string | null; intAwayScore: string | null; strStatus: string | null };

// Overlay live scores onto matches that are currently in play (by event id).
export function applyLive<T extends Scorable>(matches: T[], live: Map<string, LiveScore>): T[] {
  if (live.size === 0) return matches;
  return matches.map((m) => {
    const lv = live.get(m.id);
    if (!lv || lv.home == null || lv.away == null) return m;
    const phase = liveStatusToPhase(lv.status);
    const u = lv.status.toUpperCase().trim();
    const statusLabel =
      phase === "live" ? (PRETTY[u] ?? (u.length <= 4 ? u : "Live")) : phase === "final" ? "Final" : m.statusLabel;
    return { ...m, homeScore: String(lv.home), awayScore: String(lv.away), phase, statusLabel } as T;
  });
}
