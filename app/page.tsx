import Tournament from "./Tournament";

// Refresh the cached data at most once an hour (ISR). The client <AutoRefresh>
// inside Tournament then pulls the latest copy into open tabs on the same cadence.
export const revalidate = 3600;

export default function Home() {
  return (
    <Tournament
      config={{
        leagueId: "4429",
        season: "2026",
        badge: "FIFA World Cup 2026",
        groupWord: "Group",
        rounds: [1, 2, 3],
        links: [
          { href: "/rugby", label: "Rugby World Cup 2027" },
          { href: "/dashboard", label: "City Temperature Dashboard" },
        ],
      }}
    />
  );
}
