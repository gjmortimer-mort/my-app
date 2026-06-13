import type { Metadata } from "next";
import Tournament from "../Tournament";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Soccer World Cup 2026 — Results & Fixtures",
  description: "Live World Cup 2026 scores and fixtures, kickoff times in Eastern, refreshed every minute during games.",
};

export default function SoccerPage() {
  return (
    <Tournament
      config={{
        leagueId: "4429",
        season: "2026",
        badge: "FIFA World Cup 2026",
        groupWord: "Group",
        rounds: [1, 2, 3],
        pointsScheme: "soccer",
        teams: [
          { key: "South Africa", label: "🇿🇦 South Africa" },
          { key: "Australia", label: "🇦🇺 Australia" },
          { key: "New Zealand", label: "🇳🇿 New Zealand" },
        ],
      }}
    />
  );
}
