import type { Metadata } from "next";
import Tournament from "../Tournament";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rugby World Cup 2027 — Results & Fixtures",
  description: "Rugby World Cup 2027 (Australia) scores and fixtures, kickoff times in Eastern, refreshed hourly.",
};

export default function RugbyPage() {
  return (
    <Tournament
      config={{
        leagueId: "4574",
        season: "2027",
        badge: "Rugby World Cup 2027 · Australia",
        groupWord: "Pool",
        rounds: [1, 2, 3],
        teamSuffix: " Rugby",
        pointsScheme: "rugby",
        sport: "Rugby",
        pointsNote: "Rugby points: win 4, draw 2 (try/losing bonus points not included).",
        teams: [
          { key: "South Africa", label: "🇿🇦 South Africa" },
          { key: "Australia", label: "🇦🇺 Australia" },
          { key: "New Zealand", label: "🇳🇿 New Zealand" },
        ],
      }}
    />
  );
}
