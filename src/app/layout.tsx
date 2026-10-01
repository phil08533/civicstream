import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE_URL } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL + "/"),
  title: { default: "CivicStream — Government information, organized.", template: "%s | CivicStream" },
  description: "Searchable U.S. government information from official sources: Congress.gov and the Federal Register, with links to the original records.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-5 px-4 py-3 text-sm">
            <Link href="/" className="text-lg font-bold text-[--color-ink] no-underline">CivicStream</Link>
            <Link href="/legislation/" className="hover:underline">Legislation</Link>
            <Link href="/documents/" className="hover:underline">Federal Register</Link>
            <Link href="/search/" className="ml-auto rounded bg-blue-700 px-3 py-1 font-medium text-white no-underline">Search</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-600">
          <p>CivicStream republishes metadata from official U.S. government sources and always links to the original record. It is independent and not affiliated with any government agency. Content is presented neutrally; CivicStream takes no political position.</p>
          <p className="mt-2"><Link href="/about/" className="underline">About &amp; sources</Link></p>
        </footer>
      </body>
    </html>
  );
}
