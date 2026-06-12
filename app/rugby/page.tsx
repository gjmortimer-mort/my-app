import type { Metadata } from "next";
import Tournament from "../Tournament";

export const revalidate = 3600;

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
        links: [
          { href: "/", label: "Soccer World Cup 2026" },
          { href: "/dashboard", label: "City Temperature Dashboard" },
        ],
      }}
    />
  );
}
