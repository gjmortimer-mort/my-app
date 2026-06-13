const BAR = {
  name: "Morts Bar on Old Graham",
  blurb: "All the soccer, rugby and cricket action — from my place to yours.",
  instagram: "morts.bar",
};

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-900/40">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
        <p
          className="text-2xl text-amber-300"
          style={{
            fontFamily: "var(--font-display)",
            textShadow: "0 0 8px rgba(251,191,36,0.5), 0 0 20px rgba(251,191,36,0.3)",
          }}
        >
          {BAR.name}
        </p>
        <p className="max-w-xs text-sm leading-6 text-slate-400">{BAR.blurb}</p>
        <a
          href={`https://instagram.com/${BAR.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-500 px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          📷 @{BAR.instagram}
        </a>
      </div>
      <div className="border-t border-slate-800/60 px-4 py-4 text-center text-xs text-slate-600 sm:px-6">
        Scores &amp; fixtures from TheSportsDB · times shown in US Eastern (EST)
      </div>
    </footer>
  );
}
