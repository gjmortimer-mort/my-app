import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import { getTournamentData, IDLE_REFRESH_MS, LIVE_REFRESH_MS } from "../lib/tournamentData";
import TvClient from "./TvClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Morts Bar — World Cup TV",
  description: "Full-screen rotating World Cup scores, fixtures, and standings for the bar TV.",
};

export default async function TvPage() {
  const { matches, standings, fixtures, updatedLabel, hasLive } = await getTournamentData({
    leagueId: "4429",
    season: "2026",
    groupWord: "Group",
    rounds: [1, 2, 3],
    pointsScheme: "soccer",
  });

  return (
    <>
      {/* refresh fast while a game is live, lazily otherwise */}
      <AutoRefresh intervalMs={hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
      <TvClient matches={matches} standings={standings} fixtures={fixtures} updatedLabel={updatedLabel} />
    </>
  );
}
