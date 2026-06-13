// Edit these details and they update across the whole site.
// (Tell Claude the real address / hours / socials and they'll be filled in.)
export const BAR = {
  name: "Morts Bar on Old Graham",
  blurb: "Your home for the World Cup — football, rugby and more. Cold drinks, big screens, every match.",
  address: "Old Graham", // TODO: full street address
  hours: [
    { days: "Mon – Thu", time: "Hours to confirm" },
    { days: "Fri – Sat", time: "Hours to confirm" },
    { days: "Sunday", time: "Hours to confirm" },
  ],
  phone: "", // e.g. "+27 ..." — shown only when set
  instagram: "", // handle without @ — shown only when set
};

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-900/40">
      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6">
        <div>
          <p
            className="text-2xl text-amber-300"
            style={{
              fontFamily: "var(--font-display)",
              textShadow: "0 0 8px rgba(251,191,36,0.5), 0 0 20px rgba(251,191,36,0.3)",
            }}
          >
            {BAR.name}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">{BAR.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {BAR.phone && (
              <a href={`tel:${BAR.phone.replace(/\s/g, "")}`} className="text-slate-300 hover:text-white">
                📞 {BAR.phone}
              </a>
            )}
            {BAR.instagram && (
              <a
                href={`https://instagram.com/${BAR.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white"
              >
                📷 @{BAR.instagram}
              </a>
            )}
          </div>
        </div>

        <div className="sm:text-right">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Find us</h3>
          <p className="mt-2 text-sm text-slate-300">📍 {BAR.address}</p>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Opening hours</h3>
          <dl className="mt-2 space-y-1 text-sm text-slate-400">
            {BAR.hours.map((h) => (
              <div key={h.days} className="flex justify-between gap-6 sm:justify-end">
                <dt>{h.days}</dt>
                <dd className="text-slate-300">{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-t border-slate-800/60 px-4 py-4 text-center text-xs text-slate-600 sm:px-6">
        Scores &amp; fixtures from TheSportsDB · times shown in US Eastern (EST)
      </div>
    </footer>
  );
}
