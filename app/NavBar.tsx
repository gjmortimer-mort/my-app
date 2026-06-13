"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SPORTS = [
  { href: "/", label: "⚽ Soccer World Cup" },
  { href: "/rugby", label: "🏉 Rugby World Cup" },
  { href: "/cricket", label: "🏏 Cricket" },
  { href: "/nfl", label: "🏈 NFL" },
  { href: "/afl", label: "🏉 AFL" },
];

const LINKS = [
  { href: "/socials", label: "📸 Socials" },
  { href: "/tv", label: "📺 TV mode" },
  { href: "/dashboard", label: "🌡️ Temperature Dashboard" },
];

const base = "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors";
const activeCls = "bg-sky-600 text-white";
const idleCls = "text-slate-400 hover:bg-slate-800 hover:text-white";

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeSport = SPORTS.find((s) => s.href === pathname);

  // Close the dropdown on outside click, Escape, or navigation.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2 sm:gap-2 sm:px-6">
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className={`${base} flex items-center gap-1.5 ${activeSport ? activeCls : idleCls}`}
          >
            🏆 Sports
            <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute left-0 top-full z-50 mt-1 flex min-w-[15rem] flex-col gap-0.5 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl"
            >
              {SPORTS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  role="menuitem"
                  aria-current={pathname === s.href ? "page" : undefined}
                  className={`${base} ${pathname === s.href ? activeCls : idleCls}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          )}
        </div>

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
      </div>
    </nav>
  );
}
