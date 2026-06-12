"use client";

import { useEffect, useState } from "react";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

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

type CityWeather = {
  id: string;
  city: string;
  region: string;
  tempF: number;
  windMph: number;
  condition: string;
};

type Unit = "F" | "C";

// ---- Gauge geometry ----------------------------------------------------
const MIN_F = -10;
const MAX_F = 110;
const SWEEP = 240;
const REDLINE_F = 90;

function polar(angle: number, r: number): [number, number] {
  const rad = (angle * Math.PI) / 180;
  return [100 + r * Math.sin(rad), 100 - r * Math.cos(rad)];
}

function arcPath(start: number, end: number, r: number) {
  const [x1, y1] = polar(start, r);
  const [x2, y2] = polar(end, r);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function tempToAngle(tempF: number) {
  const clamped = Math.max(MIN_F, Math.min(MAX_F, tempF));
  return -SWEEP / 2 + ((clamped - MIN_F) / (MAX_F - MIN_F)) * SWEEP;
}

function toUnit(tempF: number, unit: Unit) {
  return unit === "F" ? tempF : Math.round(((tempF - 32) * 5) / 9);
}

// ---- One gauge ---------------------------------------------------------
function Gauge({
  data,
  unit,
  onRemove,
}: {
  data: CityWeather;
  unit: Unit;
  onRemove: () => void;
}) {
  const angle = tempToAngle(data.tempF);
  const inRedline = data.tempF >= REDLINE_F;

  const ticks = [];
  for (let t = MIN_F; t <= MAX_F; t += 12) ticks.push(t);

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col items-center">
      <button
        onClick={onRemove}
        aria-label={`Remove ${data.city}`}
        className="absolute top-2 right-3 text-slate-600 hover:text-rose-400 text-lg"
      >
        ×
      </button>

      <svg viewBox="0 0 200 150" className="w-full max-w-[220px]">
        <path
          d={arcPath(-SWEEP / 2, SWEEP / 2, 70)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={arcPath(tempToAngle(REDLINE_F), SWEEP / 2, 70)}
          fill="none"
          stroke="#e11d48"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.85"
        />
        {ticks.map((t) => {
          const a = tempToAngle(t);
          const [x1, y1] = polar(a, 56);
          const [x2, y2] = polar(a, 62);
          return (
            <line
              key={t}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#475569"
              strokeWidth="2"
            />
          );
        })}
        {[MIN_F, (MIN_F + MAX_F) / 2, MAX_F].map((t) => {
          const [x, y] = polar(tempToAngle(t), 44);
          return (
            <text
              key={t}
              x={x}
              y={y + 3}
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
            >
              {toUnit(t, unit)}°
            </text>
          );
        })}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "100px 100px",
            transition: "transform 0.9s cubic-bezier(.3,1.4,.5,1)",
          }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="38"
            stroke={inRedline ? "#e11d48" : "#38bdf8"}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle cx="100" cy="100" r="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
        <text
          x="100"
          y="132"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill={inRedline ? "#fb7185" : "#f1f5f9"}
        >
          {toUnit(data.tempF, unit)}°{unit}
        </text>
      </svg>

      <p className="text-white font-medium mt-1">
        {data.city}
        {data.region ? `, ${data.region}` : ""}
      </p>
      <p className="text-slate-400 text-sm">
        {data.condition} · wind {data.windMph} mph
      </p>
    </div>
  );
}

// ---- The dashboard -----------------------------------------------------
export default function DashboardPage() {
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<Unit>("F");
  const [maxCities, setMaxCities] = useState<number | null>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchCity(name: string): Promise<CityWeather | null> {
    const geoRes = await fetch(`${GEO_URL}?name=${encodeURIComponent(name)}&count=1`);
    const geo = await geoRes.json();
    if (!geo.results?.length) return null;
    const place = geo.results[0];

    const wxRes = await fetch(
      `${WEATHER_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&current=temperature_2m,wind_speed_10m,weather_code` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph`
    );
    const wx = await wxRes.json();

    return {
      id: `${place.latitude},${place.longitude}`,
      city: place.name,
      region: place.admin1 ?? place.country ?? "",
      tempF: Math.round(wx.current.temperature_2m),
      windMph: Math.round(wx.current.wind_speed_10m),
      condition: CONDITIONS[wx.current.weather_code] ?? "Unknown",
    };
  }

  async function addCity(name: string) {
    if (!name.trim()) return;
    if (maxCities !== null && cities.length >= maxCities) {
      setError(`Dashboard is full (${maxCities} cities). Remove one or raise the limit.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchCity(name);
      if (!result) {
        setError(`No city found matching "${name}".`);
      } else if (cities.some((c) => c.id === result.id)) {
        setError(`${result.city} is already on the dashboard.`);
      } else {
        setCities((prev) => [...prev, result]);
        setQuery("");
      }
    } catch {
      setError("Couldn't fetch weather. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Load the default city once, when the page first opens
  useEffect(() => {
    addCity("Pittsboro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-white">Temp dashboard</h1>
            <p className="text-slate-400">
              {cities.length}{maxCities !== null ? `/${maxCities}` : ""} cities on the board
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            Max cities
            <select
              value={maxCities ?? "unlimited"}
              onChange={(e) =>
                setMaxCities(e.target.value === "unlimited" ? null : Number(e.target.value))
              }
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
            >
              {[3, 5, 8, 10, 15].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value="unlimited">Unlimited</option>
            </select>
          </label>
          <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
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
        </div>

        <div className="flex gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCity(query)}
            placeholder="Add a city…"
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={() => addCity(query)}
            disabled={loading || (maxCities !== null && cities.length >= maxCities)}
            className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-5 py-2 font-medium text-white"
          >
            {loading ? "Loading…" : "Add city"}
          </button>
        </div>
        {error && <p className="text-rose-400 mb-2">{error}</p>}

        <div className="grid gap-4 mt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <Gauge
              key={c.id}
              data={c}
              unit={unit}
              onRemove={() => setCities((prev) => prev.filter((x) => x.id !== c.id))}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
