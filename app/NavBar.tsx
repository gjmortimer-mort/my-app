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
  const [open, setOpen] = useState<string | null>(null); // desktop dropdown
  const [mobile, setMobile] = useState(false);
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

  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);

  const link = (i: Item, extra = "") => (
    <Link
      key={i.href}
      href={i.href}
      aria-current={pathname === i.href ? "page" : undefined}
      className={`${base} ${pathname === i.href ? activeCls : idleCls} ${extra}`}
    >
      {i.label}
    </Link>
  );

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
            {items.map((i) => link(i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur print:hidden">
      <div ref={ref} className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 sm:px-6">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`${base} font-semibold ${pathname === "/" ? activeCls : idleCls}`}
        >
          🍺 Morts Bar
        </Link>

        {/* desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <Dropdown id="rugby" label="🏉 Rugby" items={RUGBY} />
          <Dropdown id="other" label="🏆 Other Sports" items={OTHER} />
          {LINKS.map((l) => link(l))}
        </div>

        {/* right: weather + mobile toggle */}
        <div className="ml-auto flex items-center gap-2">
          <BarWeather />
          <button
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobile}
            className={`${base} text-lg leading-none md:hidden ${mobile ? activeCls : idleCls}`}
          >
            {mobile ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {mobile && (
        <div className="border-t border-slate-800 px-3 py-3 md:hidden">
          <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Rugby</p>
          <div className="flex flex-col gap-0.5">{RUGBY.map((i) => link(i, "block"))}</div>
          <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Other sports</p>
          <div className="flex flex-col gap-0.5">{OTHER.map((i) => link(i, "block"))}</div>
          <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">More</p>
          <div className="flex flex-col gap-0.5">{LINKS.map((i) => link(i, "block"))}</div>
        </div>
      )}
    </nav>
  );
}
