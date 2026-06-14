import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import NavBar from "./NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Morts Bar on Old Graham",
  description: "Your home for live sport — World Cup soccer & rugby, cricket, NFL, AFL, NBA, NHL.",
  appleWebApp: { capable: true, title: "Morts Bar", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
