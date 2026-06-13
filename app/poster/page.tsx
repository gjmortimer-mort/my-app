import type { Metadata } from "next";
import QRCode from "qrcode";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Morts Bar — Scan for Scores",
  description: "Printable QR poster linking patrons to the live World Cup scores.",
};

const SITE_URL = "https://worldcup.mortimerfamily.com";

export default async function PosterPage() {
  const qrSvg = await QRCode.toString(SITE_URL, {
    type: "svg",
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-6 print:bg-white print:p-0">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center text-slate-900 shadow-2xl print:rounded-none print:shadow-none">
        <div className="flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://flagcdn.com/w160/za.png" alt="South Africa" className="h-7 w-auto rounded-sm ring-1 ring-black/10" />
          <span
            className="text-2xl text-amber-700"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Morts Bar on Old Graham
          </span>
        </div>

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Live World Cup Scores</h1>
        <p className="mt-2 text-slate-500">Scan to follow every match on your phone</p>

        <div
          className="mx-auto mt-8 w-64 max-w-full [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
          aria-label="QR code"
        />

        <p className="mt-6 text-lg font-semibold text-slate-700">worldcup.mortimerfamily.com</p>
        <p className="mt-2 text-sm text-slate-400">⚽ Soccer · 🏉 Rugby · Live scores · Standings · Countdown</p>
      </div>

      <PrintButton />
    </div>
  );
}
