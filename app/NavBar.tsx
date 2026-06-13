"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BarWeather from "./BarWeather";

type Item = { href: string; label: string };

const RUGBY: Item[] = [
  { href: "/rugby", label: "🏆 Rugby World Cup" },
  { href: "/rugby-internationals", label: "🌍 International Season" },
  { href: "/rugby-u20", label: "🌱 U20 World Cup" },
];

const OTHER: Item[] = [
  { href: "/soccer", label: "⚽ Soccer World Cup" },
  { href: "/cricket", label: "🏏 Cricket" },
  { href: "/nfl", label: "🏈 NFL" },
  { href: "/afl", label: "🏉 AFL" },
  { href: "/nba-finals", label: "🏀 NBA Finals" },
  { href: "/stanley-cup", label: "🏒 Stanley Cup" },
];

const LINKS: Item[] = [
  { href: "/socials", label: "📸 Socials" },
  { href: "/tv", label: "📺 TV mode" },
  { href: "/dashboard", label: "🌡️ Temperature Dashboard" },
];

const base = "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors";
const activeCls = "bg-sky-600 text-white";
const idleCls = "text-slate-400 hover:bg-slate-800 hover:text-white";

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => setOpen(null), [pathname]);

  const Dropdown = ({ id, label, items }: { id: string; label: string; items: Item[] }) => {
    const activeHere = items.some((i) => i.href === pathname);
    const isOpen = open === id;
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(isOpen ? null : id)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={`${base} flex items-center gap-1.5 ${activeHere ? activeCls : idleCls}`}
        >
          {label}
          <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
        {isOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-1 flex min-w-[15rem] flex-col gap-0.5 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl"
          >
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                role="menuitem"
                aria-current={pathname === i.href ? "page" : undefined}
                className={`${base} ${pathname === i.href ? activeCls : idleCls}`}
              >
                {i.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur print:hidden">
      <div ref={ref} className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2 sm:gap-2 sm:px-6">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`${base} mr-1 font-semibold ${pathname === "/" ? activeCls : idleCls}`}
        >
          🍺 Morts Bar
        </Link>

        <Dropdown id="rugby" label="🏉 Rugby" items={RUGBY} />
        <Dropdown id="other" label="🏆 Other Sports" items={OTHER} />

        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={pathname === l.href ? "page" : undefined}
            className={`${base} ${pathname === l.href ? activeCls : idleCls}`}
          >
            {l.label}
          </Link>
        ))}

        <div className="ml-auto">
          <BarWeather />
        </div>
      </div>
    </nav>
  );
}
