"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const FAVORITES_KEY = "tempdash.favorites.v1";

const CONDITIONS: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Freezing fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌧️" },
  67: { label: "Heavy freezing rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "🌨️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Showers", icon: "🌧️" },
  82: { label: "Heavy showers", icon: "🌧️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm w/ hail", icon: "⛈️" },
  99: { label: "Severe thunderstorm", icon: "⛈️" },
};
const UNKNOWN_CONDITION = { label: "Unknown", icon: "🌡️" };

type Identity = {
  id: string; // "lat,lon"
  name: string;
  region: string;
  countryCode: string; // lowercase ISO-2, e.g. "au"
  latitude: number;
  longitude: number;
};

type CityWeather = Identity & {
  tempF: number;
  windMph: number;
  condition: string;
  conditionIcon: string;
  utcOffsetSeconds: number;
};

type Unit = "F" | "C";

type GeoResp = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
    country_code?: string;
  }>;
};

type WxResp = {
  current: { temperature_2m: number; wind_speed_10m: number; weather_code: number };
  utc_offset_seconds: number;
};

// ---- Data --------------------------------------------------------------
async function geocode(name: string): Promise<Identity | null> {
  const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(name)}&count=1`);
  const geo = (await res.json()) as GeoResp;
  const p = geo.results?.[0];
  if (!p) return null;
  return {
    id: `${p.latitude},${p.longitude}`,
    name: p.name,
    region: p.admin1 ?? p.country ?? "",
    countryCode: (p.country_code ?? "").toLowerCase(),
    latitude: p.latitude,
    longitude: p.longitude,
  };
}

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `${WEATHER_URL}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,wind_speed_10m,weather_code` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`,
  );
  const wx = (await res.json()) as WxResp;
  const cond = CONDITIONS[wx.current.weather_code] ?? UNKNOWN_CONDITION;
  return {
    tempF: Math.round(wx.current.temperature_2m),
    windMph: Math.round(wx.current.wind_speed_10m),
    condition: cond.label,
    conditionIcon: cond.icon,
    utcOffsetSeconds: wx.utc_offset_seconds ?? 0,
  };
}

// ---- Gauge geometry ----------------------------------------------------
const MIN_F = -10;
const MAX_F = 110;
const SWEEP = 270;
const R = 74;

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

function tempColor(f: number) {
  if (f < 32) return "#38bdf8";
  if (f < 50) return "#22d3ee";
  if (f < 68) return "#34d399";
  if (f < 80) return "#fbbf24";
  if (f < 90) return "#fb923c";
  return "#f43f5e";
}

// ---- Local clock for a city -------------------------------------------
function cityClock(now: number | null, utcOffsetSeconds: number) {
  if (now == null) return "--:--";
  const d = new Date(now + utcOffsetSeconds * 1000);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ---- One gauge card ----------------------------------------------------
function GaugeCard({
  data,
  unit,
  now,
  isFavorite,
  onToggleFavorite,
  onRemove,
}: {
  data: CityWeather;
  unit: Unit;
  now: number | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRemove: () => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const angle = tempToAngle(data.tempF);
  const color = tempColor(data.tempF);
  const [tipX, tipY] = polar(angle, R);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-lg ring-1 ring-white/5">
      {/* header: favorite (left) · local clock + remove (right) */}
      <div className="mb-1 flex items-center justify-between">
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Unfavorite ${data.name}` : `Favorite ${data.name}`}
          aria-pressed={isFavorite}
          className={`text-lg transition-colors ${
            isFavorite ? "text-amber-400" : "text-slate-600 hover:text-amber-300"
          }`}
        >
          {isFavorite ? "★" : "☆"}
        </button>
        <span className="text-2xl leading-none" title={data.condition} aria-label={data.condition}>
          {data.conditionIcon}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-800/70 px-2 py-0.5 font-mono text-xs tabular-nums text-slate-300">
            {cityClock(now, data.utcOffsetSeconds)}
          </span>
          <button
            onClick={onRemove}
            aria-label={`Remove ${data.name}`}
            className="text-lg leading-none text-slate-600 hover:text-rose-400"
          >
            ×
          </button>
        </div>
      </div>

      <svg viewBox="0 0 200 160" className="w-full max-w-[240px] mx-auto">
        <defs>
          <linearGradient id={`g${uid}`} gradientUnits="userSpaceOnUse" x1="26" y1="170" x2="174" y2="30">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#34d399" />
            <stop offset="70%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <filter id={`glow${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* track */}
        <path
          d={arcPath(-SWEEP / 2, SWEEP / 2, R)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* progress */}
        <path
          d={arcPath(-SWEEP / 2, angle, R)}
          fill="none"
          stroke={`url(#g${uid})`}
          strokeWidth="12"
          strokeLinecap="round"
          filter={`url(#glow${uid})`}
          style={{ transition: "all 0.9s cubic-bezier(.3,1.1,.5,1)" }}
        />
        {/* glowing tip */}
        <circle cx={tipX} cy={tipY} r="6" fill={color} filter={`url(#glow${uid})`}
          style={{ transition: "all 0.9s cubic-bezier(.3,1.1,.5,1)" }} />
        <circle cx={tipX} cy={tipY} r="2.5" fill="#0b1220"
          style={{ transition: "all 0.9s cubic-bezier(.3,1.1,.5,1)" }} />

        {/* center readout — primary unit big, the other right below */}
        <text x="100" y="92" textAnchor="middle" fontSize="38" fontWeight="800" fill={color}>
          {toUnit(data.tempF, unit)}°{unit}
        </text>
        <text x="100" y="116" textAnchor="middle" fontSize="15" fontWeight="600" fill="#94a3b8">
          {toUnit(data.tempF, unit === "F" ? "C" : "F")}°{unit === "F" ? "C" : "F"}
        </text>

        {/* end labels */}
        <text x={polar(-SWEEP / 2, R - 16)[0]} y={polar(-SWEEP / 2, R - 16)[1] + 4} textAnchor="middle" fontSize="9" fill="#475569">
          {toUnit(MIN_F, unit)}°
        </text>
        <text x={polar(SWEEP / 2, R - 16)[0]} y={polar(SWEEP / 2, R - 16)[1] + 4} textAnchor="middle" fontSize="9" fill="#475569">
          {toUnit(MAX_F, unit)}°
        </text>
      </svg>

      {/* city + flag */}
      <div className="mt-1 flex items-center justify-center gap-2">
        {data.countryCode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://flagcdn.com/w40/${data.countryCode}.png`}
            alt=""
            width={22}
            height={15}
            className="h-[15px] w-[22px] rounded-sm object-cover ring-1 ring-white/10"
          />
        )}
        <span className="font-semibold text-white">{data.name}</span>
      </div>
      <p className="text-center text-sm text-slate-400">
        {data.region ? `${data.region} · ` : ""}
        {data.conditionIcon} {data.condition} · wind {data.windMph} mph
      </p>
    </div>
  );
}

// ---- The dashboard -----------------------------------------------------
export default function DashboardPage() {
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<Unit>("F");
  const [maxCities, setMaxCities] = useState<number | null>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const loadedRef = useRef(false);

  const citiesRef = useRef<CityWeather[]>([]);
  citiesRef.current = cities;

  const addCity = useCallback(
    async (name: string, opts?: { favorite?: boolean; silent?: boolean }) => {
      if (!name.trim()) return;
      if (!opts?.silent && maxCities !== null && citiesRef.current.length >= maxCities) {
        setError(`Dashboard is full (${maxCities} cities). Remove one or raise the limit.`);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const idn = await geocode(name);
        if (!idn) {
          setError(`No city found matching "${name}".`);
          return;
        }
        if (citiesRef.current.some((c) => c.id === idn.id)) {
          setError(`${idn.name} is already on the dashboard.`);
          return;
        }
        const w = await fetchWeather(idn.latitude, idn.longitude);
        setCities((prev) => [...prev, { ...idn, ...w }]);
        if (opts?.favorite) setFavorites((prev) => new Set(prev).add(idn.id));
        setQuery("");
      } catch {
        setError("Couldn't fetch weather. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [maxCities],
  );

  // Restore favorites from localStorage on first load (re-fetch their weather).
  useEffect(() => {
    let stored: Identity[] = [];
    try {
      stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as Identity[];
    } catch {
      stored = [];
    }
    (async () => {
      if (stored.length) {
        const restored = await Promise.all(
          stored.map(async (idn) => {
            try {
              return { ...idn, ...(await fetchWeather(idn.latitude, idn.longitude)) } as CityWeather;
            } catch {
              return null;
            }
          }),
        );
        const ok = restored.filter((c): c is CityWeather => c !== null);
        setCities(ok);
        setFavorites(new Set(ok.map((c) => c.id)));
      } else {
        await addCity("Pittsboro", { silent: true });
      }
      loadedRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist favorites whenever they change (after the initial restore).
  useEffect(() => {
    if (!loadedRef.current) return;
    const favCities = cities.filter((c) => favorites.has(c.id));
    const identities: Identity[] = favCities.map(({ id, name, region, countryCode, latitude, longitude }) => ({
      id,
      name,
      region,
      countryCode,
      latitude,
      longitude,
    }));
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(identities));
    } catch {
      /* ignore quota / unavailable */
    }
  }, [cities, favorites]);

  // Tick the local clocks every second.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh every city's weather once a minute.
  useEffect(() => {
    const refresh = async () => {
      const updates = await Promise.all(
        citiesRef.current.map(async (c) => {
          try {
            return { id: c.id, w: await fetchWeather(c.latitude, c.longitude) };
          } catch {
            return null;
          }
        }),
      );
      const byId = new Map(updates.filter(Boolean).map((u) => [u!.id, u!.w]));
      setCities((prev) => prev.map((c) => (byId.has(c.id) ? { ...c, ...byId.get(c.id)! } : c)));
    };
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeCity(id: string) {
    setCities((prev) => prev.filter((c) => c.id !== id));
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-white">Temp dashboard</h1>
            <p className="text-slate-400">
              {cities.length}
              {maxCities !== null ? `/${maxCities}` : ""} cities · ★ favorites are saved · auto-updates every minute
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            Max cities
            <select
              value={maxCities ?? "unlimited"}
              onChange={(e) => setMaxCities(e.target.value === "unlimited" ? null : Number(e.target.value))}
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
            >
              {[3, 5, 8, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
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
                  unit === u ? "bg-sky-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
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
            <GaugeCard
              key={c.id}
              data={c}
              unit={unit}
              now={now}
              isFavorite={favorites.has(c.id)}
              onToggleFavorite={() => toggleFavorite(c.id)}
              onRemove={() => removeCity(c.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
