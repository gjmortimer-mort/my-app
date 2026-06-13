"use client";

import { useEffect, useState } from "react";

// Morts Bar's spot — Pittsboro / Old Graham, NC (US Eastern).
const LAT = 35.72;
const LON = -79.18;
const TZ = "America/New_York";

const ICONS: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️", 56: "🌧️", 57: "🌧️",
  61: "🌦️", 63: "🌧️", 65: "🌧️", 66: "🌧️", 67: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️", 77: "🌨️",
  80: "🌦️", 81: "🌧️", 82: "🌧️", 85: "🌨️", 86: "❄️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

export default function BarWeather() {
  const [time, setTime] = useState<string | null>(null);
  const [wx, setWx] = useState<{ f: number; c: number; icon: string } | null>(null);

  useEffect(() => {
    const tick = () =>
      setTime(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
        );
        const d = (await res.json()).current;
        const f = Math.round(d.temperature_2m);
        setWx({ f, c: Math.round(((f - 32) * 5) / 9), icon: ICONS[d.weather_code] ?? "🌡️" });
      } catch {
        /* leave previous reading */
      }
    };
    load();
    const id = setInterval(load, 600_000); // refresh every 10 min
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 px-2.5 py-1 text-sm text-slate-300" title="Pittsboro, NC">
      <span className="tabular-nums">{time}</span>
      <span className="text-slate-600">·</span>
      <span className="font-medium text-slate-200">Pittsboro</span>
      {wx && (
        <>
          <span aria-hidden className="text-base leading-none">{wx.icon}</span>
          <span className="tabular-nums">
            {wx.f}°F <span className="text-slate-500">/</span> {wx.c}°C
          </span>
        </>
      )}
    </div>
  );
}
