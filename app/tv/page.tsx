import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import { IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";
import { getMultiSportDay } from "../lib/todaysGames";
import TvClient from "./TvClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Morts Bar — Sports TV",
  description: "Full-screen rotating scoreboard for the bar TV — every sport with a game today, plus standings.",
};

export default async function TvPage() {
  const { sports, fixtures, updatedLabel } = await getMultiSportDay();
  const hasLive = sports.some((s) => s.games.some((g) => g.phase === "live"));

  return (
    <>
      {/* refresh fast while a game is live, lazily otherwise */}
      <AutoRefresh intervalMs={hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
      <TvClient sports={sports} fixtures={fixtures} updatedLabel={updatedLabel} />
    </>
  );
}
