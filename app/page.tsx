import Link from "next/link";

const apps = [
  {
    href: "/dashboard",
    name: "Temp dashboard",
    description:
      "Track live temperatures for up to 5 cities at once on animated gauges, with °F/°C switching.",
    accent: "from-sky-500/20 to-sky-500/0",
    ring: "group-hover:border-sky-500/60",
  },
  {
    href: "/weather",
    name: "Weather check",
    description:
      "Look up the current conditions for any city — a quick single-location forecast.",
    accent: "from-emerald-500/20 to-emerald-500/0",
    ring: "group-hover:border-emerald-500/60",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <header className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
            Live on the web
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            My apps
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            A home for the things I&apos;m building. Pick one below to open it.
          </p>
        </header>

        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-colors ${app.ring}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${app.accent} opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative">
                <h2 className="text-xl font-semibold text-white">{app.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {app.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-300">
                  Open
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
