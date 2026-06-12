"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/", label: "⚽ Soccer World Cup" },
  { href: "/rugby", label: "🏉 Rugby World Cup" },
  { href: "/dashboard", label: "🌡️ Temperature Dashboard" },
  { href: "/tv", label: "📺 TV mode" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2 sm:gap-2 sm:px-6">
        {PAGES.map((p) => {
          const active = pathname === p.href;
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-sky-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
