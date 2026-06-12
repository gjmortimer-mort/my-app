import type { Metadata } from "next";
import AutoRefresh from "../AutoRefresh";
import { getTournamentData } from "../lib/tournamentData";
import TvClient from "./TvClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Morts Bar — World Cup TV",
  description: "Full-screen rotating World Cup scores, fixtures, and standings for the bar TV.",
};

export default async function TvPage() {
  const { matches, standings, fixtures, updatedLabel } = await getTournamentData({
    leagueId: "4429",
    season: "2026",
    groupWord: "Group",
    rounds: [1, 2, 3],
    pointsScheme: "soccer",
  });

  return (
    <>
      {/* refresh the data into the open TV tab every 5 minutes */}
      <AutoRefresh intervalMs={300_000} />
      <TvClient matches={matches} standings={standings} fixtures={fixtures} updatedLabel={updatedLabel} />
    </>
  );
}
