import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import Footer from "../Footer";
import { getU20Data, ZONE_LABEL, type U20Match } from "../lib/u20Data";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "U20 World Cup 2026 — Junior Boks",
  description: "World Rugby U20 Championship 2026 fixtures, pools and results — backing the Junior Boks.",
};

function Row({ m }: { m: U20Match }) {
  const played = m.homeScore != null && m.awayScore != null;
  const pill =
    m.phase === "live"
      ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40"
      : m.phase === "final"
        ? "bg-slate-700/60 text-slate-300"
        : "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30";
  return (
    <div className={`rounded-2xl border p-4 ${m.isSA ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-slate-800 bg-slate-900"}`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate rounded-full bg-violet-500/15 px-2.5 py-0.5 font-semibold uppercase tracking-wide text-violet-300 ring-1 ring-violet-500/30">
          {m.pool || "U20 World Cup"}
        </span>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${pill}`}>
          {m.phase === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />}
          {m.phase === "live" ? "Live" : m.phase === "final" ? "Final" : `${m.timeLabel}`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex-1 truncate font-medium text-white">
          {m.home === "South Africa" ? "🇿🇦 " : ""}
          {m.home}
        </span>
        <span className="shrink-0 text-lg font-semibold tabular-nums text-white">
          {played ? `${m.homeScore} – ${m.awayScore}` : <span className="text-slate-500">vs</span>}
        </span>
        <span className="flex-1 truncate text-right font-medium text-white">
          {m.away}
          {m.away === "South Africa" ? " 🇿🇦" : ""}
        </span>
      </div>
    </div>
  );
}

export default async function RugbyU20Page() {
  const { failed, matches, updatedLabel, hasLive } = await getU20Data();

  const groups: { key: string; heading: string; matches: U20Match[] }[] = [];
  for (const m of matches) {
    let g = groups.find((x) => x.key === m.etDateKey);
    if (!g) {
      g = { key: m.etDateKey, heading: m.dateHeading, matches: [] };
      groups.push(g);
    }
    g.matches.push(m);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh intervalMs={hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/morts-logo.png"
            alt="Morts Bar"
            className="h-16 w-16 rounded-full shadow-lg ring-1 ring-white/10 sm:h-20 sm:w-20"
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

        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            World Rugby U20 Championship 2026 🌱
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">U20 World Cup</h1>
          <p className="mt-2 text-sm text-slate-400">
            Backing the Junior Boks 🇿🇦 · all times {ZONE_LABEL} · updated {updatedLabel} ·{" "}
            {hasLive ? <span className="font-medium text-rose-300">live — refreshing every minute</span> : "kicks off June 27"}
          </p>
        </header>

        {failed ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            Couldn&apos;t reach the U20 feed right now. It&apos;ll retry automatically — check back shortly.
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{g.heading}</h2>
                <div className="space-y-3">
                  {g.matches.map((m) => (
                    <Row key={m.id} m={m} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
