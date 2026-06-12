"use client";

import { useState } from "react";

// Open-Meteo is free and needs no API key — perfect for testing.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// Open-Meteo returns a numeric "weather code" — this maps it to words.
const CONDITIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  51: "Light drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  80: "Rain showers",
  95: "Thunderstorm",
};

type Weather = {
  city: string;
  region: string;
  tempF: number;
  windMph: number;
  condition: string;
};

export default function WeatherPage() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState<"F" | "C">("F");

  async function lookUpWeather() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // Step 1: turn the city name into coordinates
      const geoRes = await fetch(
        `${GEO_URL}?name=${encodeURIComponent(query)}&count=1`
      );
      const geo = await geoRes.json();
      if (!geo.results?.length) {
        setError(`No city found matching "${query}". Try another spelling.`);
        return;
      }
      const place = geo.results[0];

      // Step 2: fetch current weather for those coordinates
      const wxRes = await fetch(
        `${WEATHER_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
          `&current=temperature_2m,wind_speed_10m,weather_code` +
          `&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
      const wx = await wxRes.json();

      setWeather({
        city: place.name,
        region: place.admin1 ?? place.country ?? "",
        tempF: Math.round(wx.current.temperature_2m),
        windMph: Math.round(wx.current.wind_speed_10m),
        condition: CONDITIONS[wx.current.weather_code] ?? "Unknown",
      });
    } catch {
      setError("Something went wrong fetching the weather. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold text-white mb-1">Weather check</h1>
        <p className="text-slate-400 mb-6">
          If this works, your whole pipeline works.
        </p>
        <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden mb-4">
  {(["F", "C"] as const).map((u) => (
    <button
      key={u}
      onClick={() => setUnit(u)}
      className={`px-4 py-1.5 text-sm font-medium ${
        unit === u
          ? "bg-sky-600 text-white"
          : "bg-slate-900 text-slate-400 hover:text-white"
      }`}
    >
      °{u}
    </button>
  ))}
</div>

        <div className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookUpWeather()}
            placeholder="Enter a city…"
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={lookUpWeather}
            disabled={loading}
            className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-5 py-2 font-medium text-white"
          >
            {loading ? "Loading…" : "Get weather"}
          </button>
        </div>

        {error && <p className="text-rose-400">{error}</p>}

        {weather && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400 text-sm">
              {weather.city}
              {weather.region ? `, ${weather.region}` : ""}
            </p>
            <p className="text-5xl font-bold text-white my-2">
              {weather.tempF}°F
            </p>
            <p className="text-slate-300">{weather.condition}</p>
            <p className="text-slate-500 text-sm mt-1">
              Wind {weather.windMph} mph
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
