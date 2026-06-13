import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import Footer from "../Footer";

export const metadata: Metadata = {
  title: "Morts Bar — Socials",
  description: "Follow @morts.bar for all the soccer, rugby and cricket action from the bar.",
};

const IG_HANDLE = "morts.bar";
const IG_URL = `https://instagram.com/${IG_HANDLE}`;

const SPORTS = [
  { emoji: "⚽", name: "Soccer", href: "/", ring: "hover:border-emerald-500/60", glow: "from-emerald-500/20" },
  { emoji: "🏉", name: "Rugby", href: "/rugby", ring: "hover:border-amber-500/60", glow: "from-amber-500/20" },
  { emoji: "🏏", name: "Cricket", href: "/cricket", ring: "hover:border-sky-500/60", glow: "from-sky-500/20" },
];

export default async function SocialsPage() {
  const qrSvg = await QRCode.toString(IG_URL, {
    type: "svg",
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://flagcdn.com/w640/za.png"
            alt="Flag of South Africa"
            className="h-16 w-auto rounded-md shadow-lg ring-1 ring-white/10 sm:h-20"
          />
          <span
            className="text-2xl leading-tight text-amber-300 sm:text-4xl"
            style={{
              fontFamily: "var(--font-display)",
              textShadow: "0 0 8px rgba(251,191,36,0.55), 0 0 22px rgba(251,191,36,0.35)",
            }}
          >
            Morts Bar on Old Graham
          </span>
        </div>

        {/* hero */}
        <header className="mb-10">
          <div className="text-4xl">⚽🏉🏏</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Game day, every day</h1>
          <p className="mt-2 max-w-xl text-slate-400">
            Soccer, rugby and cricket — all the action, scores and atmosphere from the bar, mixed up and posted to{" "}
            <span className="font-medium text-white">@{IG_HANDLE}</span>.
          </p>
        </header>

        {/* Instagram follow card */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600/20 via-rose-500/15 to-amber-500/20 p-px">
          <div className="rounded-3xl bg-slate-900/90 p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-300">📸 Instagram</p>
                <p className="mt-1 text-2xl font-bold text-white">@{IG_HANDLE}</p>
                <p className="mt-2 max-w-xs text-sm text-slate-400">
                  Follow for match-day specials, live atmosphere and every big moment across the three codes.
                </p>
                <a
                  href={IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
                >
                  Follow @{IG_HANDLE} →
                </a>
              </div>
              <div className="shrink-0 text-center">
                <div
                  className="mx-auto h-36 w-36 rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  aria-label={`QR code to @${IG_HANDLE} on Instagram`}
                />
                <p className="mt-2 text-xs text-slate-500">Scan to follow</p>
              </div>
            </div>
          </div>
        </section>

        {/* three sports cross-links */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {SPORTS.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center transition-colors ${s.ring}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.glow} to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative">
                <div className="text-4xl">{s.emoji}</div>
                <div className="mt-2 font-semibold text-white">{s.name}</div>
                <div className="mt-0.5 text-xs text-slate-400">Live scores &amp; fixtures</div>
              </div>
            </Link>
          ))}
        </section>

        {/* feed placeholder — drops in once a feed source is connected */}
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Latest from @{IG_HANDLE}
          </h2>
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
            <p>The live post feed will appear here once the account is connected.</p>
            <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-medium text-fuchsia-300 hover:text-fuchsia-200">
              See the latest on Instagram →
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
